# Partner Chemistry — Front-end build spec

**Audience:** Engineer implementing the Partner Chemistry dashboard block from scratch (prototype).  
**Assumption:** Match history data is already loaded and normalised into a consistent match model (one row per game). You are not implementing import or persistence.  
**Scope:** Dashboard **Partner chemistry** section only — horizontal bar chart, filters, empty states, and client-side aggregation. Tournament recap “chemistry highlights” are a separate feature; see [Appendix: recap highlights](#appendix-recap-highlights) if you need parity later.

---

## What you are building

A card on the player dashboard that answers: *“With each partner, are we winning more or less than the ratings on those matches would predict?”*

- **Headline metric:** **Overperformance** (percentage points) = actual win % − expected win %.
- **Chart:** Horizontal bars, one row per partner, sorted best chemistry first.
- **Axis label:** **“Wins vs Expected”** — this is overperformance in points, not raw win rate.

Positive overperformance = beating expectation with that partner. Negative = underperforming. `null` = cannot compute expectation (not enough rating data).

---

## Input data contract

Each match row should expose at least the fields below. Names mirror the standard match-history export; your normalisation layer may rename them, but the semantics must match.

### Fields used by Partner Chemistry

| Field | Role |
|-------|------|
| `partnerName` | Groups rows; must be non-null/non-empty to include the match |
| `outcome` | `'win'` or `'loss'` only count toward chemistry; `'unknown'` excluded |
| `nonCompetitiveReason` | Must be `null` for the match to count (see [Match inclusion](#match-inclusion)) |
| `date` | Time filter |
| `competitionName` | Distinct count when “Count by” = competitions |
| `discipline` | Singles vs doubles opponent-rating rule |
| `playerRating` | Our-side rating (or parse from raw `Player Rating`) |
| Partner rating | From raw `Partner Rating` |
| Opponent ratings | From raw `Opponent 1 Rating`, `Opponent 2 Rating` |

### Fields not used in chemistry (safe to ignore here)

| Field | Note |
|-------|------|
| `Round` | — |
| `Tournament Category` | Not applied in this section (no competition-type filter in UI) |
| `Player Name` | Sheet is already scoped to one player |
| Opponent names | Only matter at import for walkover / no-match detection |
| Per-game score columns | Only used upstream to derive `outcome` |
| `Score Text` | Only used upstream for non-competitive detection |

### Partner grouping

Partners are grouped by **exact string** on `partnerName` (trimmed at import). No fuzzy matching, aliases, or normalisation.

### Discipline

There is **no** discipline filter in this section. Any match with a partner name and a win/loss counts — including mixed doubles. Singles usually have no partner and drop out naturally. Copy may say “doubles”; behaviour is **partner name present**, not discipline code.

---

## Match inclusion

A match enters chemistry if **all** of the following hold:

1. **Competitive** — `nonCompetitiveReason == null`.
2. **Partner present** — `partnerName != null` (and typically non-empty).
3. **Decisive result** — `outcome === 'win'` or `outcome === 'loss'`.

### Non-competitive rows (upstream)

Before chemistry runs, import/normalisation should mark non-competitive rows using text from **`Score Text`**, **`Opponent 1 Name`**, and **`Opponent 2 Name`** (normalised: trim, lower case, collapse spaces).

| Reason | Typical patterns |
|--------|------------------|
| Walkover | `walkover`, `w/o`, `wo`, `walkover win/loss`, `won/lost by walkover`, etc. |
| No match | `no match`, `no-match` |

Those rows get `outcome: 'unknown'` and `nonCompetitiveReason` set; they never enter chemistry.

### Outcome derivation (upstream)

If not non-competitive, outcome comes from game scores (`Player Game N Score` vs `Opponent Game N Score` for N = 1..3): more games won → `'win'`, more lost → `'loss'`, otherwise `'unknown'`.

---

## Calculations

### Step 1 — Filter matches (dashboard)

Apply only the filters exposed in this section (see [Controls and filter options](#controls-and-filter-options)). Default: all time, no competition/discipline/partner restriction.

### Step 2 — Eligible matches

Filter to chemistry-eligible matches (see [Match inclusion](#match-inclusion)).

### Step 3 — Per-partner accumulators

For each distinct `partnerName`, over eligible matches:

| Accumulator | Rule |
|-------------|------|
| `wins` | +1 if `outcome === 'win'` |
| `losses` | +1 if `outcome === 'loss'` |
| `games` | `wins + losses` |
| `competitions` | Number of **distinct** `competitionName` values |
| `expectedSum` | Add match expected probability `p` when ratings allow |
| `ratedGames` | +1 for each match where `p` is defined |

**Important:** Unrated matches still count toward wins, losses, and **actual** win %. They do **not** count toward expected win % or overperformance.

### Step 4 — Expected win probability per match

**Our team rating**

```
player  = playerRating (or parsed Player Rating)
partner = parsed Partner Rating

if player is null → ourTeam = null
else if partner is null → ourTeam = player
else → ourTeam = (player + partner) / 2
```

**Opponent team rating**

```
r1 = Opponent 1 Rating
r2 = Opponent 2 Rating

if discipline is singles (MS, WS, OS):
    oppTeam = r1
else if r1 and r2 both present:
    oppTeam = (r1 + r2) / 2
else if r1 present:
    oppTeam = r1
else if r2 present:
    oppTeam = r2
else:
    oppTeam = null
```

**Logistic probability** (when both `ourTeam` and `oppTeam` are numbers):

```
diff = ourTeam − oppTeam
p = 1 / (1 + 10^(−diff / 100))
```

`p` is in (0, 1). The scale **100** is chosen so a **+100** rating gap implies ~**90%** expected win chance.

If either team rating is missing → `p = null` for that match.

### Step 5 — Per-partner percentages

Rounding everywhere percentages are shown:

```
roundPercent(x) = round(x × 10) / 10    // one decimal place
```

Let \(W\), \(L\) be wins/losses, \(G = W + L\), \(R\) = `ratedGames`, \(E\) = `expectedSum`.

```
actualWin% = roundPercent((W / G) × 100)

expectedWin% = R > 0 ? roundPercent((E / R) × 100) : null

overperformance = expectedWin% != null
    ? roundPercent(actualWin% − expectedWin%)
    : null
```

### Worked example

Three rated games with \(p\) = 0.40, 0.50, 0.60 → `expectedSum` = 1.5, `ratedGames` = 3 → **expectedWin% = 50.0%**.

2 wins, 1 loss → **actualWin% = 66.7%** → **overperformance = +16.7%**.

### Step 6 — Minimum threshold and sort

**Visibility:** Show partner only if:

```
count >= minThreshold
```

where `count` is `games` if “Count by” = matches played, or `competitions` if “Count by” = competitions.

**Sort (list passed to chart):**

1. `overperformance` descending (`null` treated as −∞).
2. Tie-break: more `games` first.

Track metadata for UI copy:

- `totalPartnerCount` — partners before threshold.
- `hiddenCount` — partners below threshold.
- `doublesMatchCount` — count of chemistry-eligible matches in the filtered set.

---

## Controls and filter options

This section exposes **four** controls. Other global filters (competition, discipline, partner) exist elsewhere on the dashboard but are **not** wired here — always “all”.

### 1. Time

Single select. Empty / “All time” means `time = 'all'` (no date restriction).

**Fixed options (always available):**

| Value | Label |
|-------|--------|
| `all` | All time |
| `24m` | Last 24 months |
| `12m` | Last 12 months |
| `6m` | Last 6 months |
| `3m` | Last 3 months |

**Dynamic options:** One entry per calendar year present in the dataset (e.g. `2025` → label `2025`), sorted **newest first**.

**Matching rules** (relative to “today” when filtering):

| Value | Include match if |
|-------|------------------|
| `all` | Always |
| `3m` / `6m` / `12m` / `24m` | `date` ≥ start of day that many calendar months before reference date |
| `YYYY` (four digits) | `date`’s calendar year equals `YYYY` |
| Unparseable `date` | Excluded whenever time ≠ `all` |

### 2. Count by

| Value | Label | Threshold counts |
|-------|--------|------------------|
| `games` | Matches played | Total win+loss games with partner |
| `competitions` | Competitions | Distinct `competitionName` with partner |

The minimum-threshold label should switch: “Minimum **games**” vs “Minimum **competitions**”.

### 3. Minimum threshold

- **Control:** number input  
- **Default:** `5`  
- **Range:** integer **1–99** (clamp out-of-range input)  
- **Purpose:** Hide partners with too little sample size

### 4. Show

Presentation mode for the chart. Default: **Chemistry**.

| Value | Label | Chart behaviour |
|-------|--------|-----------------|
| `chemistry` | Chemistry | Bars = \|overperformance\|; sort by overperformance desc; axis “Wins vs Expected” |
| `partnershipRating` | Partnership rating | Bars = avg team rating + chemistry (rating pts); sort by adjusted rating desc; axis “Partnership rating”; decomposition at bar end e.g. `663 (637+26)` |

Partnership-rating mode only includes threshold-met partners with enough rating data for team rating and chemistry. Partners without rating data stay in the summary count but do not get a bar.

### Filter summary line

Show how many partners are visible vs total, e.g.  
`Showing 8 of 12 partners (4 hidden below 5 games)`.

Also show match count for the **time-filtered full dataset** (all match types), e.g. filtered count vs total imported matches — not only doubles.

---

## Chart UI specification

### Chemistry mode (default)

#### No gradient on bars

Bars use **solid fills**, not a colour gradient. If you are comparing to another chart in the product that uses gradients, Partner Chemistry does not.

### Bar length and axis scale (reactive, not fixed)

| Aspect | Behaviour |
|--------|-----------|
| **Bar length** | Proportional to `abs(overperformance)` for partners that have a non-null overperformance |
| **X-axis domain** | **Data-driven:** `max = max(8, largest |overperformance|)`, then upper bound = `ceil(max / 4) × 4` (always a multiple of 4, minimum axis top **8**) |
| **Chart width** | **Responsive** — container `width: 100%` |
| **Chart height** | **Reactive:** `max(200px, numberOfBars × 44 + 48)` |
| **Max bar thickness** | Cap bar thickness (~22px) so many partners stay readable |
| **Category gap** | ~18% gap between rows |

So: the **scale** reacts to the data; there is no fixed “0–100%” domain. The **minimum** visible axis extent is 8 percentage points.

### Which partners appear on the chart

- Input list = partners that passed the **minimum threshold**.
- Plot only rows where **`overperformance != null`**.
- Re-sort plotted rows by overperformance descending (same order as typical sort).
- Partners that met the count threshold but have **no rated games** stay in the summary count but **do not** get a bar.

**Footnote when needed:**  
`{N} partner(s) hidden — not enough rating data to estimate expected win rate.`

### Colours

Use semantic tokens (hex equivalents for prototypes):

| Condition | Token | Hex |
|-----------|--------|-----|
| Overperformance &gt; 0 | gain-600 | `#047e10` |
| Overperformance &lt; 0 | loss-600 | `#a10000` |
| Exactly 0 | ink-400 | `#8d93a3` |

**Tooltip accent:** gain-700 (`#04670d`) for non-negative delta, loss-700 (`#850000`) for negative.

**Supporting text:** ink-900 headings, ink-700 body, ink-500 secondary / axis label.

**Grid:** light dashed vertical grid only (no horizontal grid lines).

### Bar labels (outside bar, right of bar end)

| Value | Display |
|-------|---------|
| Positive | `+{one decimal}` e.g. `+16.7` |
| Negative | `{one decimal}` with leading minus e.g. `-4.2` |
| Zero | `0.0` (no plus sign) |

### Y-axis row label (two lines)

1. **Partner name** — ink-900, 12px, end-aligned to the left of the plot area (~136px axis width).
2. **Subtitle** — `{games} game` / `{games} games` — ink-500, 10px.

### Tooltip content

On hover:

- Partner name (bold)
- `{games} match(es) · {competitions} competition(s)`
- `Actual {actualWin%}` with record `({wins}W–{losses}L)` — percents one decimal + `%`
- `Expected {expectedWin%}` (only if rated)
- `{±overperformance} Wins vs Expected` — coloured positive/negative

### Empty states

| Condition | Message |
|-----------|---------|
| No chemistry-eligible matches in filtered set | No doubles matches with a partner in the current selection. |
| Eligible matches but no partner meets threshold | No partners meet the minimum threshold in this selection. |
| Partners meet threshold but none have overperformance (chemistry mode only) | No rated doubles matches to compare against expectation. |

### Partnership rating mode

When **Show** = Partnership rating:

| Aspect | Behaviour |
|--------|-----------|
| **Bar length** | `adjustedPartnershipRating` = average team rating + chemistry in rating points |
| **Team rating** | Mean of `(player rating + partner rating) / 2` across rated matches |
| **Chemistry adjustment** | Win-% overperformance converted to rating points (~0.6% per point near even matchups) |
| **X-axis domain** | Data-driven floor/ceiling rounded to 25-point steps |
| **Chart height** | `max(200px, numberOfBars × 52 + 48)` |
| **Sort** | `adjustedPartnershipRating` desc, then `games` desc |
| **Bar labels** | `{total} ({teamRating}{±chemistryPts})` e.g. **663** *(637+26)* — primary value semibold, parenthetical lighter |
| **Y-axis subtitle** | Match count only (two lines) |
| **Colours** | Green/red/grey from chemistry sign |
| **Partners plotted** | Threshold-met partners with rated matches only |
| **Tooltip** | `You {avg} · Partner {avg} · Chemistry {±%} ({±pts} pts) · Partnership {total}` |

### Section copy (reference)

**Title:** Partner chemistry  

**Description:** Actual win rate with each partner vs what match ratings predicted. Higher scores mean you’re winning games you were expected to lose. (Optional cross-link to a separate “Tournament partners” feature.)

---

## Data shape to compute (client-side)

### Per partner row

| Field | Type | Meaning |
|-------|------|---------|
| `partnerName` | string | Display + group key |
| `games` | number | W + L |
| `competitions` | number | Distinct competitions |
| `wins` | number | — |
| `losses` | number | — |
| `ratedGames` | number | Matches with both team ratings |
| `actualWinPercent` | number | Rounded % |
| `expectedWinPercent` | number \| null | Rounded % or null |
| `overperformance` | number \| null | Rounded delta or null |

### Aggregation result

| Field | Meaning |
|-------|---------|
| `partners` | Visible rows after threshold + sort |
| `hiddenCount` | Below threshold |
| `totalPartnerCount` | All partners before threshold |
| `doublesMatchCount` | Chemistry-eligible match count |

---

## Quick reference (implementation checklist)

```
FILTER matches by time only (defaults: all time, no comp/discipline/partner)

INCLUDE match IF:
  nonCompetitiveReason IS NULL
  AND partnerName IS NOT NULL
  AND outcome IN ('win', 'loss')

FOR each partner:
  actualWin%   = round1(W/G × 100)
  expectedWin% = R > 0 ? round1(E/R × 100) : NULL
  overperformance = expectedWin% != NULL ? round1(actualWin% - expectedWin%) : NULL

SHOW IF count(mode) >= minThreshold
SORT BY overperformance DESC, games DESC
CHART bars WHERE overperformance IS NOT NULL
BAR LENGTH = |overperformance|
X-AXIS MAX = ceil(max(8, max|overperformance|) / 4) × 4
COLOURS: solid green / red / grey (no gradient)
```

---

## Appendix: recap highlights

The tournament recap can surface “chemistry improved this weekend” cards using the **same overperformance math** on a per-event slice. That is **not** part of the dashboard chart prototype unless you explicitly scope it.

High-level rules if you need them later:

- Compare weekend overperformance vs **prior** history with the same partner (outside that `competitionName`).
- Require computable weekend overperformance and non-null prior overperformance.
- “Improved” if no prior baseline and weekend &gt; 0, else weekend &gt; prior.
- Skip unless weekend or **overall** (prior + event) overperformance is positive.
- Sort highlights by weekend overperformance descending.

---

*Prototype spec — describes intended product behaviour for a greenfield front-end build. Data and normalisation are assumed to exist; adjust only if your API differs.*
