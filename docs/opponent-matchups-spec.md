# Nemeses & Favourite Opponents — Front-end build spec

**Audience:** Engineer implementing the **Nemeses & favourite opponents** dashboard block from scratch.  
**Assumption:** Match history is already loaded and normalised into a consistent match model (one row per game). You are not implementing import or persistence.  
**Scope:** Dashboard **Nemeses & favourite opponents** section only — two ranked opponent lists, filters, expandable head-to-head detail, and client-side aggregation. Tournament recap “new nemesis / new scalp” milestones use the same rules but are out of scope unless explicitly requested.

---

## What you are building

A card on the player dashboard with **two side-by-side panels** (stacked on narrow viewports):

| Panel | Question it answers |
|-------|---------------------|
| **Nemeses** | Who do I keep losing to — especially rivals I meet often and who are close to me in rating? |
| **Favourite opponents** | Who do I beat repeatedly when **they** were rated higher than me before the match? |

Each panel is a **ranked list** (not a chart). Rows expand to show every head-to-head meeting in the current filter selection.

---

## Input data contract

Each match row should expose at least the fields below. Your normalisation layer may rename them, but the semantics must match.

### Fields used by this section

| Field | Role |
|-------|------|
| `date` | Time filter; sort expanded H2H newest-first |
| `discipline` | Discipline filter (e.g. WS, WD, XD) |
| `outcome` | `'win'` or `'loss'` only count; `'unknown'` excluded |
| `nonCompetitiveReason` | Must be `null` for the match to count |
| `playerName` | Shown in expanded match rows |
| `partnerName` | Shown in expanded match rows (null in singles) |
| `playerRating` | Our-side rating before the match (or parse from raw `Player Rating`) |
| `competitionName` | Shown in expanded match rows |
| `scoreSummary` | Fallback score text when per-game scores unavailable |
| Opponent 1 / 2 **name** | Grouping key; each named opponent is tracked separately |
| Opponent 1 / 2 **rating** | Upset-win and nemesis-proximity calculations |
| Per-game score columns | Used upstream to derive `outcome` and `scoreSummary` |

### Fields not wired to this section’s filters

Competition level, partner, and competition-age filters exist elsewhere on the dashboard but are **not** exposed here — always “all”.

### Opponent grouping

- Opponents are grouped by **exact string** on each opponent name (trimmed at import). No fuzzy matching or aliases.
- **Doubles / mixed:** If a match lists two opponent names, **each opponent is credited individually** with one win or one loss for that match. Rating comparisons use **that opponent’s individual rating vs the player’s rating**, not a team average.

---

## Match inclusion

A match enters aggregation if **all** of the following hold:

1. **Competitive** — `nonCompetitiveReason == null` (walkovers and “no match” rows excluded upstream).
2. **Decisive result** — `outcome === 'win'` or `outcome === 'loss'`.
3. **At least one opponent name** present on the row.

Retirements with normal played scores may still count unless your import marks them non-competitive.

---

## Step-by-step aggregation

