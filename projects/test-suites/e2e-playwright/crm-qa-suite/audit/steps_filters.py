"""Records evidence for the list-filter syntax (the UI uses status[in]=...; the obvious status=... is rejected)
and appends the result to reports/audit/known.json."""
import json

from core import OUT, Audit


def main():
    a = Audit(prefix="F")
    c = a.make("contacts", {"firstName": "FilterProbe", "status": "archived"})
    k = json.loads((OUT / "known.json").read_text(encoding="utf-8")) if (OUT / "known.json").exists() else []
    plain = a.call("GET", "/contacts?status=archived")
    br = a.call("GET", "/contacts?status[in]=archived")
    found = br.status == 200 and any(x["id"] == c["id"] for x in br.json()["data"])
    dflt = a.list_all("contacts") or []
    others = [a.call("GET", "/contacts?" + q) for q in ("status[eq]=archived", "status[in]=zzz", "status[ne]=lead", "created_at[gte]=2026-01-01T00:00:00Z", "status[in]=lead,customer")]
    k.append(dict(key="K22", title="archived contacts: the obvious filter status=archived is rejected; only the undocumented bracket form status[in]=archived works",
                  expect="a documented filter; an error that points at the right syntax", rids=[plain.rid, br.rid] + [r.rid for r in others],
                  statuses=[plain.status, br.status] + [r.status for r in others], bodies=[plain.text[:160], br.text[:100]] + [r.text[:100] for r in others],
                  verdict="BUG" if (plain.status == 400 and found) else "OK",
                  note=f"status=archived -> {plain.status} '{plain.detail()}'; status[in]=archived -> {br.status}, archived row listed: {found}; "
                       f"default list contains the archived row: {any(x['id'] == c['id'] for x in dflt)}; other operators: " + ", ".join(f"{q}->{r.status}" for q, r in zip(("[eq]", "[in]=zzz", "[ne]", "created_at[gte]", "[in]=lead,customer"), others))))
    (OUT / "known.json").write_text(json.dumps(k, indent=1, default=str), encoding="utf-8")
    a.cleanup()
    print("filters recorded; requests", a.n)


if __name__ == "__main__":
    main()
