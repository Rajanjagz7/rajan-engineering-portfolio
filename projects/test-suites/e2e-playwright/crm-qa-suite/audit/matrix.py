"""One-variable-at-a-time matrix engine (audit brief Steps 2-6)."""
from __future__ import annotations

from dataclasses import dataclass, field as dfield
from typing import Callable

from cases import COARSE, cases_for, expected, length_probe
from core import OMIT, Audit, clone, deep_get, deep_set

STR_KINDS = ("str", "text", "email", "key", "domain", "url", "phone")


@dataclass
class Field:
    path: tuple
    kind: str                     # str text email phone domain url key currency int qty num enum bool date datetime tz id array
    optional: bool = True         # may the field be omitted / null?
    enum: list | None = None
    item: Callable | None = None  # array fields: item(i) -> element
    note: str = ""
    readback: bool = True         # compare stored value after an accepted write
    judge: bool = True            # False: validity depends on other fields, so never auto-flag accept/reject

    @property
    def name(self):
        return ".".join(str(p) for p in self.path)


@dataclass
class Op:
    key: str                              # "contacts.create"
    method: str
    path: Callable                        # ctx -> request path
    baseline: Callable                    # ctx -> known-good body
    fields: list
    kind: str = "create"                  # create | patch | put
    collection: str | None = None         # collection path used for GET/DELETE/count
    prereq: Callable = lambda a: {}
    target: Callable | None = None        # patch/put: ctx -> id of the row being modified
    mode: str | None = None
    note: str = ""
    post: Callable | None = None          # (audit, ctx) -> None, always runs (restore shared state)
    after_create: Callable | None = None  # (audit, id) -> None: e.g. delete at once so a unique key can be reused
    skip_count: bool = False              # count check is meaningless (soft-delete re-uses rows)


