# Eggs (Gippsland Pastured) — Nutrition Calculation Investigation

## Conclusion

**Not a issue.** Our calculation, mapping, and serving-conversion logic are all correct. The source data from OpenFoodFacts for this specific product is wrong.

## Proof — Source Data is Wrong

OpenFoodFacts product page: https://world.openfoodfacts.org/product/0080687470310/eggs-gippsland-pastured

- Per 100 g, OFF lists: **267 kcal, 24.4 g protein, 19.8 g fat, 2.7 g carbs**
- OFF's own comparison table on that page shows these values are **93%–392% above** the average for "Eggs and their products"
- OFF's own data-quality flags on this exact record: `nutrition-value-very-high-for-category-energy / fat / saturated-fat / carbohydrates / proteins / salt`
- Source was submitted via a third-party app ("macrofactor"), not an official manufacturer/lab entry

So 267 kcal/100 g for eggs is flagged by OpenFoodFacts itself as abnormally high — a real egg is ~140–150 kcal/100 g.

## Proof — Our Calculation is Correct

Formula: `nutrition_per_100g × grams / 100`

Tested live in the app across 6 cases, all matching the formula exactly:

| Input                 | Calories | Protein | Fat  | Carbs |
| --------------------- | -------- | ------- | ---- | ----- |
| 1 serving @ 45 g      | 120 kcal | 11 g    | 9 g  | 1 g   |
| 1 serving @ 90 g (2×) | 240 kcal | 22 g    | 18 g | 2 g   |
| 1 serving @ 100 g     | 267 kcal | 24 g    | 20 g | 3 g   |
| 2 servings @ 100 g    | 534 kcal | 49 g    | 40 g | 5 g   |
| 3 servings @ 100 g    | 801 kcal | 73 g    | 59 g | 8 g   |
| 0.5 serving @ 100 g   | 134 kcal | 12 g    | 10 g | 1 g   |

- 90 g = exactly 2× 45 g ✅
- 2 servings = exactly 2× 1 serving ✅
- 100 g matches OFF's per-100g values exactly (267 kcal) ✅

All scaling is linear and consistent — no calculation, mapping, or serving-conversion bug.

## Recommendation

Correct or exclude this specific OpenFoodFacts record at the source. No backend/app issue with this.
