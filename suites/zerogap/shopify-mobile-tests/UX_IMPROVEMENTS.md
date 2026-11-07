# ZeroGap Supply Co: Checkout UX and Workflow Suggestions

Store: https://bcppqf-4m.myshopify.com  |  Scope: add to cart > cart > checkout (Desktop 1366x800 and Pixel 9)
Basis: the existing 26 passing checkout tests, the 26 logged bugs in `BUGS.csv`, and an exploratory probe on 2026-10-10 (evidence: `evidence/ZG-021-026_*`). No payment was submitted.

Effort: S = a settings change, M = theme or copy work, L = development.

## 1. Fix first (these hurt conversion or reporting)

| # | Suggestion | Why (evidence) | Bug | Effort |
|---|---|---|---|---|
| 1 | Prevent out-of-stock and runaway quantities reaching checkout | Sold-out item can be added; 10,000 units accepted | ZG-001, ZG-016 | M |
| 2 | Show only field-level errors on failed submit | A generic "There was a problem with our checkout" banner appears alongside field errors | ZG-008 | S |
| 3 | Repair the Meta Pixel ID | Pixel rejects `'1850451346134771'` (stray quotes), so ad attribution is broken | ZG-021 | S |
| 4 | Remove dead and 404 links before launch | 5 gaming tiles, FAQ button, compare link | ZG-017, 018, 019 | S |

## 2. Cart to checkout flow

