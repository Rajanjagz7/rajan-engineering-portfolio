"""Case generators (audit brief Step 3 and 4) and expectation rules.

expected(kind, value, field) -> True (should be accepted), False (should be rejected) or None (no firm
expectation: the case is recorded but never auto-flagged)."""
from __future__ import annotations

import datetime as dt
import re
import unicodedata

from core import OMIT

NFC_N = unicodedata.normalize("NFC", "ñ")
NFD_N = unicodedata.normalize("NFD", "ñ")

COMMON = [  # empty / whitespace / null / omitted, type confusion (every kind)
    ("empty string", ""), ("whitespace only", "   "), ("null", None), ("omitted", OMIT),
    ("number 0", 0), ("number 1", 1), ("number 1.0", 1.0), ("number -1", -1),
    ("boolean true", True), ("boolean false", False), ('string "true"', "true"), ('string "false"', "false"),
    ('string "yes"', "yes"), ('string "no"', "no"), ("empty array", []), ('array ["a"]', ["a"]),
    ("array [null]", [None]), ("empty object", {}), ("object {a:1}", {"a": 1}),
]
NUMERIC_TEXT = [("leading zeroes '00012'", "00012"), ("trailing dot '1.'", "1."), ("thousands sep '1,000'", "1,000"),
                ("sci text '1e10'", "1e10"), ("small negative text '-0.0001'", "-0.0001"), ('"NaN"', "NaN"),
                ('"Infinity"', "Infinity"), ('"-Infinity"', "-Infinity")]
NUMBERS = [("-0.0001", -0.0001), ("-2147483648", -2147483648), ("-9223372036854775808", -9223372036854775808),
           ("1e10", 1e10), ("1e-10", 1e-10), ("1e308", 1e308), ("-1e308", -1e308), ("2147483647", 2147483647),
           ("2147483648", 2147483648), ("9007199254740991", 9007199254740991), ("9007199254740992", 9007199254740992),
           ("9223372036854775807", 9223372036854775807), ("0.5", 0.5), ("1.5", 1.5)]
UNICODE = [("emoji only", "\U0001F600"), ("ZWJ family", "\U0001F468‍\U0001F469‍\U0001F467"),
           ("RTL Arabic", "اَلْعَرَبِيَّةُ"),
           ("combining marks", "é́́"), ("NUL only", "\u0000"), ("NUL inside", "a\u0000b"),
           ("lone surrogate", "\ud800"), ("case-fold Aa", "Aa"), ("case-fold AE ligature", "Æ"),
           ("NFC n-tilde (U+00F1)", NFC_N), ("NFD n-tilde (n + U+0303)", NFD_N), ("RTL override", "‮evil"),
           ("zero-width space", "a​b"), ("tab", "a\tb"), ("newline", "a\nb")]
INJECTION = [("SQLi", "' OR 1=1 --"), ("XSS", "<script>alert(1)</script>"), ("XML close tag", "<\\/foo>"),
             ("path traversal", "../../etc/passwd"), ("CRLF injection", "\r\nSet-Cookie: x=y")]
DATES = [("valid leap 2024-02-29", "2024-02-29"), ("1900-02-29 (not a leap year)", "1900-02-29"),
         ("2024-04-31 (no such day)", "2024-04-31"), ("2024-13-01 (month 13)", "2024-13-01"),
         ("2024-00-01 (month 0)", "2024-00-01"), ("2024-02-30", "2024-02-30"), ("31-12-9999 (non-ISO)", "31-12-9999"),
         ("epoch 1970-01-01", "1970-01-01"), ("2038-01-19", "2038-01-19"), ("0001-01-01", "0001-01-01"),
         ("9999-12-31", "9999-12-31"), ("dd/mm/yyyy 29/02/2000", "29/02/2000"), ("dd/mm/yyyy 31/04/2024", "31/04/2024")]
DATETIMES = [("DST-end literal from brief +09:00", "2026-03-29T01:30:00+09:00"),
             ("Sydney DST start gap (02:30 does not exist on 2026-10-04)", "2026-10-04T02:30:00+11:00"),
             ("Sydney DST end ambiguous 02:30 on 2026-04-05", "2026-04-05T02:30:00+10:00"),
             ("epoch one second before", "1969-12-31T23:59:59Z"), ("epoch", "1970-01-01T00:00:00Z"),
             ("year 9999 end", "9999-12-31T23:59:59Z"), ("leap second 23:59:60", "2016-12-31T23:59:60Z"),
             ("no timezone", "2026-10-10T10:00:00"), ("date only", "2026-10-10"), ("24:00:00", "2026-10-10T24:00:00Z"),
             ("space separator", "2026-10-10 10:00:00Z"), ("garbage", "tomorrow")]
