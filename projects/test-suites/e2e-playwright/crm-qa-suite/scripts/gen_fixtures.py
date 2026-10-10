#!/usr/bin/env python3
"""Deterministic AU-default test-data fixtures: one RFC 4180 CSV per field (UTF-8, no BOM).

    python scripts/gen_fixtures.py          ->  fixtures/<field>.csv + fixtures/README.md (with CRC32 of every file)

Rules from the data-fixtures brief that this script enforces:
  * No fabricated phone numbers: AU mobile examples are exactly the ones in the brief.
  * Every row has a non-empty `source`; rows are re-runnable (no randomness; the seed is pinned for the one
    generated token column and recorded in the README).
  * Length limits are the ones DISCOVERED by the audit matrix (reports/audit/matrix_*.json) when present, otherwise
    the stated fallback; the README says which.
  * AU-only domain tables (ABN, TFN, BSB, postcode, GST) are written as reference files because this CRM has no such
    fields yet; they are not mapped to any endpoint."""
from __future__ import annotations

import csv
import glob
import json
import random
import unicodedata
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "fixtures"
SEED = 20261002
RNG = random.Random(SEED)

COLS = ["field", "raw_input_as_user_typed", "utf8_hex", "normalised_form", "expected_validator_result", "category", "reason", "source"]
UI = "live UI walkthrough 2026-10-01 (Contacts, Companies, Deals, Pipelines, Catalog products, Activities)"
BRIEF = "data-fixtures brief, Step 2 (AU default domain library)"
RFC5322 = "RFC 5322 section 3.4.1 (addr-spec)"
RFC3696 = "RFC 3696 section 3 (local part max 64, domain max 255, address max 254)"
RFC6761 = "example.com (a public disposable-mailbox service used for all test addresses; never put real customer data in it)"
E164 = "ITU-T E.164 (max 15 digits)"
ISO4217 = "ISO 4217 (currency codes)"
RFC3339 = "RFC 3339 section 5.6 (date-time)"
ISO8601 = "ISO 8601-1 calendar dates"
UAX15 = "Unicode UAX #15 normalization forms (NFC/NFD)"
OWASP = "OWASP Web Security Testing Guide, input validation (WSTG-INPV)"
JSONSPEC = "RFC 8259 JSON (strings, numbers)"
IEEE754 = "IEEE 754 binary64 / ECMAScript Number.MAX_SAFE_INTEGER"


def limits():
    """{(op, field): (min_ok, max_ok)} discovered by the matrix, if it has been run."""
    out = {}
    for f in glob.glob(str(ROOT / "reports" / "audit" / "matrix_*.json")):
        try:
            for L in json.load(open(f, encoding="utf-8")).get("limits", []):
                out[(L["op"], L["field"])] = (L.get("min_ok"), L.get("max_ok"), L.get("max_plus1"))
        except Exception:
            pass
    return out


LIM = limits()


def hexs(s):
    return s.encode("utf-8", "surrogatepass").hex(" ") if isinstance(s, str) else ""


def show(s):
    """Visible, CSV-safe rendering: control characters and surrogates as \\uXXXX / \\xNN, nothing invisible."""
    if not isinstance(s, str):
        return str(s)
    out = []
    for ch in s:
        o = ord(ch)
        out.append(f"\\u{o:04x}" if (o < 32 or o == 127 or 0xD800 <= o <= 0xDFFF or ch in "​‍‮") else ch)
    return "".join(out)


