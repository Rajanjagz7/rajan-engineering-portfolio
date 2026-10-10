"""Runs the field matrix. Usage: python audit/run_matrix.py [op-key-prefix ...]   (no args = every op)."""
import json
import sys
import time

from core import OUT, Audit
from matrix import Matrix
from ops import OPS

if __name__ == "__main__":
    args = sys.argv[1:]
    worker = ""
    if args and args[0].startswith("--worker="):
        worker = args.pop(0).split("=", 1)[1]
    want = args
    a = Audit(prefix=worker)
    m = Matrix(a)
    t0 = time.time()
    for op in OPS:
        if want and not any(op.key.startswith(w) for w in want):
            continue
        n0 = a.n
        try:
            m.run(op)
        finally:
            a.cleanup()
        print(f"{op.key:34} requests={a.n - n0:4d}  elapsed={int(time.time() - t0):4d}s", flush=True)
    suffix = (worker + "_" if worker else "") + ("_".join(w.replace('.', '-') for w in want) if want else "all")
    (OUT / f"matrix_{suffix}.json").write_text(json.dumps(dict(rows=m.rows, limits=m.limits, counts=m.count_checks, inventory=m.inventory,
                                                              requests=a.n), indent=1, default=str), encoding="utf-8")
    bad = [r for r in m.rows if r["verdict"] in ("SERVER-ERROR", "ACCEPTED-INVALID", "REJECTED-VALID", "SILENT-MUTATION", "BASELINE-FAILED")]
    print(f"cases={len(m.rows)} flagged={len(bad)} count-mismatches={sum(1 for c in m.count_checks if not c['ok'])} total-requests={a.n}")
