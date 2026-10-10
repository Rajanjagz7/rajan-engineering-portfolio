"""Read-only audit steps (safe to run alongside the matrix): authn hypotheses, cross-project reads,
error-code stability, headers/method/version probes. Results -> reports/audit/readonly.json"""
from __future__ import annotations

import base64
import json
import re
import sys
import time

import requests

from core import OUT, Audit, jdumps

PROTECTED_GET = ["/pipelines", "/deals", "/contacts", "/companies", "/catalog-products", "/automation-rules", "/activities",
                 "/messages", "/files", "/imports?resource=contacts", "/exports?resource=contacts", "/reports", "/reports/contacts.by_status",
                 "/close-reasons", "/contacts/custom-properties", "/events", "/workspaces", "/auth/me"]
PROTECTED_WRITE = [("POST", "/pipelines", {"name": "x", "stages": [{"name": "a"}]}), ("POST", "/contacts", {"firstName": "x"}),
                   ("POST", "/companies", {"name": "x"}), ("PUT", "/close-reasons", {"reasons": []}),
                   ("POST", "/messages", {"contactId": "000000000000000000000000", "channel": "email", "body": "x"})]


def b64(d):
    return base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip("=")


def fake_jwt(alg="none", sig="", **claims):
    hdr = {"alg": alg, "typ": "JWT"}
    body = {"sub": "000000000000000000000000", "iat": int(time.time()) + 86400, "nbf": int(time.time()) + 86400,
            "exp": int(time.time()) + 172800, "iss": "crm"}
    body.update(claims)
    return f"{b64(hdr)}.{b64(body)}.{sig}"


def authn(a: Audit, out):
    a.step = "authn"
    sess = a.client.session
    cookie_name = next((c.name for c in sess.cookies if "session" in c.name), None)
    cookie_val = sess.cookies.get(cookie_name) if cookie_name else None
    flip = (cookie_val[:-1] + ("A" if cookie_val[-1] != "A" else "B")) if cookie_val else "x"
    variants = {
        "no credentials": dict(authed=False),
        "empty bearer": dict(authed=False, headers={"authorization": "Bearer "}),
        "garbage bearer": dict(authed=False, headers={"authorization": "Bearer not-a-token"}),
        "API-key shaped bearer": dict(authed=False, headers={"authorization": "Bearer sk_test_0000000000000000000000000000"}),
        "JWT alg=none, empty signature, future iat/nbf": dict(authed=False, headers={"authorization": "Bearer " + fake_jwt()}),
        "JWT alg=HS256, bogus signature, future iat/nbf": dict(authed=False, headers={"authorization": "Bearer " + fake_jwt("HS256", "AAAA")}),
        "session cookie, last character mutated": dict(authed=False, headers={"cookie": f"{cookie_name}={flip}"}),
        "session cookie, empty value": dict(authed=False, headers={"cookie": f"{cookie_name}="}),
        "session cookie, JWT alg=none value": dict(authed=False, headers={"cookie": f"{cookie_name}={fake_jwt()}"}),
        "valid cookie + garbage bearer (precedence)": dict(authed=True, headers={"authorization": "Bearer not-a-token"}),
    }
    rows = []
    for path in PROTECTED_GET:
        for name, kw in variants.items():
            r = a.call("GET", path, **kw)
            rows.append(dict(endpoint=f"GET {path}", variant=name, status=r.status, code=r.code(), detail=r.detail()[:110], rid=r.rid,
                             expected="401" if not kw.get("authed") else "200 (cookie wins) or 401"))
    for m, path, body in PROTECTED_WRITE:
        for name in ("no credentials", "JWT alg=none, empty signature, future iat/nbf", "session cookie, last character mutated"):
            r = a.call(m, path, body, **variants[name])
            rows.append(dict(endpoint=f"{m} {path}", variant=name, status=r.status, code=r.code(), detail=r.detail()[:110], rid=r.rid, expected="401"))
    out["authn"] = rows
    out["authn_blocked"] = ["token for a different user in the same tenant (no second user exists)",
                            "token for a user in a different tenant (no second tenant user; out of scope by brief)",
                            "expired token (cannot mint a validly signed expired token; no clock control)"]