| # | Suggestion | Detail | Effort |
|---|---|---|---|
| 5 | One cart pattern on every viewport | Desktop opens a drawer, mobile navigates to /cart (ZG-010). Choose one | M |
| 6 | Stop Enter in the quantity box jumping to checkout | Add an explicit "Update" or debounce-update on change (ZG-020) | M |
| 7 | Inline validation message on invalid quantity | Today -1 / empty / "e" silently becomes 1 (ZG-011) | M |
| 8 | Show shipping cost and delivery estimate before checkout | Checkout shows "Enter shipping address" for shipping, which is a known drop-off point. Add a shipping calculator or free-shipping threshold bar to the cart | M |
| 9 | Low-stock and "Only N left" message | Pairs with stock cap fix (#1) | M |

## 3. Checkout form

| # | Suggestion | Detail | Effort |
|---|---|---|---|
| 10 | Match error copy to field labels (Postcode, Suburb) | Errors say "ZIP / postal code" and "city" on an en-AU store (ZG-022). Edit in Checkout editor > Languages | S |
| 11 | Validate phone, or hide it | "abc" is accepted (ZG-023) | S |
| 12 | Reduce form friction | Enable address autocomplete (the Address field is a combobox, so confirm it returns AU suggestions), keep email-only contact, and turn on "Save this information" by default | S |
| 13 | Show errors in a summary at the top and move focus to the first invalid field | On submit, errors are scattered down a long page. Focus stays on Email | M |
| 14 | Add a visible "Return to cart" link at the top on mobile | A cart link exists but is only an icon in the header | S |
| 15 | Clarify "Cash on Delivery" | Add instructions (fee, who delivers, which areas). Confirm COD is intended for an AU store | S |

## 4. Trust and clarity

| # | Suggestion | Detail | Effort |
|---|---|---|---|
| 16 | Show payment and security badges, returns and contact link in the checkout footer | Reduces abandonment on first-time purchases | S |
| 17 | Order confirmation and emails: verify names are escaped | Names accept HTML (ZG-024). Check the confirmation email and packing slip | S |
| 18 | Remove console noise | 401 and "Failed to execute action" on load (ZG-025) can hide real errors during support | M |

## 5. Accessibility

| # | Suggestion | Detail | Effort |
|---|---|---|---|
| 19 | Name every payment radio | Two radios expose only "on" (ZG-026) | M |
| 20 | Fix the in-stock quick-add label that reads "Sold out" | ZG-012 | S |
| 21 | Single H1 on product pages | ZG-006 | S |
| 22 | Add axe-core to the Playwright suite | Catches regressions like #19 and #21 automatically | M |

## 6. Test suite improvements

| # | Suggestion | Detail | Effort |
|---|---|---|---|
| 23 | Automate ZG-021 to ZG-026 | Console-error assertion for the pixel, phone/name validation, radio names | M |
| 24 | Add a "no console errors on checkout" guard | Fails when new warnings appear | S |
| 25 | Add a happy-path test in a test store | Full purchase with Shopify Bogus Gateway on a development store only. Never on this live store | L |
| 26 | Postcode / state mismatch test | Probe confirmed "Enter a valid ZIP / postal code for Victoria" works for 2000 + Victoria, so it can be asserted | S |
| 27 | Shipping-method and discount-applied cases | Needs a valid address and a real discount code (ask the store owner for a test code) | M |
| 28 | Run the suite nightly against the live store with 1 worker | The store returns HTTP 429 on bursts, so keep workers=1 | S |

## 7. Collections, filters and sorting

| # | Suggestion | Why (evidence) | Bug | Effort |
|---|---|---|---|---|
| 29 | Fix filter data so counts are trustworthy | Brand shows ProRapid (2) on a 22-product collection | ZG-029 | S |
| 30 | Disable or hide filter values with 0 results | "Out of stock (0)" is selectable and leads to an empty grid | ZG-031 | S |
| 31 | Show active-filter chips with a one-click "Clear all" | Users cannot see at a glance which filters narrowed the list | | M |
| 32 | Give price filter inputs validation and a message | Min greater than max returns 0 products silently; text values are ignored silently | | S |
| 33 | Handle out-of-range pages gracefully | page=99 shows an empty grid; page=0/-1/abc silently show page 1 | ZG-031 | S |
| 34 | Never show $0.00 for sold-out items; sort sold-out last | 14 sold-out items show $0.00 and sort first on price low to high | ZG-028 | S |
| 35 | Add a "Notify me when back in stock" on sold-out items | 14 of 71 products are sold out with no way to ask for stock | | M |
| 36 | Remove empty collections from the menu or fill them | Clippers, Bundles & Kits and muk all show NO PRODUCTS FOUND | ZG-032 | S |

## 8. Search

| # | Suggestion | Why (evidence) | Bug | Effort |
|---|---|---|---|---|
| 37 | Add predictive search with product thumbnails and prices | Only a results page exists; users must submit to see matches | | M |
| 38 | Empty-state and "did you mean" for no-result searches | "xyzzy123" returns 0 with no suggestions; empty query is a blank page | ZG-034 | S |
| 39 | Make search case-insensitive and add synonyms | wax = 34 results, WAX = 36 | ZG-033 | S |
| 40 | Add collection and page results alongside products | Searching "returns" or "warranty" finds only products | | M |

## 9. Wishlist and favourites

| # | Suggestion | Why (evidence) | Bug | Effort |
|---|---|---|---|---|
| 41 | Show saved state on the heart (filled icon, "Remove from wishlist") | Label stays "Add to wishlist" after saving | ZG-042 | S |
| 42 | Sync the wishlist to the customer account | List is only in browser localStorage, so it is lost on another device | ZG-042 | L |
| 43 | Add "Add to cart" and "Remove" on each wishlist item | Page lists name and price; users must go back to the product | | M |
| 44 | Show a toast ("Saved to wishlist - View") after saving | Only the header count changes, which is easy to miss | | S |
| 45 | Link the wishlist from the cart and from the header on mobile | Needed to move saved items into the cart without searching again | | S |
| 46 | Remove the hidden "View compare" link or build the compare page | /pages/compare is 404 | ZG-019 | S |

## 10. Product page

| # | Suggestion | Why (evidence) | Bug | Effort |
|---|---|---|---|---|
| 47 | Add related products and "recently viewed" | Product page has no cross-sell block | | M |
| 48 | Lower the low-stock threshold and show real scarcity only | "Only 155 left" appears at 155 units | ZG-043 | S |
| 49 | Show the warranty block only for machines | Warranty appears on wax and cologne | ZG-037 | S |
| 50 | Replace placeholder descriptions | "to be confirmed" lines and wrong paste/fiber copy | ZG-035 | M |
| 51 | Make the express checkout line real buttons or remove it | Shows "Express checkout with Shop Pay - Apple Pay - Google Pay" as text; confirm wallet buttons render | | S |
| 52 | Add reviews or ratings | None present; important for consumables and trade buyers | | L |
| 53 | Show a size/volume unit price (per 100ml) | Many 150ml, 300ml, 400ml, 1500ml items to compare | | M |

## 11. Content, trust and consistency

| # | Suggestion | Why (evidence) | Bug | Effort |
|---|---|---|---|---|
| 54 | One support email and phone across all pages | zerogap.com.au vs zerogapsupplyco.com.au | ZG-039 | S |
| 55 | Fix policy page copy and add an effective date | Returns page reuses shipping subtitle | ZG-038 | S |
| 56 | Show shipping thresholds early (free over $99, $9.95 standard) | Policy states them; product and cart pages do not | | S |
| 57 | Clean the blog: remove duplicate post, brand byline | Same post listed twice | ZG-040 | S |
| 58 | Normalise vendor, type and title casing | "Mats_Organisers", "150ML" vs "150ml", "H2B / Generic" | ZG-041 | S |

## 12. Mobile

| # | Suggestion | Why (evidence) | Bug | Effort |
|---|---|---|---|---|
| 59 | Enlarge breadcrumb and small links to 44 px tap targets | HOME and ALL COLLECTIONS under 24 px | ZG-044 | S |
| 60 | Consider a sticky "Filter and sort" bar on mobile | Collections list 12 products per page; a sticky bar keeps filters reachable (suggestion, not a defect) | | S |
| 61 | Show a live results count on the mobile filter button | Lets users see what a filter returns before closing the drawer (suggestion, not a defect) | | M |

## 13. Client feedback and feature requests

| # | Suggestion | Detail | Bug | Effort |
|---|---|---|---|---|
| 62 | Support multiple named wishlists | Current wishlist is one list of product handles in browser localStorage (key shopify-wishlist, script dt_wishlist.js), with no account or list names. Needs custom development: named lists, a "Save to list" picker, and storage per customer account (customer metafields or an app) so lists follow the user | | L |
| 63 | Show brand options under each category in the menu | The header menu has only 4 top-level items with no brand children. Add brand sub-items (Navigation menu children or a mega menu), and fix the Brand filter data (ZG-029) so brand pages are accurate. The B2B catalogue page already has a "3 brands" accordion per category | ZG-029 | M |
| 64 | Make the B2B catalogue reachable | Link /pages/b2b-catalog-product-list from the Trade portal page and trade account area and give it a proper title | ZG-049 | S |
| 65 | Use one letter case for all footer links | Useful links are all caps while other columns are title case | ZG-050 | S |
