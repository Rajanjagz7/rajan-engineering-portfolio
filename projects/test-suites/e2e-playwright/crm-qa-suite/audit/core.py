"""Evidence recorder + throttled request wrapper for the API audit.

Every request/response is written to reports/audit/evidence.jsonl with a stable id (REQ-00001...) so that
each claim in the final report can cite a request id. Cookies and Authorization values are redacted.
Guard rails (from the audit brief): own tenant only, no load (single-threaded + throttle; parallel only in
the explicit race steps and never above 10), and deletes ONLY for rows this run created."""
from __future__ import annotations

import copy
import json
import re
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "api"))
import config  # noqa: E402
from crm_client import CrmClient  # noqa: E402

OUT = ROOT / "reports" / "audit"
OUT.mkdir(parents=True, exist_ok=True)
OMIT = object()          # sentinel: leave the field out of the body
THROTTLE = 0.10          # seconds between sequential requests (about 5-8 req/s including latency)
MAX_BODY = 1800          # characters of body kept per evidence record

SENSITIVE = re.compile(r"(?i)(cookie|authorization|set-cookie|x-amz-(signature|credential|security-token)|x-api-key)")


def jdumps(obj) -> str:
    """JSON text with ASCII escapes so lone surrogates and NUL survive as \\uXXXX escapes."""
    return json.dumps(obj, ensure_ascii=True, allow_nan=True)


_PRESIGN = re.compile(r"(X-Amz-(?:Signature|Security-Token)=)[^&\"\s\\]+", re.I)


def clip(s, n=MAX_BODY):
    s = s if isinstance(s, str) else repr(s)
    s = _PRESIGN.sub(r"\1<redacted>", s)  # presigned-URL secrets are never written to the evidence log
    return s if len(s) <= n else s[:n] + f"...[+{len(s) - n} chars]"


class Audit:
    def __init__(self, prefix=""):
        self.prefix = prefix
        self.cfg = config.load()
        self.client = CrmClient(self.cfg)
        self.client.login()
        self.n = 0
        self.t0 = time.time()
        self.created: list[tuple[str, str]] = []     # (collection path, id): only rows THIS run created
        self.log = open(OUT / (f"evidence_{prefix}.jsonl" if prefix else "evidence.jsonl"), "a", encoding="utf-8")
        self.step = ""

    # ---- transport -----------------------------------------------------------------------------
    def call(self, method, path, body=OMIT, raw=None, headers=None, project=None, authed=True,
             mode=None, tag=None, throttle=True):
        """One recorded request. body: python object -> JSON; raw: bytes/str sent verbatim."""
        h = dict(headers or {})
        if mode:
            h["crm-env-mode"] = mode
        data = None
        if raw is not None:
            data = raw if isinstance(raw, (bytes, str)) else jdumps(raw)
            if isinstance(data, str):
                data = data.encode("utf-8", "surrogatepass")
        elif body is not OMIT:
            data = jdumps(body).encode("ascii")
        if data is not None and not any(k.lower() == "content-type" for k in h):
            h["content-type"] = "application/json"
        t = time.time()
        try:
            r = self.client.request(method, path, data=data, headers=h, project_id=project, authenticated=authed)
            err = None
        except requests.RequestException as e:
            r, err = None, f"{type(e).__name__}: {str(e)[:160]}"
        ms = int((time.time() - t) * 1000)
        self.n += 1
        rid = f"REQ-{self.prefix}{self.n:05d}"
        rec = {"id": rid, "step": tag or self.step, "method": method, "path": path, "ms": ms,
               "req_headers": {k: ("[redacted]" if SENSITIVE.search(k) else v) for k, v in h.items()},
               "req_body": clip(data.decode("utf-8", "replace") if data else ""),
               "status": r.status_code if r is not None else None,
               "resp_headers": {k: ("[redacted]" if SENSITIVE.search(k) else v) for k, v in (r.headers.items() if r is not None else [])},
               "resp_body": clip(r.text if r is not None else (err or ""), MAX_BODY), "error": err,
               "project": project or self.cfg.project_id}
        self.log.write(json.dumps(rec, ensure_ascii=True) + "\n")
        self.log.flush()
        if throttle:
            time.sleep(THROTTLE)
        return Resp(r, rid, err)

    # ---- helpers --------------------------------------------------------------------------------
    def make(self, collection, body, **kw):
        """Create a row that must succeed (a fixture); registered for cleanup."""
        r = self.call("POST", f"/{collection}", body, **kw)
        assert r.status in (200, 201, 202), f"fixture {collection} failed: {r.status} {r.text[:200]}"
        self.created.append((collection, r.json()["id"]) + ((kw["mode"],) if kw.get("mode") else ()))
        return r.json()

    def track(self, collection, rid, mode=None):
        self.created.append((collection, rid) + ((mode,) if mode else ()))

    def list_all(self, collection, extra="", project=None, mode=None):
        items, cur = [], None
        for _ in range(60):
            q = f"/{collection}?limit=100{extra}" + (f"&starting_after={cur}" if cur else "")
            r = self.call("GET", q, project=project, mode=mode, throttle=False)
            if r.status != 200:
                return None
            j = r.json()
            items += j["data"]
            if not j.get("has_more"):
                return items
            cur = j["next_cursor"]
        return items

    def count(self, collection, extra="", **kw):
        items = self.list_all(collection, extra, **kw)
        return None if items is None else len(items)

    def cleanup(self):
        """Delete only what this run created, newest first, then clear the registry."""
        order = {"deals": 0, "contacts": 1, "companies": 2, "activities": 3, "automation-rules": 4,
                 "catalog-products": 5, "contacts/custom-properties": 6, "pipelines": 7, "files": 8}
        todo = sorted(self.created, key=lambda x: order.get(x[0], 9))
        for item in todo:
            coll, rid = item[0], item[1]
            self.call("DELETE", f"/{coll}/{rid}", tag="cleanup", throttle=False, mode=(item[2] if len(item) > 2 else None))
        self.created.clear()


class Resp:
    def __init__(self, r, rid, err):
        self.r, self.rid, self.err = r, rid, err

    @property
    def status(self):
        return self.r.status_code if self.r is not None else 0

    @property
    def text(self):
        return self.r.text if self.r is not None else (self.err or "")

    @property
    def headers(self):
        return self.r.headers if self.r is not None else {}

    def json(self):
        return self.r.json()

    def detail(self):
        try:
            j = self.r.json()
            return j.get("detail") or j.get("message") or j.get("title") or ""
        except Exception:
            return self.text[:160]

    def code(self):
        try:
            return self.r.json().get("code", "")
        except Exception:
            return ""


def deep_set(obj, path, value):
    o = obj
    for k in path[:-1]:
        o = o[k]
    if value is OMIT:
        if isinstance(o, list):
            o.pop(path[-1])
        else:
            o.pop(path[-1], None)
    else:
        o[path[-1]] = value


def deep_get(obj, path, default=None):
    o = obj
    for k in path:
        try:
            o = o[k]
        except (KeyError, IndexError, TypeError):
            return default
    return o


def clone(x):
    return copy.deepcopy(x)