class Table:
    def __init__(self, field):
        self.field, self.rows = field, []

    def add(self, raw, category, result, reason, source, norm=None):
        self.rows.append([self.field, show(raw), hexs(raw), show(norm if norm is not None else raw), result, category, reason, source])

    def write(self):
        OUT.mkdir(exist_ok=True)
        p = OUT / f"{self.field}.csv"
        with open(p, "w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh, lineterminator="\r\n", quoting=csv.QUOTE_MINIMAL)
            w.writerow(COLS)
            for r in self.rows:
                assert r[-1].strip(), "empty source is forbidden"
                w.writerow(r)
        return p


def common_text(t: Table, lo, hi, valid, valid2, kind_note):
    """The category rows every text field gets."""
    src = f"{kind_note}; limits {'discovered by audit matrix' if hi else 'fallback (not yet discovered)'}"
    t.add(valid, "positive", "accept", "canonical valid example", BRIEF)
    t.add(valid2, "positive-2", "accept", "alternate valid example", BRIEF)
    t.add("a" * lo, "min", "accept", f"exactly {lo} character(s)", src)
    if lo > 0:
        t.add("a" * (lo - 1), "min-1", "reject", f"{lo - 1} characters is below the minimum", src)
    if hi:
        t.add("a" * hi, "max", "accept", f"exactly {hi} characters", src)
        t.add("a" * (hi + 1), "max+1", "reject", f"{hi + 1} characters is above the maximum", src)
        t.add("a" * (hi * 10), "max*10 bytes", "reject", f"{hi * 10} characters", src)
    t.add("", "empty", "reject", "empty string", JSONSPEC)
    t.add("   ", "whitespace-only", "reject", "spaces only: should not count as a value", JSONSPEC)
    t.add("null", "null-vs-omitted", "reject-if-required", "JSON null (a distinct case from omitting the key)", JSONSPEC)
    t.add("<omitted>", "null-vs-omitted", "reject-if-required", "key absent from the body", JSONSPEC)
    t.add("12345", "type-mismatch", "accept-as-text", "digits in a text field are still text; the JSON type must be string", JSONSPEC)
    t.add("00012", "leading-zeros", "accept-as-text", "leading zeroes must be preserved, not turned into 12", JSONSPEC)
    t.add("1e10", "scientific-notation", "accept-as-text", "scientific notation text in a text field", JSONSPEC)
    t.add("-1", "negative-for-unsigned", "accept-as-text", "negative sign in a text field", JSONSPEC)
    t.add("\U0001F600", "emoji-only", "accept", "single emoji (astral code point, 2 UTF-16 units)", UAX15)
    t.add("\U0001F468‍\U0001F469‍\U0001F467", "zwj-sequence", "accept", "family emoji, three code points joined by ZWJ", UAX15)
    t.add("اَلْعَرَبِيَّةُ", "rtl", "accept", "Arabic with diacritics (right-to-left)", UAX15)
    t.add("é́́", "combining-marks", "accept", "e plus three combining acute accents", UAX15)
    t.add("‮evil", "rtl-override", "reject", "U+202E right-to-left override can spoof visible order", OWASP)
    t.add("\u0000", "nul", "reject", "NUL control character", OWASP)
    t.add("a\ud800b", "lone-surrogate", "reject", "unpaired UTF-16 surrogate: not valid Unicode text", UAX15)
    t.add("' OR 1=1 --", "sqli", "accept-inert", "SQL injection probe: must be stored and shown literally", OWASP)
    t.add("<script>alert(1)</script>", "xss", "accept-inert", "XSS probe: must be escaped on output", OWASP)
    t.add("<\\/foo>", "xml-json-injection", "accept-inert", "closing-tag probe", OWASP)
    t.add("../../etc/passwd", "path-traversal", "accept-inert", "path traversal probe", OWASP)
    t.add("\r\nSet-Cookie: x=y", "crlf-injection", "reject", "CRLF header-injection probe", OWASP)
    nfc, nfd = unicodedata.normalize("NFC", "ñ"), unicodedata.normalize("NFD", "ñ")
    t.add(nfc, "unicode-nfc", "accept", f"NFC n-tilde: bytes {hexs(nfc)}", UAX15, norm=nfc)
    t.add(nfd, "unicode-nfd", "accept", f"NFD n + combining tilde: bytes {hexs(nfd)}; same text, different bytes", UAX15, norm=nfc)
    t.add("Aa", "case-fold", "accept", "ASCII case folding pair", UAX15)
    t.add("Æ", "case-fold", "accept", "AE ligature folds to 'ae' (Norwegian/Danish overload)", UAX15)


def text_field(name, op, field, valid, valid2, note, fallback_hi=None, lo_default=1):
    t = Table(name)
    lo, hi, _ = LIM.get((op, field), (lo_default, fallback_hi, None))
    lo = lo if lo is not None else lo_default
    common_text(t, lo, hi, valid, valid2, note)
    return t


def main():
    tables = []
    tables.append(text_field("firstName", "contacts.create", "firstName", "Olivia", "Noah", "AU given names (live UI examples)"))
    tables.append(text_field("lastName", "contacts.create", "lastName", "Nguyen", "O'Connor", "AU family names incl. apostrophe"))
    tables.append(text_field("companyName", "companies.create", "name", "Harbour City Foods Pty Ltd", "Kiwi Builders Ltd", "AU business names"))
    tables.append(text_field("dealTitle", "deals.create", "title", "Harbour City Foods - Pro rollout", "Bluebird Dental - Starter pack", "deal titles as typed in the UI"))
    tables.append(text_field("productName", "catalog-products.create", "name", "CRM Pro (per seat / month)", "Premium support", "catalog names"))

    e = Table("email")
    lo, hi, _ = LIM.get(("contacts.create", "email"), (None, None, None))
    for raw, cat, res, why, src in [
        ("olivia.nguyen@example.com", "positive", "accept", "AU-style address on the project test domain", BRIEF),
        ("noah.smith@bigpond.net.au", "positive-2", "accept", "AU ISP domain", BRIEF), ("mia.collins@aussie.com.au", "positive-2", "accept", "AU domain", BRIEF),
        ("jack.wilson+invoices@gmail.com", "positive-2", "accept", "plus-addressing", BRIEF + "; " + RFC5322),
        ("OLIVIA@example.com", "case", "accept-lowercase", "domain is case-insensitive; storage form should be normalised", RFC5322),
        ("a" * 64 + "@" + "b" * 63 + "." + "c" * 63 + "." + "d" * 57 + ".com", "max", "accept", "254 characters, the RFC 3696 limit", RFC3696),
        ("a" * 64 + "@" + "b" * 63 + "." + "c" * 63 + "." + "d" * 58 + ".com", "max+1", "reject", "255 characters, one over", RFC3696),
        ("a" * 65 + "@example.com", "local-part max+1", "reject", "local part of 65 characters", RFC3696),
        ("olivia.example.com", "no-at", "reject", "missing @", RFC5322), ("a@", "no-domain", "reject", "empty domain", RFC5322),
        ("a@b", "no-tld", "reject", "no top-level label", RFC5322), ("a b@example.com", "space", "reject", "unquoted space", RFC5322),
        ("a..b@example.com", "double-dot", "reject", "consecutive dots", RFC5322), ("üñï@example.com", "unicode-local", "implementation-defined", "RFC 6531 internationalised local part", "RFC 6531 (SMTPUTF8)"),
        ("a@üñï.com", "idn-domain", "implementation-defined", "internationalised domain (punycode xn--)", "RFC 5890 (IDNA 2008)"),
        ("", "empty", "reject", "empty string", JSONSPEC), ("   ", "whitespace-only", "reject", "spaces only", JSONSPEC), ("null", "null-vs-omitted", "accept-if-optional", "JSON null", JSONSPEC),
        ("<omitted>", "null-vs-omitted", "accept-if-optional", "key absent", JSONSPEC), ("123", "type-mismatch", "reject", "number-like string is not an address", JSONSPEC),
        ("00012@example.com", "leading-zeros", "accept", "leading zeroes in the local part must survive", RFC5322),
        ("1e10@example.com", "scientific-notation", "accept", "local part that looks like a number", RFC5322),
        ("-1@example.com", "negative-for-unsigned", "accept", "local part starting with minus", RFC5322),
        ("\U0001F600@example.com", "emoji-only", "reject", "emoji local part", RFC5322),
        ("اَ@example.com", "rtl", "implementation-defined", "RTL local part", "RFC 6531"),
        ("é@example.com", "combining-marks", "implementation-defined", "combining mark in local part", "RFC 6531"),
        ("a\u0000b@example.com", "nul", "reject", "NUL in the local part", OWASP),
        ("' OR 1=1 --@example.com", "sqli", "reject", "SQL probe, not a valid address", OWASP),
        ("<script>alert(1)</script>@example.com", "xss", "reject", "XSS probe, not a valid address", OWASP),
        ("a@example.com\r\nBcc: victim@example.com", "crlf-injection", "reject", "header-injection into mail headers", OWASP),
        ("../../etc/passwd@example.com", "path-traversal", "implementation-defined", "traversal text as local part", OWASP)]:
        e.add(raw, cat, res, why, src)
    tables.append(e)

    ph = Table("phone")
    for raw, cat, res, why in [("0412345678", "positive", "accept", "AU mobile, national format"), ("+61 423 456 789", "positive-2", "accept", "AU mobile, international format"),
                               ("+61 434 567 890", "positive-2", "accept", "AU mobile"), ("+61 458 901 234", "positive-2", "accept", "AU mobile"), ("+61 401 234 567", "positive-2", "accept", "AU mobile"),
                               ("+1 412 345 6789", "wrong-country", "reject-or-accept-by-policy", "US number, valid E.164 but not AU"),
                               ("+61 12 345 6789", "invalid-au", "reject", "AU numbers do not start 12 after +61"), ("+61 4", "min-1", "reject", "prefix only"),
                               ("0412ABC678", "type-mismatch", "reject", "letters in digits"), ("1", "min", "reject", "one digit"), ("   ", "whitespace-only", "reject", "spaces only"),
                               ("", "empty", "reject", "empty string"), ("null", "null-vs-omitted", "accept-if-optional", "JSON null"), ("<omitted>", "null-vs-omitted", "accept-if-optional", "key absent"),
                               ("+" + "9" * 15, "max", "accept", "15 digits, the E.164 maximum"), ("+" + "9" * 16, "max+1", "reject", "16 digits, one over E.164"),
                               ("9" * 40, "max*10", "reject", "40 digits"), ("0004123456", "leading-zeros", "accept-as-text", "leading zeroes must be preserved"),
                               ("4.12e9", "scientific-notation", "reject", "scientific notation is not a phone number"), ("-0412345678", "negative-for-unsigned", "reject", "leading minus"),
                               ("(02) 9999 9999", "formatting", "accept", "AU landline with brackets (common user input)"), ("\U0001F600", "emoji-only", "reject", "emoji"),
                               ("١٢٣٤٥٦٧٨", "rtl", "reject-or-normalise", "Arabic-Indic digits"), ("' OR 1=1 --", "sqli", "reject", "SQL probe"),
                               ("<script>alert(1)</script>", "xss", "reject", "XSS probe"), ("\r\nSet-Cookie: x=y", "crlf-injection", "reject", "CRLF probe"), ("04123\u000045678", "nul", "reject", "NUL inside")]:
        ph.add(raw, cat, res, why, BRIEF + "; " + E164 if cat.startswith("positive") or cat in ("max", "max+1", "min", "min-1") else E164 + "; " + OWASP)
    tables.append(ph)

    dm = Table("domain")
    for raw, cat, res, why in [("acme.com.au", "positive", "accept", "AU domain"), ("shop.acme.com.au", "positive-2", "accept", "subdomain"),
                               ("ACME.COM.AU", "case", "accept-lowercase", "hostnames are case-insensitive"), ("https://acme.com.au", "scheme", "reject-or-strip", "a domain field holds a hostname"),
                               ("acme.com.au/path", "path", "reject-or-strip", "no path"), ("not a domain", "space", "reject", "spaces"), ("acme.com.au.", "trailing-dot", "accept-normalise", "FQDN root dot"),
                               ("a_b.acme.com.au", "underscore", "reject", "underscore is not a hostname character"), ("localhost", "single-label", "reject", "no dot"),
                               ("192.168.0.1", "ip", "reject", "IP literal"), ("a" * 63 + ".com", "label max", "accept", "63-character label"), ("a" * 64 + ".com", "label max+1", "reject", "64-character label"),
                               ("", "empty", "reject", "empty"), ("   ", "whitespace-only", "reject", "spaces"), ("null", "null-vs-omitted", "accept-if-optional", "null"), ("<omitted>", "null-vs-omitted", "accept-if-optional", "absent"),
                               ("üñï.com", "idn", "accept-punycode", "internationalised domain"), ("\U0001F600.com", "emoji-only", "reject-or-punycode", "emoji domain"),
                               ("' OR 1=1 --.com", "sqli", "reject", "SQL probe"), ("<script>.com", "xss", "reject", "XSS probe")]:
        dm.add(raw, cat, res, why, "RFC 1035 section 2.3.1 / RFC 1123 section 2.1 (hostnames); " + OWASP)
    tables.append(dm)

    am = Table("amount")
    for raw, cat, res, why, src in [("4900", "positive", "accept", "A$49.00 in minor units (cents)", BRIEF + "; " + UI), ("250000", "positive-2", "accept", "A$2,500.00", UI),
                                    ("0", "min", "accept", "zero is allowed", UI), ("-1", "min-1 / negative-for-unsigned", "reject", "amounts are unsigned", UI),
                                    ("9007199254740991", "max", "accept", "Number.MAX_SAFE_INTEGER", IEEE754), ("9007199254740992", "max+1", "reject", "first unsafe integer", IEEE754),
                                    ("9223372036854775807", "overflow", "reject", "int64 max exceeds safe integer", IEEE754), ("-9223372036854775808", "overflow-negative", "reject", "int64 min", IEEE754),
                                    ("-2147483648", "int32 min", "reject", "int32 min", IEEE754), ("2147483647", "int32 max", "accept", "int32 max", IEEE754), ("2147483648", "int32 max+1", "accept", "above int32 but safe", IEEE754),
                                    ("", "empty", "reject", "empty string", JSONSPEC), ("   ", "whitespace-only", "reject", "spaces", JSONSPEC), ("null", "null-vs-omitted", "accept-if-optional", "JSON null", JSONSPEC),
                                    ("<omitted>", "null-vs-omitted", "accept-if-optional", "absent", JSONSPEC), ("\"49\"", "type-mismatch", "reject", "string instead of number", JSONSPEC),
                                    ("00012", "leading-zeros", "reject", "JSON forbids leading zeros in a number; a string '00012' must not be coerced", JSONSPEC), ("1.", "trailing-dot", "reject", "invalid JSON number / non-integer", JSONSPEC),
                                    ("1,000", "thousands-separator", "reject", "separator is not valid JSON", JSONSPEC), ("1e10", "scientific-notation", "accept-if-integer", "10000000000 as a number", JSONSPEC),
                                    ("1e-10", "scientific-small", "reject", "non-integer", JSONSPEC), ("1e308", "scientific-large", "reject", "exceeds safe integer", IEEE754), ("-1e308", "scientific-negative-large", "reject", "negative and huge", IEEE754),
                                    ("-0.0001", "negative-decimal", "reject", "negative non-integer", JSONSPEC), ("49.99", "decimal", "reject", "minor units must be whole numbers", UI),
                                    ("Infinity", "non-finite", "reject", "not valid JSON", JSONSPEC), ("-Infinity", "non-finite", "reject", "not valid JSON", JSONSPEC), ("NaN", "non-finite", "reject", "not valid JSON", JSONSPEC),
                                    ("true", "bool-as-number", "reject", "boolean", JSONSPEC), ("1.0", "float-integer", "accept-if-integer", "1.0 is mathematically an integer", JSONSPEC)]:
        am.add(raw, cat, res, why, src)
    tables.append(am)

    cu = Table("currency")
    for raw, cat, res, why in [("AUD", "positive", "accept", "Australian dollar"), ("NZD", "positive-2", "accept", "New Zealand dollar"), ("JPY", "minor-units-0", "accept", "0 decimal places"),
                               ("BHD", "minor-units-3", "accept", "3 decimal places"), ("aud", "case", "reject", "must be upper case ^[A-Z]{3}$"), ("XYZ", "unknown-code", "reject", "not in ISO 4217"),
                               ("AU", "min-1", "reject", "2 letters"), ("AUDD", "max+1", "reject", "4 letters"), ("123", "type-mismatch", "reject", "digits"), ("", "empty", "reject", "empty"),
                               ("   ", "whitespace-only", "reject", "spaces"), ("null", "null-vs-omitted", "reject-if-required", "null"), ("<omitted>", "null-vs-omitted", "reject-if-required", "absent"),
                               ("\U0001F600\U0001F600\U0001F600", "emoji-only", "reject", "three emoji"), ("A\u0000D", "nul", "reject", "NUL inside")]:
        cu.add(raw, cat, res, why, ISO4217 + "; " + BRIEF)
    tables.append(cu)

    for name, rows in [("date", [("29/02/2000", "positive", "accept-AU-format", "valid leap day, dd/mm/yyyy"), ("2000-02-29", "positive-iso", "accept", "valid leap day, ISO"),
                                 ("29/02/1900", "not-leap", "reject", "1900 is not a leap year"), ("1900-02-29", "not-leap-iso", "reject", "1900 is not a leap year"),
                                 ("31/04/2024", "no-such-day", "reject", "April has 30 days"), ("2024-04-31", "no-such-day-iso", "reject", "April has 30 days"),
                                 ("13/13/2024", "month-13", "reject", "no month 13"), ("2024-13-01", "month-13-iso", "reject", "no month 13"), ("00/01/2024", "day-0", "reject", "no day 0"),
                                 ("2024-00-01", "month-0", "reject", "no month 0"), ("2024-02-30", "feb-30", "reject", "no Feb 30"), ("31-12-9999", "non-iso", "reject", "wrong separator order"),
                                 ("1970-01-01", "epoch", "accept", "Unix epoch"), ("2038-01-19", "y2038", "accept", "32-bit time_t rollover day"), ("0001-01-01", "min", "accept-if-supported", "earliest ISO date"),
                                 ("9999-12-31", "max", "accept", "latest ISO date"), ("", "empty", "reject", "empty"), ("   ", "whitespace-only", "reject", "spaces"), ("null", "null-vs-omitted", "accept-if-optional", "null"),
                                 ("<omitted>", "null-vs-omitted", "accept-if-optional", "absent"), ("20240229", "basic-format", "reject-or-accept-by-policy", "ISO basic format without separators"),
                                 ("1e10", "scientific-notation", "reject", "number-like"), ("\U0001F600", "emoji-only", "reject", "emoji")]),
                        ("datetime", [("2026-10-10T10:00:00+11:00", "positive", "accept", "AEDT offset"), ("2026-10-10T10:00:00Z", "positive-2", "accept", "UTC"),
                                      ("2026-10-04T02:30:00+11:00", "dst-gap", "accept-or-reject-by-policy", "Sydney DST starts 2026-10-04 02:00 -> 03:00; 02:30 local does not exist"),
                                      ("2026-04-05T02:30:00+10:00", "dst-ambiguous", "accept", "Sydney DST ends 2026-04-05 03:00 -> 02:00; 02:30 local occurs twice (+11 and +10)"),
                                      ("2026-04-05T02:30:00+11:00", "dst-ambiguous", "accept", "the first (daylight) 02:30"), ("2026-03-29T01:30:00+09:00", "brief-literal", "accept", "the literal example from the brief"),
                                      ("1969-12-31T23:59:59Z", "epoch-minus-1s", "accept-if-supported", "one second before the epoch"), ("1970-01-01T00:00:00Z", "epoch", "accept", "epoch"),
                                      ("9999-12-31T23:59:59Z", "max", "accept", "last representable second"), ("2016-12-31T23:59:60Z", "leap-second", "accept-or-reject-by-policy", "leap second"),
                                      ("2026-10-10T24:00:00Z", "hour-24", "reject", "24:00:00 is allowed only in ISO 8601-1 as end-of-day, not in RFC 3339 profile"),
                                      ("2026-10-10T10:00:00", "no-offset", "reject", "RFC 3339 requires an offset"), ("2026-10-10", "date-only", "reject", "not a date-time"),
                                      ("2026-10-10 10:00:00Z", "space-separator", "reject", "RFC 3339 allows space only by note; ISO uses T"), ("tomorrow", "garbage", "reject", "not a timestamp"),
                                      ("", "empty", "reject", "empty"), ("   ", "whitespace-only", "reject", "spaces"), ("null", "null-vs-omitted", "accept-if-optional", "null"), ("<omitted>", "null-vs-omitted", "accept-if-optional", "absent")])]:
        t = Table(name)
        for raw, cat, res, why in rows:
            t.add(raw, cat, res, why, (RFC3339 if name == "datetime" else ISO8601) + "; " + BRIEF + ("; Australian DST dates: timeanddate.com/time/change/australia/sydney (2026)" if "dst" in cat else ""))
        tables.append(t)

    # reference tables (no CRM field yet): AU domain library
    ref = Table("au_reference")
    for raw, cat, res, why, src in [("33 102 417 032", "ABN valid", "accept", "ABN passes the ATO mod-89 check", "ATO ABN check-digit algorithm (abr.business.gov.au)"),
                                    ("12 345 678 901", "ABN invalid", "reject", "fails mod-89", "ATO ABN check-digit algorithm"), ("123 456 782", "TFN valid", "accept", "passes the mod-11 weights check", "ATO TFN algorithm"),
                                    ("123 456 789", "TFN invalid", "reject", "fails the mod-11 check", "ATO TFN algorithm"), ("062-000", "BSB valid", "accept", "Commonwealth Bank BSB", "AusPayNet BSB database"),
                                    ("2000", "postcode NSW", "accept", "Sydney", "Australia Post postcode file"), ("0200", "postcode ACT", "accept", "NT/ACT range starts 0200", "Australia Post postcode file"),
                                    ("0800", "postcode NT", "accept", "Darwin", "Australia Post postcode file"), ("7999", "postcode invalid", "reject", "above TAS range", "Australia Post postcode file"),
                                    ("9999", "postcode invalid", "reject", "not assigned", "Australia Post postcode file"), ("A1B2C3", "postcode invalid", "reject", "letters", "Australia Post postcode file"),
                                    ("200", "postcode invalid", "reject", "3 digits", "Australia Post postcode file"), ("$110.00", "GST total", "accept", "subtotal $100.00 + GST 10% = $110.00", "A New Tax System (Goods and Services Tax) Act 1999 (Cth) s 9-70")]:
        ref.add(raw, cat, res, why, src)
    tables.append(ref)

    OUT.mkdir(exist_ok=True)
    lines = ["# Fixtures", "", "Deterministic, re-runnable. Regenerate with `python scripts/gen_fixtures.py`; compare the CRC32 values below to detect drift.", "",
             f"- Generator seed (pinned for any generated token): `{SEED}`. This version uses no random values, so output is byte-identical every run.",
             "- Length limits: " + ("discovered by the audit matrix for: " + ", ".join(sorted(f"{o}.{f}" for (o, f), v in LIM.items() if v[1])) + ". Text fields not listed have no `max` rows yet (run audit/run_matrix.py, then regenerate)." if LIM else "none discovered yet: run audit/run_matrix.py first, then regenerate. Only min/min-1 rows are emitted until then.") ,
             "- Columns: `field, raw_input_as_user_typed, utf8_hex, normalised_form, expected_validator_result, category, reason, source`. Control characters are shown as `\\uXXXX`; `utf8_hex` is the exact byte sequence.",
             "- `expected_validator_result` is the *recommended* behaviour; where the product rule is a policy decision it says `accept-or-reject-by-policy` / `implementation-defined`.",
             "- `au_reference.csv` has no matching CRM field today (ABN/TFN/BSB/postcode/GST); kept for future forms.", "",
             "| file | rows | CRC32 | sources used |", "|---|---:|---|---|"]
    for t in tables:
        p = t.write()
        crc = f"{zlib.crc32(p.read_bytes()) & 0xFFFFFFFF:08x}"
        srcs = sorted({r[-1].split(';')[0] for r in t.rows})
        lines.append(f"| {p.name} | {len(t.rows)} | `{crc}` | {'; '.join(srcs)[:200]} |")
    lines += ["", "## Source key", "", f"- Brief: {BRIEF}", f"- {RFC5322}", f"- {RFC3696}", f"- {RFC6761}", f"- {E164}", f"- {ISO4217}", f"- {RFC3339}", f"- {ISO8601}",
              f"- {UAX15}", f"- {OWASP}", f"- {JSONSPEC}", f"- {IEEE754}", f"- {UI}"]
    (OUT / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("wrote", len(tables), "CSV files +README to", OUT)


if __name__ == "__main__":
    main()