def replay_after_logout(a: Audit, out):
    """Own session only. Run LAST: a global logout would revoke the sessions other workers use."""
    a.step = "authn-replay"
    rows = out.setdefault("authn_replay", [])
    # replay of a logged-out session (own session): log in separately, log out, replay the old cookie
    s2 = requests.Session()
    base = a.cfg.base_url
    lg = s2.post(f"{base}/api/auth/login", json={"email": a.cfg.email, "password": a.cfg.password},
                 headers={"origin": base, "referer": f"{base}/login"}, timeout=30)
    old = {c.name: c.value for c in s2.cookies}
    outc = None
    for path in ("/api/auth/logout", "/api/auth/signout"):
        lo = s2.post(f"{base}{path}", headers={"origin": base, "referer": f"{base}/"}, timeout=30)
        if lo.status_code < 400:
            outc = (path, lo.status_code)
            break
        outc = (path, lo.status_code)
    hdr = {"cookie": "; ".join(f"{k}={v}" for k, v in old.items())}
    r = a.call("GET", "/pipelines?limit=1", headers=hdr, authed=False)
    rows.append(dict(endpoint="GET /pipelines?limit=1", variant=f"replay of cookie after logout ({outc})", status=r.status, code=r.code(),
                     detail=r.detail()[:110], rid=r.rid, expected="401"))



def idor_reads(a: Audit, out, manifest):
    """Cross-project reads inside my own tenant (same workspace, other project I own). Compares 'exists elsewhere'
    with 'does not exist' bodies for enumeration leaks."""
    a.step = "idor-read"
    projs = a.call("GET", f"/workspaces/6abe37466194a264a524b64c/projects?limit=100", throttle=False).json()["data"]
    other = next(p["id"] for p in projs if p["id"] != a.cfg.project_id)
    rows = []
    P = {"pipelines": list(manifest["pipelines"].values())[0]["id"], "deals": manifest["deals"][0],
         "contacts": list(manifest["contacts"].values())[0], "companies": manifest["companies"][0],
         "catalog-products": list(manifest["products"].values())[0]["id"], "activities": manifest["activities"][0]}
    ghost = "000000000000000000000000"
    for coll, rid in P.items():
        for how, project in (("own project", None), ("other own project", other)):
            r = a.call("GET", f"/{coll}/{rid}", project=project)
            rows.append(dict(endpoint=f"GET /{coll}/{{id}}", id_kind="existing id of project 1", caller=how, status=r.status, code=r.code(), detail=r.detail()[:90], rid=r.rid))
        g = a.call("GET", f"/{coll}/{ghost}", project=other)
        rows.append(dict(endpoint=f"GET /{coll}/{{id}}", id_kind="id that exists nowhere", caller="other own project", status=g.status, code=g.code(), detail=g.detail()[:90], rid=g.rid))
        e = a.call("GET", f"/{coll}/{rid}", project=other)
        rows.append(dict(endpoint=f"GET /{coll}/{{id}}", id_kind="ENUMERATION CHECK: elsewhere-id vs nowhere-id body equal?",
                         caller="other own project", status=f"{e.status} vs {g.status}", code=f"{e.code()} vs {g.code()}",
                         detail="IDENTICAL" if (e.status == g.status and e.detail().replace(rid, "ID") == g.detail().replace(ghost, "ID")) else f"DIFFERENT: {e.detail()[:60]} | {g.detail()[:60]}",
                         rid=f"{e.rid},{g.rid}"))
    # list endpoints under the other project must not contain project-1 rows
    for coll in ("pipelines", "deals", "contacts", "companies", "catalog-products", "activities", "files", "messages"):
        lst = a.list_all(coll, project=other) or []
        leak = [x["id"] for x in lst if x["id"] in {P.get(coll)}]
        rows.append(dict(endpoint=f"GET /{coll}", id_kind="list in other own project", caller="other own project", status=200,
                         code="", detail=f"rows={len(lst)} leaked_project1_rows={len(leak)}", rid=""))
    # list parameters from the brief
    for q in ("limit=1000", "offset=-1", "page=999999", "owner=me", "tenant=mine", "role=admin", "limit=100&offset=5"):
        r = a.call("GET", f"/contacts?{q}")
        rows.append(dict(endpoint="GET /contacts?" + q, id_kind="role-scope filter probe", caller="owner", status=r.status, code=r.code(), detail=r.detail()[:100], rid=r.rid))
    out["idor"] = rows
    out["other_project"] = other


