# Regression report: ZeroGap storefront, 2026-10-13

Store: https://bcppqf-4m.myshopify.com  |  Baseline: crawl and bug list from 2026-10-10/12
Evidence: `evidence/REGRESSION_2026-10-13_link-crawl.json` (every link, redirect chain and status)

## 1. Link and redirect check
Crawled **68 pages** (menus, footer, collections, products, pages, blog) and tested **273 unique links**.

| Result | Count | Detail |
|---|---|---|
| Internal links working (200, after following redirects) | 140 of 147 | |
| Internal links broken (404) | 7 | All already logged: ZG-017 (5 gaming tiles), ZG-019 (/pages/compare), ZG-018 (/pages/faqs) |
| Redirects | 14 | `/collections/all/products/<x>` 301 to `/products/<x>` (canonical, expected); `/account` and `/account/login` 302 to Shopify customer login (expected) |
| Redirect chains longer than 1 hop | 0 | |
| Dead `#` links | 1 pattern | Social icons TW, FB, IN, Snapchat, Vimeo on every page (ZG-005) |
| Anchors (`#id`) with missing target | 0 | |
| mailto / tel | 2 | Valid format. Note two different support emails across pages (ZG-039) |
| External links | 0 real | The 56 "external" hits are the same Shopify login URL repeated; it returned 406 to a script but loads in a browser |

New navigation links since 2026-10-10: **none found**. Header and footer menus are unchanged.
The B2B catalogue and the application form are still not linked from any page (ZG-049).

## 2. Functional regression (Playwright, Desktop Chrome, 203 tests, 31 min)
- 202 behaved as expected, 1 failed unexpectedly, 0 flaky.
- The one failure was a **stale test fixture**, not a site regression: product `uppercut-deluxe-clay-spray` was
  removed from the store (now 404). Fixed in `tests/sold-out-and-forms.spec.ts` to use `uppercut-matte-pomade`,
  which is currently sold out. Re-run: 14/14 as expected.

## 3. What changed on the site since 2026-10-10
| Change | Effect |
|---|---|
| Catalogue cleaned: 71 to 52 products | $0.00 items, missing images and several sold-out items are gone (ZG-027, 028, 036 fixed) |
| Product `uppercut-deluxe-clay-spray` (and the other Uppercut Deluxe items) removed | Old test fixture broke (fixed) |
| Stylesheets `component-show-more.css` / `component-pagination.css` | No longer requested (ZG-030 not reproducing) |
| Checkout "problem with our checkout" banner | Not reproducing in 3 runs (ZG-008, re-test before closing) |

## 4. Bugs re-verified on 2026-10-13
| ID | Status |
|---|---|
| ZG-016 sold-out items can be added to cart | **Still present**: 3 of 3 sold-out variants added with HTTP 200 |
| ZG-017, 018, 019 broken links | **Still present** (7 x 404) |
| ZG-005 dead social links | **Still present** |
| ZG-029 brand filter count | Still present (ProRapid (2) of 22) |
| ZG-032 empty menu collections | Still present (clippers-trimmers-shavers, bundles-kits, muk-hair-care) |
| ZG-050 footer case, ZG-045/046 trade copy, ZG-049 B2B link | Still present |
| ZG-052 About page placeholders | **New**: "SUB TITLE / TITLE / SHORT DESCRIPTION" visible |

## 5. Open items for the client
1. Link the B2B catalogue from the Trade portal (ZG-049).
2. Fix or remove the five gaming tiles, the FAQ button and the hidden compare link (ZG-017/018/019).
3. Block adding sold-out items to the cart (ZG-016, High).
4. Fill in the About page block (ZG-052).