EMAILS = [("valid AU .com.au", "olivia.nguyen@example.com"), ("valid net.au", "noah.smith@bigpond.net.au"),
          ("plus tag", "jack.wilson+invoices@gmail.com"), ("no @", "olivia.example.com"), ("no domain", "a@"),
          ("no tld", "a@b"), ("space inside", "a b@example.com"), ("double dot", "a..b@example.com"),
          ("unicode local", "üñï@example.com"), ("IDN domain", "a@üñï.com"),
          ("UPPER case", "OLIVIA@example.com"), ("254 chars", "a" * 64 + "@" + "b" * 63 + "." + "c" * 63 + "." + "d" * 57 + ".com")]
PHONES = [("AU mobile 0412345678", "0412345678"), ("+61 423 456 789", "+61 423 456 789"), ("+61 434 567 890", "+61 434 567 890"),
          ("+61 458 901 234", "+61 458 901 234"), ("+61 401 234 567", "+61 401 234 567"), ("US +1 412 345 6789", "+1 412 345 6789"),
          ("+61 12 345 6789 (bad AU)", "+61 12 345 6789"), ("prefix only +61 4", "+61 4"), ("letters 0412ABC678", "0412ABC678"),
          ("one digit", "1"), ("40 digits", "9" * 40), ("parentheses", "(02) 9999 9999")]
URLS = [("https", "https://acme.com.au/a.pdf"), ("http", "http://acme.com.au/a.pdf"), ("javascript:", "javascript:alert(1)"),
        ("data:", "data:text/html,<script>alert(1)</script>"), ("file:", "file:///etc/passwd"), ("no scheme", "acme.com.au/a.pdf"),
        ("ftp", "ftp://acme.com.au/a")]
DOMAINS = [("valid", "acme.com.au"), ("upper case", "ACME.COM.AU"), ("with scheme", "https://acme.com.au"),
           ("with path", "acme.com.au/path"), ("spaces", "not a domain"), ("trailing dot", "acme.com.au."),
           ("underscore", "a_b.acme.com.au"), ("single label", "localhost"), ("IP", "192.168.0.1")]
CURRENCIES = [("AUD", "AUD"), ("lower aud", "aud"), ("XYZ (not ISO 4217)", "XYZ"), ("two letters", "AU"), ("four letters", "AUDD"),
              ("USD", "USD"), ("JPY (0 decimals)", "JPY"), ("BHD (3 decimals)", "BHD"), ("digits", "123")]


def length_probe(kind, n):
    """A string of exactly n characters that is otherwise valid for the kind."""
    if kind == "email":
        pad = max(n - len("@example.com"), 0)
        return ("a" * pad + "@example.com")[:n] if n >= 13 else "a" * n
    if kind == "key":
        return "k" * n
    if kind == "domain":
        pad = max(n - len(".acme.com.au"), 1)
        return ("a" * pad + ".acme.com.au")[:n] if n > 12 else "a" * n
    if kind == "url":
        return ("https://acme.com.au/" + "a" * max(n - 20, 0))[:n] if n > 20 else "h" * n
    if kind == "phone":
        return "9" * n
    return "a" * n


COARSE = [0, 1, 2, 7, 8, 63, 64, 65, 100, 120, 121, 128, 200, 201, 255, 256, 257, 500, 1000, 1024, 2000, 4096, 4097, 10000, 65536]