class Matrix:
    def __init__(self, audit: Audit):
        self.a = audit
        self.rows: list[dict] = []            # every case outcome
        self.limits: list[dict] = []          # per field: discovered min/max boundary table
        self.count_checks: list[dict] = []    # per op: count before/after
        self.inventory: list[dict] = []       # per field: type/required/min/max/enum evidence

    # -------------------------------------------------------------------------------------------
    def run(self, op: Op):
        ctx = op.prereq(self.a)
        try:
            self._run(op, ctx)
        finally:
            if op.post:
                op.post(self.a, ctx)
            self.a.cleanup()

    def _run(self, op: Op, ctx):
        a = self.a
        self._ctx = ctx
        a.step = f"matrix:{op.key}"
        base = op.baseline(ctx)
        count_coll = op.collection
        before = a.count(count_coll, mode=op.mode) if (count_coll and op.kind == "create") else None
        accepted_creates = 0
        target = op.target(ctx) if op.target else None
        path = op.path(ctx)

        # baseline must succeed or the op is reported as blocked (not silently skipped)
        if op.kind == "patch" and not base:
            r = None                      # an empty PATCH is correctly rejected; the target row itself is the baseline
        else:
            r = a.call(op.method, path, base, mode=op.mode)
        if r is not None and r.status not in (200, 201, 202):
            self.rows.append(dict(op=op.key, field="(baseline)", case="known-good baseline", value="", status=r.status,
                                  code=r.code(), detail=r.detail()[:200], rid=r.rid, expected=True, verdict="BASELINE-FAILED",
                                  readback=None, rb_rid=None))
            return
        if op.kind == "create" and r is not None:
            accepted_creates += 1
            a.track(op.collection, r.json()["id"])
            self._after(op, r)          # e.g. delete at once so a unique key can be reused by the probes

        for f in op.fields:
            inv = dict(op=op.key, field=f.name, kind=f.kind, required=not f.optional, enum=f.enum, min=None, max=None,
                       note=f.note)
            if f.kind == "array":
                accepted_creates += self._array(op, ctx, base, f, path, target, inv)
            else:
                if f.kind in STR_KINDS:
                    accepted_creates += self._length(op, ctx, base, f, path, target, inv)
                for label, value in cases_for(f.kind, f.enum):
                    accepted_creates += self._case(op, ctx, base, f, path, target, label, value)
            self.inventory.append(inv)

        if before is not None and not op.skip_count:
            after = a.count(count_coll, mode=op.mode)
            exp = before + accepted_creates
            self.count_checks.append(dict(op=op.key, collection=count_coll, before=before, accepted=accepted_creates,
                                          expected=exp, after=after, ok=(after == exp),
                                          note="rejected requests must not create rows; accepted ones add exactly one"))

    # -------------------------------------------------------------------------------------------
    def _body(self, op, base, f, value):
        b = clone(base)
        if op.kind == "patch":
            b = {}
            for i in range(len(f.path) - 1):  # nested patch: build the parent chain
                pass
            cur = b
            for p in f.path[:-1]:
                cur = cur.setdefault(p, {})
            if value is not OMIT:
                cur[f.path[-1]] = value
            return b
        deep_set(b, f.path, value)
        if op.key == "pipelines.create" and f.path[0] != "name":
            self._seq = getattr(self, "_seq", 0) + 1       # pipeline names are unique now: keep every probe's baseline name distinct
            b["name"] = f"{b['name']} {self._tag()}-{self._seq}"
        return b

    def _tag(self):
        import time as _t
        return getattr(self, "_t", None) or setattr(self, "_t", _t.strftime("%H%M%S")) or self._t

    def _after(self, op, resp):
        if op.after_create and resp.status in (200, 201, 202):
            try:
                op.after_create(self.a, resp.json()["id"])
            except Exception:
                pass

    def _send(self, op, path, body):
        return self.a.call(op.method, path, _subst(body, getattr(self, "_ctx", {})), mode=op.mode)

    def _case(self, op, ctx, base, f, path, target, label, value, force_expect="auto"):
        body = self._body(op, base, f, value)
        if op.kind == "patch" and not body:
            return 0  # an empty PATCH is a different case (tested in negative-only requests)
        r = self._send(op, path, body)
        exp = (expected(f.kind, value, f.enum, f.optional) if f.judge else None) if force_expect == "auto" else force_expect
        row = dict(op=op.key, field=f.name, case=label, value=_repr(value), status=r.status, code=r.code(),
                   detail=r.detail()[:240], rid=r.rid, expected=exp, readback=None, rb_rid=None)
        row["verdict"] = verdict(r.status, exp)
        created = 0
        if r.status in (200, 201, 202):
            rb = self._readback(op, r, target, f, value)
            if rb:
                row["readback"], row["rb_rid"] = rb["diff"], rb["rid"]
                if rb["diff"] and rb["diff"].startswith("MUTATED"):
                    row["verdict"] = "SILENT-MUTATION"
            if op.kind == "create":
                created = 1
                try:
                    self.a.track(op.collection, r.json()["id"])
                except Exception:
                    pass
            self._after(op, r)
        self.rows.append(row)
        return created

    def _readback(self, op, r, target, f, sent):
        if not f.readback or sent is OMIT or op.collection is None:
            return None
        rid_ = r.json().get("id") if op.kind == "create" else target
        if not rid_:
            return None
        g = self.a.call("GET", f"/{op.collection}/{rid_}", mode=op.mode, throttle=False)
        if g.status != 200:
            return dict(diff=f"READBACK-FAILED status {g.status}", rid=g.rid)
        stored = deep_get(g.json(), f.path, "<<missing>>")
        return dict(diff=compare(sent, stored, f.kind), rid=g.rid)

    # ------------------------------------------------------------------ string length boundary (bisect)
    def _length(self, op, ctx, base, f, path, target, inv):
        created = 0
        ok = {}

        def probe(n):
            nonlocal created
            if n in ok:
                return ok[n]
            v = length_probe(f.kind, n)
            body = self._body(op, base, f, v)
            r = self._send(op, path, body)
            acc = r.status in (200, 201, 202)
            self.rows.append(dict(op=op.key, field=f.name, case=f"length={n}", value=f"<{n} chars>", status=r.status,
                                  code=r.code(), detail=r.detail()[:240], rid=r.rid, expected=None,
                                  verdict=verdict(r.status, None), readback=None, rb_rid=None))
            if acc:
                if op.kind == "create":
                    created += 1
                    try:
                        self.a.track(op.collection, r.json()["id"])
                    except Exception:
                        pass
                rb = self._readback(op, r, target, f, v)
                if rb and rb["diff"] and rb["diff"].startswith("MUTATED"):
                    self.rows[-1]["verdict"], self.rows[-1]["readback"], self.rows[-1]["rb_rid"] = "SILENT-MUTATION", rb["diff"], rb["rid"]
                self._after(op, r)
            ok[n] = acc
            return acc

        for n in COARSE:
            if f.kind == "key" and n > 4096:
                break
            probe(n)
        accepted = [n for n in COARSE if ok.get(n)]
        if not accepted:
            inv["min"], inv["max"] = "none accepted", "none accepted"
            self.limits.append(dict(op=op.key, field=f.name, min_ok=None, min_minus1=None, max_ok=None, max_plus1=None,
                                    note="no length accepted in the probe set"))
            return created
        lo = min(accepted)
        hi_ok = max(accepted)
        # first rejected length above the largest accepted one
        above = [n for n in COARSE if n > hi_ok and ok.get(n) is False]
        if above:
            hi_bad = min(above)
            a_, b_ = hi_ok, hi_bad
            for _ in range(14):
                if b_ - a_ <= 1:
                    break
                mid = (a_ + b_) // 2
                if probe(mid):
                    a_ = mid
                else:
                    b_ = mid
            max_ok, max_plus1 = a_, b_
        else:
            max_ok, max_plus1 = hi_ok, None
        # min boundary
        below = [n for n in COARSE if n < lo and ok.get(n) is False]
        min_minus1 = max(below) if below else None
        if min_minus1 is not None and lo - min_minus1 > 1:
            a_, b_ = min_minus1, lo
            for _ in range(10):
                if b_ - a_ <= 1:
                    break
                mid = (a_ + b_) // 2
                if probe(mid):
                    b_ = mid
                else:
                    a_ = mid
            lo, min_minus1 = b_, a_
        inv["min"], inv["max"] = lo, (max_ok if max_plus1 else f">= {max_ok} (no rejection up to {max(COARSE)})")
        self.limits.append(dict(op=op.key, field=f.name, min_ok=lo, min_minus1=min_minus1, max_ok=max_ok, max_plus1=max_plus1,
                                note="" if max_plus1 else f"no upper limit found up to {max(COARSE)} characters"))
        return created

    # ------------------------------------------------------------------ array length boundary + shapes
    def _array(self, op, ctx, base, f, path, target, inv):
        created = 0
        sizes = [0, 1, 2, 10, 49, 50, 51, 100, 256, 500, 4096, 65536]
        res = {}
        for n in sizes:
            v = [f.item(i) for i in range(n)]
            body = self._body(op, base, f, v)
            r = self._send(op, path, body)
            acc = r.status in (200, 201, 202)
            res[n] = acc
            self.rows.append(dict(op=op.key, field=f.name, case=f"array length={n}", value=f"<{n} items>", status=r.status,
                                  code=r.code(), detail=r.detail()[:240], rid=r.rid, expected=None,
                                  verdict=verdict(r.status, None), readback=None, rb_rid=None))
            if acc and op.kind == "create":
                created += 1
                try:
                    self.a.track(op.collection, r.json()["id"])
                except Exception:
                    pass
        okn = [n for n in sizes if res[n]]
        if okn:
            mx = max(okn)
            bad = [n for n in sizes if n > mx and res[n] is False]
            inv["min"] = min(okn)
            inv["max"] = mx if bad else f">= {mx}"
            self.limits.append(dict(op=op.key, field=f.name, min_ok=min(okn), min_minus1=(min(okn) - 1 if min(okn) > 0 and res.get(min(okn) - 1) is False else None) or (0 if res.get(0) is False else None),
                                    max_ok=mx, max_plus1=(min(bad) if bad else None), note="array length probe set"))
        shapes = [("array of one null", [None]), ("mixed-type array", [1, "a", None, {}, [] ]),
                  ("not an array (string)", "abc"), ("not an array (object)", {"a": 1}), ("null", None), ("omitted", OMIT),
                  ("duplicate items", [f.item(0), f.item(0)])]
        for label, v in shapes:
            created += self._case(op, ctx, base, f, path, target, label, v, force_expect=None)
        return created