Apply dashboard filters first (see [Controls and filter options](#controls-and-filter-options)), then run the steps below on the filtered set.

### Step 1 — Per-opponent accumulators

For each distinct opponent name, over all qualifying matches where that name appears:

| Accumulator | Rule |
|-------------|------|
| `wins` | +1 if `outcome === 'win'` |
| `losses` | +1 if `outcome === 'loss'` |
| `games` | `wins + losses` |
| `ratedUpsetWins` | +1 on a **win** when both `playerRating` and this opponent’s rating are numbers **and** opponent rating **>** player rating |
| `ratedUpsetGapSum` | On those upset wins, add `(opponentRating − playerRating)` |
| `ratedLossCount` | +1 on a **loss** when both `playerRating` and this opponent’s rating are numbers (regardless of who was higher) |
| `ratedLossGapSum` | On those rated losses, add `abs(opponentRating − playerRating)` |

Unrated matches still count toward wins, losses, and `games`. They do **not** contribute to upset-win or loss-gap accumulators.

### Step 2 — Derived per-opponent fields

```
lossPercent = games > 0 ? round((losses / games) × 100) : 0     // whole number, no decimal

avgRatingGap = ratedUpsetWins > 0
    ? round(ratedUpsetGapSum / ratedUpsetWins)
    : null
    // opponent minus player; positive = they were higher on average across upset wins

avgLossRatingGap = ratedLossCount > 0
    ? round(ratedLossGapSum / ratedLossCount)
    : null
    // mean absolute pre-match rating gap on rated losses (nemesis proximity)
```

### Step 3 — Minimum meetings gate

Every opponent must pass:

```
games >= minMeetings
```

Default `minMeetings = 3`. Range **1–99** (clamp invalid input).

Track `hiddenBelowThresholdCount` = opponents with any H2H data who fail this gate.

---

## Nemeses panel

### Eligibility

An opponent appears in the nemesis candidate pool only if:

```
games >= minMeetings
AND losses > wins        // strictly more losses than wins; ties and winning records excluded
```

### Nemesis score (rating-similarity algorithm)

When there are **fewer than 5** nemesis-eligible opponents, ranking uses a **plain loss score** (no rating adjustment).

When there are **5 or more** nemesis-eligible opponents, apply a **proximity multiplier** so rivals near the player’s rating rank above opponents who crush them by hundreds of points but with a similar loss record.

**Constants:**

- `NEMESIS_PROXIMITY_SCALE = 50` (half the standard 100-point logistic rating scale used elsewhere in the product)

**Formula:**

```
lossRatio = losses / games

baseScore = losses × lossRatio

proximity = (eligible nemesis count >= 5) AND avgLossRatingGap != null
    ? exp(−avgLossRatingGap / NEMESIS_PROXIMITY_SCALE)
    : 1

nemesisScore = baseScore × proximity
```

**Intuition:**

- `baseScore` rewards **many losses** and a **high loss rate** (e.g. 4 losses out of 5 meetings beats 4 losses out of 20).
- `proximity` is between 0 and 1. Smaller average rating gaps on losses → multiplier closer to 1 → rank higher.
- A nemesis who is 150 pts stronger on average gets roughly `exp(−150/50) ≈ 0.05×` the score of an otherwise identical rival at 0 pts gap.
- If the opponent has **no rated losses** (`avgLossRatingGap == null`), proximity stays **1** when the 5-candidate rule is active — they are not penalised for missing rating data.

**Worked example (proximity active):**

- 4 losses, 1 win → `lossRatio = 0.8`, `baseScore = 3.2`
- Average loss rating gap 10 pts → `proximity = exp(−10/50) ≈ 0.82` → `nemesisScore ≈ 2.62`
- Same record but average gap 100 pts → `proximity = exp(−2) ≈ 0.14` → `nemesisScore ≈ 0.44`

### Nemesis sort order

1. `nemesisScore` descending  
2. Tie-break: more `losses` first  
3. Tie-break: higher `lossPercent` first  
4. Tie-break: more `games` first  

### Nemesis row display

| Element | Content |
|---------|---------|
| Rank badge | 1, 2, 3… (position after sort, before “Show top” slice) |
| Name | Opponent name (truncate with full name in tooltip) |
| Subtitle | `{games} meeting(s) · {wins} win(s) · {lossPercent} losses` — loss % in emphasised colour |
| Primary metric (right) | `{losses}` with small label **“losses”** |
| Tooltip on metric | e.g. “3 losses against {name}” |

Colour theme: loss / red semantic tokens.

---

## Favourite opponents panel

“Favourite opponent” here means an opponent the player has **scalped** — beaten multiple times when that opponent was **individually** rated higher than the player before the match.

### Eligibility

```
games >= minMeetings
AND ratedUpsetWins >= minScalpWins
AND avgRatingGap != null
```

Default `minScalpWins = 2`. Range **1–99**. This control sits **inline on the favourite opponents panel header row** (label + number input to the right of the title), not in the shared filter bar.

### Favourite-opponent sort order

1. `avgRatingGap` descending (larger average rating advantage beaten = higher rank)  
2. Tie-break: more `ratedUpsetWins` first  
3. Tie-break: more `games` first  

### Favourite-opponent row display

| Element | Content |
|---------|---------|
| Rank badge | 1, 2, 3… |
| Name | Opponent name |
| Subtitle | `{ratedUpsetWins} win(s) when they were rated higher` · optional `avg {±N} pts` · full H2H record e.g. `3 wins, 1 loss` |
| Primary metric (right) | Formatted average gap, e.g. `+42` with small label **“avg”** — only when `avgRatingGap != null` |
| Tooltip on metric | e.g. “Across 3 wins vs {name}, they were rated 42 pts higher than you on average before the match” |

**Rating gap display format:**

- Positive gap: `+{rounded integer}` (they were higher)  
- Negative: `{rounded integer}` with minus sign  
- Zero: `±0`  

Colour theme: gain / green semantic tokens.

---

## List depth (“Show top”)

After sorting, each panel may show only the first **N** rows.

| Control | Behaviour |
|---------|-----------|
| Default | **5** |
| Fixed options | **5**, **10**, **15** |
| Dynamic option | If either full sorted list has **more than 15** rows, add an **“All”** option equal to `max(nemeses.length, scalps.length)` |

Rank numbers always reflect position in the **full sorted list** (1 = best nemesis / best scalp), even when the row is not visible because of the limit.

---

## Controls and filter options

This section exposes **two shared filters** plus **three section-specific controls**. Reset restores all to defaults.

### Shared filters (collapsible filter panel)

#### 1. Time

Single select. Empty / “All time” means no date restriction.

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

#### 2. Discipline

Single select built from disciplines present in the dataset.

| Value | Label |
|-------|--------|
| *(empty)* | All disciplines |
| `{code}` | Human-readable label for that code (e.g. WD → “Women’s doubles”) |

Include match only when `discipline` equals the selected code.

**Not exposed in this section:** competition level, partner, competition age — those filters do not apply here.

### Section-specific controls

| Control | Default | Range | Applies to |
|---------|---------|-------|------------|
| **Minimum meetings** | 3 | 1–99 | Both panels (shared gate) |
| **Show top** | 5 | 5 / 10 / 15 / All | Rows displayed per panel |
| **Min. wins** | 2 | 1–99 | Favourite opponents panel header only (inline, same row as title) |

### Filter summary line

Under the section title, when the time/discipline filter removes matches:

`Showing {filteredCount} of {totalCount} matches`

Hidden when filtered count equals total (no narrowing).

When opponents fail the meetings gate:

`{N} opponent(s) hidden below {minMeetings} meeting(s)`

---

## Interactions

### Expand / collapse row

Each list row is a **button** that toggles an expanded head-to-head block.

- **Collapsed (default):** summary only  
- **Expanded:** all competitive win/loss meetings vs that opponent in the **current filtered match set**, sorted **newest first**  
- Chevron icon rotates when open; use `aria-expanded` for accessibility  

Expanded list **excludes** walkovers, no-match rows, and unknown outcomes — same rules as aggregation.

### Expanded match row layout

Each meeting shows:

1. **Competition name** and **short date** (e.g. `3 Mar 2026`, en-GB style)  
2. **Discipline chip** (colour-coded by discipline)  
3. **Our side** (right-aligned in doubles): player name + rating; partner name + rating if present (partner name visually distinguished)  
4. **Scores** per game (winning game score bold), or `scoreSummary` / em dash if no game scores  
5. **Their side**: opponent name(s) + rating(s); the head-to-head opponent’s name **bold**  

### Share (optional product feature)

Each panel may offer a share/export action that captures the list as an image. When sharing, cap visible rows at **5** and hide interactive chrome (chevrons, min-wins input). Not required for a functional prototype.

### Info tooltips

**Nemeses:** Opponents you have lost to more than you have beaten, ranked by a score that favours frequent losses and close rating gaps when there are enough rivals. Only competitive wins and losses count.

**Favourite opponents:** Higher-rated opponents you have beaten repeatedly. Minimum wins narrows the list. Only wins where they were individually rated higher than you count.

---

## Empty and edge states

| Condition | What to show |
|-----------|----------------|
| No competitive wins or losses in filtered set | Centred message: **“No competitive wins or losses in the current selection.”** (both panels hidden) |
| Nemesis candidates exist but none pass meetings threshold | Nemeses panel: **“No opponents you are behind on at this threshold.”** |
| No favourite opponents at current min wins | **“No opponents with at least {minScalpWins} rated win(s) when they were higher.”** |
| Panel has rows but list empty after slice | Should not occur if logic is correct |
| Generic fallback | **“None in this selection.”** |

The hidden-opponents footnote (below meetings threshold) only appears when `hiddenBelowThresholdCount > 0` and there is at least one competitive match.

---

## Layout and visual structure

```
┌─────────────────────────────────────────────────────────────┐
│  Nemeses & favourite opponents          [Filters ▾]       │
│  Showing X of Y matches (when narrowed)                     │
├──────────────────────────┬──────────────────────────────────┤
│  NEMESES (info ⓘ) [share]│  FAVOURITE OPPONENTS (info ⓘ) [share]  Min. wins [2] │
│  ① Opponent A    4 losses│  ① Opponent X      +38 avg       │
│  ② Opponent B    3 losses│  ② Opponent Y      +25 avg       │
│  ...                     │  ...                             │
└──────────────────────────┴──────────────────────────────────┘
```

- Section: white card, rounded corners, anchor id for in-page navigation  
- Two columns from large breakpoint up; single column on small screens  
- **Panel headers:** on wide screens, both panel titles share one horizontal row — same height, vertically centred. Nemeses reserves empty space on the right so its title lines up with favourite opponents; min. wins sits inline at the far right of the favourite opponents header (label and input on one line, not stacked).
- Nemeses: loss/red accents; Favourite opponents: gain/green accents  
- Rank: circular badge with number  

---

## Aggregation result shape (client-side)

### Per opponent row

| Field | Type | Meaning |
|-------|------|---------|
| `opponentName` | string | Display + group key |
| `wins` | number | — |
| `losses` | number | — |
| `games` | number | W + L |
| `lossPercent` | number | Whole % of meetings lost |
| `ratedUpsetWins` | number | Wins vs higher-rated opponent |
| `avgRatingGap` | number \| null | Mean rating advantage on upset wins |
| `avgLossRatingGap` | number \| null | Mean absolute gap on rated losses |
| `nemesisScore` | number | Composite rank key (nemeses only) |

### Section result

| Field | Meaning |
|-------|---------|
| `nemeses` | Full sorted nemesis list (before “Show top” slice) |
| `scalps` | Full sorted favourite-opponent list |
| `hiddenBelowThresholdCount` | Opponents with H2H data below `minMeetings` |
| `totalOpponentCount` | All opponents with at least one counted meeting |
| `competitiveMatchCount` | Qualifying matches in filtered set |

---

## Quick reference (implementation checklist)

```
FILTER matches by time + discipline only (defaults: all time, all disciplines)

INCLUDE match IF:
  nonCompetitiveReason IS NULL
  AND outcome IN ('win', 'loss')
  AND at least one opponent name present

FOR each opponent name on each match:
  credit win OR loss to that opponent individually (doubles = two credits)
  on WIN: if opponentRating > playerRating → upset win + gap sum
  on LOSS: if both rated → loss gap sum += abs(opponentRating - playerRating)

GATE: games >= minMeetings (default 3)

NEMESES:
  eligible IF losses > wins
  IF count(eligible) >= 5 AND avgLossRatingGap != null:
    score = losses × (losses/games) × exp(-avgLossRatingGap / 50)
  ELSE:
    score = losses × (losses/games)
  SORT score DESC, losses DESC, lossPercent DESC, games DESC

FAVOURITE OPPONENTS:
  eligible IF ratedUpsetWins >= minScalpWins (default 2) AND avgRatingGap != null
  SORT avgRatingGap DESC, ratedUpsetWins DESC, games DESC

DISPLAY first N rows per panel (default N=5)
EXPAND row → H2H matches vs opponent, newest first
```

---

## Appendix: recap milestones (out of scope unless requested)

The tournament recap can flag when someone **newly enters the top 5** nemesis or favourite-opponent list after a weekend, using the same thresholds and sort rules on prior vs prior+weekend data. Only opponents who appeared in the weekend matches are eligible. Not part of the dashboard section prototype unless explicitly scoped.

---

*Prototype spec — describes intended product behaviour for a greenfield front-end build. Data and normalisation are assumed to exist; adjust only if your API differs.*
