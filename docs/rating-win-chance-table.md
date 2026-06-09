# Rating difference → win chance

Official lookup table mapping **absolute rating difference** (points) to the **favorite’s** pre-match win chance (%). Used for upset displays (e.g. Best wins → Biggest upsets).

Partner Chemistry and player profile still use the separate logistic model in `src/lib/ratings.ts` (scale 100).

## Rules

- **Favorite** = higher-rated side before the match (by team average in doubles).
- **Underdog win chance** = `100 − favoriteWinChance` for the same absolute gap.
- **Rating gap** in match data = opponent team rating − our team rating (positive = we were the underdog).
- **Extrapolation above 75**: extend linearly from diff 74→75 (+0.3% per point) until favorite chance reaches **99%**, then flatline.
- **UI display**: clamp shown win chance to **1%–99%** (never show 0%).

## Table (favorite win %)

| Diff | % | Diff | % | Diff | % | Diff | % |
|-----:|--:|-----:|--:|-----:|--:|-----:|--:|
| 0 | 50.0 | 19 | 60.2 | 38 | 70.1 | 57 | 78.4 |
| 1 | 50.0 | 20 | 60.8 | 39 | 70.6 | 58 | 78.8 |
| 2 | 50.6 | 21 | 61.3 | 40 | 71.1 | 59 | 79.2 |
| 3 | 51.2 | 22 | 61.9 | 41 | 71.5 | 60 | 79.6 |
| 4 | 51.7 | 23 | 62.4 | 42 | 72.0 | 61 | 79.9 |
| 5 | 52.3 | 24 | 62.9 | 43 | 72.5 | 62 | 80.3 |
| 6 | 52.9 | 25 | 63.5 | 44 | 72.9 | 63 | 80.7 |
| 7 | 53.4 | 26 | 64.0 | 45 | 73.4 | 64 | 81.0 |
| 8 | 54.0 | 27 | 64.5 | 46 | 73.8 | 65 | 81.4 |
| 9 | 54.6 | 28 | 65.1 | 47 | 74.3 | 66 | 81.7 |
| 10 | 55.2 | 29 | 65.6 | 48 | 74.7 | 67 | 82.0 |
| 11 | 55.7 | 30 | 66.1 | 49 | 75.1 | 68 | 82.4 |
| 12 | 56.3 | 31 | 66.6 | 50 | 75.6 | 69 | 82.7 |
| 13 | 56.9 | 32 | 67.1 | 51 | 76.0 | 70 | 83.0 |
| 14 | 57.4 | 33 | 67.6 | 52 | 76.4 | 71 | 83.4 |
| 15 | 58.0 | 34 | 68.1 | 53 | 76.8 | 72 | 83.7 |
| 16 | 58.5 | 35 | 68.6 | 54 | 77.2 | 73 | 84.0 |
| 17 | 59.1 | 36 | 69.1 | 55 | 77.6 | 74 | 84.3 |
| 18 | 59.7 | 37 | 69.6 | 56 | 78.0 | 75 | 84.6* |

\*Diff **75** extrapolated (+0.3 from diff 74); not in source screenshots.

## Example

Rating gap **+72** (they were 72 pts higher on average):

- Favorite win chance at diff 72 → **83.7%**
- Our pre-match win chance → **16.3%** (shown as **16%** after rounding, min 1%)

## Implementation

`src/lib/ratingWinChance.ts` — `favoriteWinChancePercent`, `ourPreMatchWinChancePercent`, `clampDisplayWinChance`, `formatUpsetWinChanceDisplay`.