def _subst(x, ctx):
    """Replace the __PID__ placeholder (catalog product id) used by array item factories."""
    pid = (ctx.get("product") or {}).get("id")
    if isinstance(x, dict):
        return {k: _subst(v, ctx) for k, v in x.items()}
    if isinstance(x, list):
        return [_subst(v, ctx) for v in x]
    return pid if (x == "__PID__" and pid) else x


def verdict(status, exp):
    if status == 0 or status >= 500:
        return "SERVER-ERROR"
    ok = 200 <= status < 300
    if exp is True and not ok:
        return "REJECTED-VALID"
    if exp is False and ok:
        return "ACCEPTED-INVALID"
    return "OK" if exp is not None else "RECORDED"


def _instant(v):
    import datetime as _dt
    try:
        d = _dt.datetime.fromisoformat(str(v).replace("Z", "+00:00"))
        return d.astimezone(_dt.timezone.utc) if d.tzinfo else None
    except (ValueError, TypeError, OverflowError):
        return None


def compare(sent, stored, kind):
    if kind in ("datetime", "date") and isinstance(sent, str) and isinstance(stored, str):
        a_, b_ = _instant(sent), _instant(stored)
        if a_ is not None and b_ is not None and a_ == b_:
            return None if sent == stored else "normalised: same instant, stored as UTC with milliseconds"
    if stored == "<<missing>>":
        return "MUTATED: field missing from the stored record"
    if isinstance(sent, float) and isinstance(stored, (int, float)) and float(stored) == sent:
        return None
    if sent == stored:
        return None
    if isinstance(sent, str) and isinstance(stored, str):
        if stored == sent.lower() and kind in ("email", "domain", "currency", "key"):
            return "normalised: lower-cased"
        if stored == sent.strip():
            return "normalised: trimmed"
        if "\ud800" in sent or "\x00" in sent:
            return f"MUTATED: sent={_repr(sent)} stored={_repr(stored)}"
    return f"MUTATED: sent={_repr(sent)} stored={_repr(stored)}"


def _repr(v):
    if v is OMIT:
        return "<omitted>"
    s = repr(v)
    return s if len(s) <= 90 else s[:87] + "..."
