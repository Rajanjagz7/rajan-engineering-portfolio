"""Compares the baseline field-matrix run (reports/audit_baseline) with the regression run (matrix_*2_*.json).
A case is identified by (op, field, case). Verdict classes: flagged = ACCEPTED-INVALID / SILENT-MUTATION / REJECTED-VALID / SERVER-ERROR.
Output: reports/regress/matrix_diff.json"""
import collections
import glob
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FLAG = {"ACCEPTED-INVALID", "SILENT-MUTATION", "REJECTED-VALID", "SERVER-ERROR", "BASELINE-FAILED"}


def load(files, newest_wins=True):
    rows, ops = {}, {}
    for f in sorted(files, key=lambda p: Path(p).stat().st_mtime):
        m = json.loads(Path(f).read_text(encoding="utf-8"))
        here = {r["op"] for r in m.get("rows", [])}
        for op in here:
            ops[op] = f
        for r in m.get("rows", []):
            rows.setdefault(r["op"], {})
        for op in here:
            rows[op] = {}
    for f in sorted(files, key=lambda p: Path(p).stat().st_mtime):
        m = json.loads(Path(f).read_text(encoding="utf-8"))
        for r in m.get("rows", []):
            if ops.get(r["op"]) == f:
                rows[r["op"]][(r["field"], r["case"])] = r
    return rows


def benign(r):
    """Same judgement calls the report applies."""
    if r["verdict"] == "REJECTED-VALID" and (r["case"] in ("tab", "newline", "RTL override", "null", "24:00:00", "omitted") or any(k in (r.get("detail") or "") for k in ("already exists", "exceeds", "cannot contain", "Cannot contain", "Header fields"))):
        return True
    if r["verdict"] == "SILENT-MUTATION" and r["case"] == "duplicate items":
        return True
    return False


def flagged(r):
    return r["verdict"] in FLAG and not benign(r)


old = load(glob.glob(str(ROOT / "reports" / "audit_baseline" / "matrix_*.json")))
new = load(glob.glob(str(ROOT / "reports" / "audit" / "matrix_*2_*.json")))
res = dict(fixed=[], still=[], new=[], ops_old=len(old), ops_new=len(new), cases_old=sum(len(v) for v in old.values()), cases_new=sum(len(v) for v in new.values()))
for op in sorted(set(old) & set(new)):
    for key in set(old[op]) | set(new[op]):
        o, n = old[op].get(key), new[op].get(key)
        fo, fn = (o is not None and flagged(o)), (n is not None and flagged(n))
        item = lambda r: dict(op=op, field=key[0], case=key[1], status=r["status"], verdict=r["verdict"], detail=(r.get("detail") or "")[:100], readback=(r.get("readback") or "")[:100], rid=r["rid"])  # noqa: E731
        if fo and not fn and n is not None:
            res["fixed"].append(dict(item(o), now=f"{n['status']} {(n.get('detail') or '')[:80]}", now_rid=n["rid"]))
        elif fo and fn:
            res["still"].append(item(n))
        elif fn and not fo:
            res["new"].append(dict(item(n), was=(f"{o['status']} {o['verdict']}" if o else "case not in baseline")))
res["counts"] = {op: [c for c in json.loads(Path(f).read_text(encoding="utf-8")).get("counts", []) if c["op"] == op] for op, f in []}
cnt = []
for f in glob.glob(str(ROOT / "reports" / "audit" / "matrix_*2_*.json")):
    cnt += json.loads(Path(f).read_text(encoding="utf-8")).get("counts", [])
res["count_checks"] = cnt
(ROOT / "reports" / "regress" / "matrix_diff.json").write_text(json.dumps(res, indent=1, default=str), encoding="utf-8")


def group(items):
    g = collections.Counter((i["op"].split(".")[0], i["field"]) for i in items)
    return g


print(f"ops compared: {len(set(old) & set(new))} (baseline {res['ops_old']}, new {res['ops_new']}); cases {res['cases_old']} -> {res['cases_new']}")
print(f"FIXED {len(res['fixed'])} cases | STILL-FLAGGED {len(res['still'])} | NEW-FLAGGED {len(res['new'])}")
for title, items in (("FIXED", res["fixed"]), ("STILL", res["still"]), ("NEW", res["new"])):
    print(f"\n== {title} by (resource, field):")
    for (r, f), n in sorted(group(items).items(), key=lambda x: -x[1])[:30]:
        ex = next(i for i in items if (i["op"].split(".")[0], i["field"]) == (r, f))
        print(f"  {n:4} {r:18} {f:28} e.g. {ex['case'][:30]:30} -> {ex.get('now', ex['status'])}")
print("\ncount checks:", [(c["op"], c["before"], c["accepted"], c["after"], "OK" if c["ok"] else "MISMATCH") for c in cnt])