def cases_for(kind, enum=None):
    """Type / representation cases for one field (the matrix adds the length probe and enum values itself)."""
    c = list(COMMON)
    if kind in ("int", "qty", "num"):
        c += NUMERIC_TEXT + NUMBERS
    elif kind in ("str", "text"):
        c += UNICODE + INJECTION + [("number-like string 00012", "00012")]
    elif kind == "email":
        c += EMAILS + INJECTION[:2]
    elif kind == "phone":
        c += PHONES + INJECTION[:2]
    elif kind == "domain":
        c += DOMAINS
    elif kind == "url":
        c += URLS
    elif kind == "key":
        c += [("UPPER", "LEAD_SOURCE"), ("hyphen", "lead-source"), ("leading digit", "1lead"), ("space", "lead source"),
              ("unicode", "léad"), ("valid", "valid_key_1")] + INJECTION[:1]
    elif kind == "currency":
        c += CURRENCIES
    elif kind == "date":
        c += DATES
    elif kind == "datetime":
        c += DATETIMES + DATES[:3]
    elif kind == "tz":
        c += [("Australia/Sydney", "Australia/Sydney"), ("Australia/Perth", "Australia/Perth"), ("UTC", "UTC"),
              ("abbreviation AEST", "AEST"), ("offset +10:00", "+10:00"), ("made up zone", "Mars/Olympus"), ("lower case", "australia/sydney")]
    elif kind == "enum":
        v = list(enum or [])
        c += [(f"valid {x}", x) for x in v] + [(f"UPPER {x}", str(x).upper()) for x in v[:2]] + [(f"Title {x}", str(x).title()) for x in v[:1]] \
             + [("unknown value", "approved-but-not-really"), (f"padded {v[0] if v else ''}", f" {v[0] if v else ''} ")]
    elif kind == "bool":
        c += [("number 2", 2), ("string 'on'", "on"), ("string '1'", "1"), ("string '0'", "0")]
    elif kind == "id":
        c += [("24 zeroes", "0" * 24), ("24 f", "f" * 24), ("23 hex", "a" * 23), ("25 hex", "a" * 25), ("non-hex 24", "g" * 24),
              ("uuid", "123e4567-e89b-12d3-a456-426614174000"), ("%00", "\u0000"), ("negative", "-1"), ("5000 chars", "a" * 5000)]
    # dedupe by label, keep order
    seen, out = set(), []
    for label, v in c:
        if label not in seen:
            seen.add(label)
            out.append((label, v))
    return out


# ------------------------------------------------------------------------------------------- expectations
CTRL = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")      # tab/newline excluded from the control-char opinion
EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)+$")


def _is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _date_ok(v):
    if not isinstance(v, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
        return False
    try:
        dt.date.fromisoformat(v)
        return True
    except ValueError:
        return False


def _datetime_ok(v):
    if not isinstance(v, str) or not re.search(r"(Z|[+-]\d{2}:\d{2})$", v) or " " in v or "T24:" in v:
        return False   # RFC 3339 has no 24:00:00
    try:
        dt.datetime.fromisoformat(v.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def expected(kind, v, enum=None, optional=False):
    if v is OMIT:
        return True if optional else False
    if v is None:
        return None if optional else False   # null on an optional field: rejecting it is a legitimate choice
    if kind in ("int", "qty"):
        lo = 1 if kind == "qty" else 0
        if isinstance(v, bool) or not isinstance(v, (int, float)):
            return False
        return float(v).is_integer() and lo <= v <= 9007199254740991
    if kind == "num":
        return _is_num(v)
    if kind in ("str", "text"):
        if not isinstance(v, str):
            return False
        if not v.strip():
            return False
        if "\ud800" in v or CTRL.search(v):
            return False                         # opinion: control chars / lone surrogates are not valid text
        return True
    if kind == "email":
        return isinstance(v, str) and bool(EMAIL_RE.match(v)) and len(v) <= 254 and ".." not in v
    if kind == "phone":
        if not isinstance(v, str):
            return False
        digits = re.sub(r"[\s()\-]", "", v)
        return bool(re.fullmatch(r"\+?\d{8,15}", digits)) and not (digits.startswith("+1") and False)
    if kind == "domain":
        return isinstance(v, str) and bool(re.fullmatch(r"(?!-)[a-z0-9\-]+(\.[a-z0-9\-]+)+", v.lower())) and "/" not in v
    if kind == "url":
        return isinstance(v, str) and v.startswith(("https://", "http://"))
    if kind == "key":
        return isinstance(v, str) and bool(re.fullmatch(r"[a-z][a-z0-9_]{0,63}", v))
    if kind == "currency":
        return v in ("AUD", "USD", "JPY", "BHD", "EUR", "NZD", "GBP")
    if kind == "date":
        return _date_ok(v)
    if kind == "datetime":
        return _datetime_ok(v)
    if kind == "tz":
        return v in ("Australia/Sydney", "Australia/Perth", "UTC")
    if kind == "enum":
        return v in (enum or [])
    if kind == "bool":
        return isinstance(v, bool)
    if kind == "id":
        return None                              # existence is checked by the endpoint, not the format alone
    return None