def error_stability(a: Audit, out):
    a.step = "error-stability"
    cases = [("POST", "/pipelines", {"name": "", "stages": [{"name": "a"}]}), ("GET", "/pipelines/zzz", None),
             ("GET", "/pipelines/000000000000000000000000", None), ("POST", "/deals", {"title": "x"}),
             ("POST", "/contacts", {"firstName": "x", "email": "nope"})]
    rows = []
    for m, p, b in cases:
        sigs = []
        rids = []
        for _ in range(20):
            r = a.call(m, p, b if b is not None else None) if b is not None else a.call(m, p)
            sigs.append((r.status, r.code(), r.detail()[:80]))
            rids.append(r.rid)
        distinct = sorted(set(sigs))
        rows.append(dict(request=f"{m} {p}", body=jdumps(b) if b is not None else "", repeats=20, distinct_responses=len(distinct),
                         status=distinct[0][0], code=distinct[0][1], detail=distinct[0][2], first=rids[0], last=rids[-1]))
    out["stability"] = rows


def hygiene(a: Audit, out):
    a.step = "hygiene"
    rows = []
    probes = [("GET", "/pipelines?limit=1"), ("OPTIONS", "/pipelines"), ("HEAD", "/pipelines"), ("TRACE", "/pipelines"),
              ("PUT", "/pipelines"), ("DELETE", "/pipelines"), ("PATCH", "/pipelines"), ("POST", "/pipelines/000000000000000000000000"),
              ("GET", "/definitely-not-a-route"), ("GET", "/pipelines/" + "a" * 5000), ("GET", "/pipelines?limit=1&limit=2")]
    for m, p in probes:
        r = a.call(m, p)
        h = {k.lower(): v for k, v in r.headers.items()}
        rows.append(dict(method=m, path=p[:40], status=r.status, ctype=h.get("content-type", ""), allow=h.get("allow", ""),
                         server=h.get("server", ""), via=h.get("via", ""), powered=h.get("x-powered-by", ""),
                         retry_after=h.get("retry-after", ""), ratelimit=",".join(k for k in h if "ratelimit" in k),
                         body=r.text[:100].replace("\n", " "), rid=r.rid))
    # soft-404s outside /api/crm/v1
    base = a.cfg.base_url
    for p in ("/api/docs", "/api/openapi.json", "/api/crm", "/api/crm/v2/pipelines", "/api/v1/pipelines"):
        t = time.time()
        r = a.client.session.get(base + p, timeout=30, allow_redirects=False)
        rows.append(dict(method="GET", path=p, status=r.status_code, ctype=r.headers.get("content-type", ""), allow="", server=r.headers.get("server", ""),
                         via=r.headers.get("via", ""), powered=r.headers.get("x-powered-by", ""), retry_after="", ratelimit="",
                         body=r.text[:100].replace("\n", " "), rid="(direct, unrecorded)"))
    # headers of a login response (cookie attributes)
    lg = requests.post(f"{base}/api/auth/login", json={"email": a.cfg.email, "password": "definitely-wrong-password"},
                       headers={"origin": base, "referer": f"{base}/login"}, timeout=30)
    out["login_wrong_password"] = dict(status=lg.status_code, body=lg.text[:200], headers={k: v for k, v in lg.headers.items() if k.lower() in ("set-cookie", "retry-after", "content-type", "cache-control", "x-ratelimit-remaining")})
    ok = requests.post(f"{base}/api/auth/login", json={"email": a.cfg.email, "password": a.cfg.password},
                       headers={"origin": base, "referer": f"{base}/login"}, timeout=30)
    out["login_cookie_attributes"] = [re.sub(r"^([^=]+)=[^;]*", r"=<redacted>", v) for k, v in ok.raw.headers.items() if k.lower() == "set-cookie"]  # never store a live token
    out["hygiene"] = rows


def main():
    import pathlib
    manifest = json.loads((pathlib.Path(__file__).resolve().parent.parent / "reports" / "seed-manifest.json").read_text(encoding="utf-8"))
    a = Audit(prefix="R")
    out = {}
    for fn in (authn,):
        fn(a, out)
        print(fn.__name__, "done; requests", a.n, flush=True)
    idor_reads(a, out, manifest); print("idor_reads done", a.n, flush=True)
    if "--with-logout" in sys.argv:
        replay_after_logout(a, out); print("logout replay done", a.n, flush=True)
    error_stability(a, out); print("error_stability done", a.n, flush=True)
    hygiene(a, out); print("hygiene done", a.n, flush=True)
    (OUT / "readonly.json").write_text(json.dumps(out, indent=1, default=str), encoding="utf-8")
    print("requests:", a.n)


if __name__ == "__main__":
    main()
