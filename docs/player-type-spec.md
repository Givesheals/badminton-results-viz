# Your player type — Front-end build spec

**Audience:** Engineer implementing the **Your player type** dashboard block from scratch (prototype).  
**Assumption:** Match history data is already loaded and normalised (one row per game). You are not implementing import or persistence.  
**Scope:** This section only — archetype hero, four trait spectrums, explanatory copy, improvement tips, optional all-time vs recent shift banner, and insufficient-data state.

---

## What you are building

A profile card that classifies the player into one of **16 archetypes** (e.g. “The Ice Closer”, “The Wild Card”) from four behavioural axes. Each axis is a spectrum between two labels (e.g. Finisher ↔ Grinder). The player’s position on each spectrum drives a four-letter **player code**, which maps to static archetype content (name, tagline, bullets, tips).

The block answers: *“What kind of competitor am I across finishes, upsets, tight matches, and favourite conversion?”*

**Not included in this section:** competition, discipline, or partner filters. Only a time-range toggle (all time vs last 24 months).

---

## Input data contract

### Fields used

| Field | Role |
|-------|------|
| `date` | Time toggle (24m filter), streak ordering, quarterly volatility |
| `outcome` | `'win'` / `'loss'` for match-level stats; `'unknown'` breaks streaks |
| `nonCompetitiveReason` | Must be `null` for “competitive” matches |
| `discipline` | Singles vs doubles opponent-rating rule (same as elsewhere) |
| `playerRating` | Our-side rating (+ raw `Player Rating` fallback) |
| Partner rating | Raw `Partner Rating` (doubles team average) |
| Opponent ratings | Raw `Opponent 1 Rating`, `Opponent 2 Rating` |
| Per-game scores | `Player Game 1–3 Score`, `Opponent Game 1–3 Score` — game win rates, close-match detection |

### Fields not used in this section

| Field | Note |
|-------|------|
| `partnerName` | Archetype is player-level, not per-partner |
| `competitionName`, `tournamentCategory` | No filters here |
| `Round`, opponent names | — |
| `Score Text` | Only used upstream for walkover / no-match |

### Competitive matches

Same rules as elsewhere: `nonCompetitiveReason == null`. Walkovers and “no match” rows are excluded from profile stats.

---

## Minimum data gate

The archetype name and code are shown only when **both** thresholds are met:

| Threshold | Value | Meaning |
|-----------|-------|---------|
| Competitive matches | **≥ 30** | After non-competitive exclusion |
| Rated matches | **≥ 20** | Both our team and opponent team ratings parse for the match |

Below threshold: show **insufficient data** state with progress toward each minimum (e.g. “12/30 competitive matches”, “8/20 rated matches”). Still compute partial axes internally if useful, but **no archetype name**, `code = null`.

Header subtitle when data exists: `{competitiveCount} competitive matches · {ratedCount} rated`.

---

## Controls

### Time range (only filter)

Segmented control, two options:

| Value | Label | Match set |
|-------|--------|-----------|
| `all` | All time | Full dataset passed into the section |
| `24m` | Last 24 months | Same filter as dashboard “Last 24 months”: match `date` ≥ start of day 24 calendar months before today |

**Always compute two profiles in memory:** all-time and last-24-months. The toggle only changes which profile drives the main UI. The shift banner (below) compares them while the user is on **All time**.

No competition, discipline, or partner controls in this block.

---

## The four axes

Each axis produces:

| Output | Meaning |
|--------|---------|
| `pole` | `'high'` or `'low'` — which end of the spectrum the player leans toward |
| `score` | **0–100** — dot position on the trait bar (see [Trait bar UI](#trait-bar-ui)) |
| `confidence` | `'high'` \| `'medium'` \| `'low'` from sample sizes |
| `sampleCount` | Games or matches behind that axis |
| `detail` | One sentence for the footnote under the bar |

Axis labels (fixed copy):

| Key | High pole | Low pole |
|-----|-----------|----------|
| `F` | Finisher | Grinder |
| `U` | Crusher | Challenger |
| `C` | Clutch | Composed |
| `S` | Reliable | Wildcard |

### Shared rounding

```
roundPercent(x) = round(x × 10) / 10
```

---

## Axis 1 — Finisher vs Grinder (`F`)

Uses **per-game** win rates across all **competitive** matches (not match win %).

For each game 1, 2, 3 with both scores present: count win if player points &gt; opponent points.

```
gameN.win% = roundPercent(wins / played × 100)
```

**Pole**

- **Finisher (high)** if `game3.win% − game1.win% ≥ 8` percentage points  
- **Grinder (low)** otherwise  

**Score (dot position)**

```
gap = game3.win% − game1.win%
score = clamp(0, 100, 50 + gap × 2.5)
```

If either game 1 or game 3 has no playable games: `score = 50`, pole = low, confidence = low, detail = “Not enough game-by-game data yet”.

**Confidence** from `min(game1.played, game3.played)`:

| Count | Confidence |
|-------|------------|
| ≥ 40 | high |
| ≥ 15 | medium |
| else | low |

**Detail examples**

- Finisher: “You win {g3}% of game 3s vs {g1}% of game 1s”  
- Grinder: “You win {g1}% of game 1s vs {g3}% of game 3s”

---

## Axis 2 — Crusher vs Challenger (`U`)

Uses **rated competitive** matches only.

### Underdog match

A match counts as underdog if **either**:

1. Both team ratings exist and `opponentTeam − ourTeam ≥ 25` rating points, **or**  
2. Expected win probability `p < 0.40` (same logistic model as Partner Chemistry: scale 100, our team = player or average with partner).

### Metrics

```
underdogWin% = wins in underdog matches / underdog match count
```

**Pole**

- **Crusher (high)** if `underdog matches ≥ 5` **and** `underdogWin% ≥ 30%`  
- **Challenger (low)** otherwise  

**Score**

```
score = clamp(0, 100, (underdogWin% / 30) × 50)
```

(No underdog matches: score 50, pole low, confidence low.)

**Confidence** from underdog match count:

| Count | Confidence |
|-------|------------|
| ≥ 20 | high |
| ≥ 5 | medium |
| else | low |

---

## Axis 3 — Clutch vs Composed (`C`)

Uses **competitive** matches only.

### Close match

A match is **close** if **either**:

1. **Tight three-gamer:** exactly 3 games played, each game decided by ≤ **3** points margin, **or**  
2. **Deciding third:** 3 games, player won game 1 and lost game 2 (or the reverse) — i.e. 1–1 going into game 3.

### Metrics

```
closeMatchWin% = wins in close matches / close match count
```

**Pole**

- **Clutch (high)** if `close matches ≥ 8` **and** `closeMatchWin% ≥ 55%`  
- **Composed (low)** otherwise  

**Score**

```
score = clamp(0, 100, (closeMatchWin% / 55) × 50)
```

**Confidence** from close match count:

| Count | Confidence |
|-------|------------|
| ≥ 24 | high |
| ≥ 8 | medium |
| else | low |

**Note:** “Composed” in copy also describes calm **2–0 wins when heavily favourite** (`expected win ≥ 65%`, exactly 2 games, both won). That helper exists for tests/narrative but the **axis pole** is driven only by close-match win % as above.

---

## Axis 4 — Reliable vs Wildcard (`S`)

Uses **rated competitive** matches. May also use quarterly win-rate volatility and the underdog win % from axis 2.

### Favourite match

`expected win probability ≥ 0.55`.

### Metrics

```
favouriteWin% = wins in favourite matches / favourite match count
```

**Quarterly volatility** (wildcard signal)

- Bucket competitive win/loss matches by calendar quarter (`YYYY-Q1` … `Q4`).  
- Quarters with fewer than **3** decided matches in that quarter are skipped.  
- Need at least **3** valid quarters.  
- Volatility = standard deviation of those quarterly win % values (rounded to 0.1 pp).

### Pole logic (evaluate in order)

1. **Reliable (high)** if `favouriteWin% ≥ 68%`  
2. **Reliable (high)** if `favouriteWin% ≥ 65%` **and** `underdogWin% ≤ 22%` (stable pattern)  
3. **Wildcard (low)** if `favouriteWin% < 58%` (leaky as favourite)  
4. **Wildcard (low)** if `underdogWin% ≥ 28%` **and** `favouriteWin% < 65%` (chaotic)  
5. **Wildcard (low)** if volatility `≥ 22` pp  
6. Else **Reliable** if `favouriteWin% ≥ 62%`, else **Wildcard**

### Score (0–100, then clamped)

Start from `favouriteWin%`, then adjust:

| Condition | Adjustment |
|-----------|------------|
| Stable pattern (65%+ favourite, ≤22% underdog) | +12 (cap 100) |
| Leaky favourite (&lt;58%) | −25 |
| Chaotic pattern | −20 |
| High volatility | −15 |

**Confidence** from favourite match count: same bands as Finisher (40 / 15).

**Detail** varies by which pattern fired (steady profile, leaky favourite, chaotic, volatile quarter, generic).

---

## Player code and archetype lookup

Combine poles into a **four-letter code**, then look up static content.

| Axis | High pole letter | Low pole letter |
|------|------------------|-----------------|
| F | `F` (Finisher) | `G` (Grinder) |
| U | `C` (Crusher) | `H` (Challenger) |
| C | `L` (Clutch) | `O` (Composed) |
| S | `R` (Reliable) | `W` (Wildcard) |

Example: Finisher + Crusher + Clutch + Reliable → **`FCLR`**.

### Archetype catalogue (16 types)

Each code needs: `name`, `tagline`, `celebration` (fallback hero line), `contextBullets` (3 strings, may include `**bold**` markdown), `improvementTips` (2 strings).

| Code | Name | Tagline |
|------|------|---------|
| FCLR | The Ice Closer | You close out tight matches and rarely slip when you should win. |
| FCLW | The Firecracker | Brilliant in the clutch, with results that can swing from week to week. |
| FCOR | The Executioner | You finish strong, beat up when it counts, and stay calm when ahead. |
| FCOW | The Showstopper | Big moments and big upsets — unpredictable but exciting to watch. |
| FHLR | The Bulldog | You grind out wins you should get and battle hard when it’s close. |
| FHLW | The Rollercoaster | Strong finisher with dramatic highs and lows. |
| FHOR | The Metronome | Dependable when you’re the favourite; you wear opponents down. |
| FHOW | The Spark | Flashes of brilliance without a steady floor — yet. |
| GCLR | The Iron Marathoner | Long battles, giant-killer upsets, and a steady floor. |
| GCLW | The Giant Killer | Classic underdog who thrives when it’s tight. |
| GCOR | The Tactician | Patient grinder who picks off favourites without needing chaos. |
| GCOW | The Maverick | Upsets and chaos without a predictable pattern. |
| GHLR | The Rock | Consistent, composed, wins the matches you’re supposed to. |
| GHLW | The Joker | You can’t script it — form varies wildly. |
| GHOR | The Anchor | Composed, reliable, doesn’t chase highlight-reel upsets. |
| GHOW | The Wild Card | Results swing more than your rating suggests — highs and lows in the same season. |

Context bullets may reference other dashboard areas by name (e.g. Best wins, Results over time); render `**text**` as bold in the UI.

---

## Hero celebration line

Show **`celebrationStat`** when computed; otherwise fall back to archetype `celebration`.

**Priority** (first match wins):

1. Clutch pole **and** `closeMatchWin%` known → “You win {closeMatchWin%}% of close, three-game matches”  
2. Crusher pole **and** `underdogWin%` known → “You win {underdogWin%}% of matches as the underdog”  
3. `longestWinStreak ≥ 5` → “Your longest winning streak is {n} matches”  
4. Reliable pole **and** `favouriteWin%` known — if also `underdogWin% ≤ 22%`: “You win {fav}% as favourite and rarely flip the script as underdog”; else “You win {fav}% of matches when you're the favourite”  
5. Finisher pole **and** game 3 win % known → “You win {g3}% of third games”  
6. Else archetype default `celebration`

---

## Improvement tips

When `code` is set, show **exactly 2** tips:

1. Take the **lowest `score` axis** (weakest trait numerically). Prepend that axis’s template tip (high vs low variant) **unless** it duplicates an archetype tip.  
2. Fill from archetype `improvementTips` in order until you have 2.

Axis tip templates (for step 1):

| Axis | High pole tip (summary) | Low pole tip (summary) |
|------|-------------------------|-------------------------|
| F | Protect third-game edge; manage energy in earlier rounds | Sharpen game-one intensity |
| U | Keep hunting upsets but bank favourites | Target one higher-rated opponent per event |
| C | Stick to one rehearsed clutch pattern | Practise one clutch scenario (e.g. receive at 20–20) |
| S | Protect favourite conversion when tired | Treat favourite matches as must-win |

---

## All-time vs recent shift banner

Compute profiles for **all time** and **last 24 months**. When **both** pass the minimum gate:

- If **codes differ** and the user is viewing **All time**, show a banner:  
  `All-time you're {allTimeName} — in the last 24 months you're reading more like {recentName}.`  
- If codes match, no banner.

Do not show the banner on the “Last 24 months” tab.

---

## Trait bar UI

Each axis is a **spectrum card**, not a proportional bar chart.

### Layout

- Top row: **low label** (left), **high label** (right).  
- Track: full-width rounded pill, neutral background (`ink-100`), ~12px tall.  
- **Centre line:** dashed vertical at **50%** of track width.  
- **Dot:** circle positioned at **`left: {score}%`** (0–100) — **reactive** to computed score; vertically centred on track.  
- **Half highlight:** filled tint on **one half** of the track only — **not** width-scaled to score:  
  - If pole is **high**: tint the **right** half (`left: 50%` → `right: 0`).  
  - If pole is **low**: tint the **left** half (`left: 0` → `right: 50%`).  
- **Balanced band:** if `score` is **46–54**, fade tint to ~40% opacity and caption **“Balanced between both”**; otherwise **“You lean {activeLabel}”** where `activeLabel` is the pole side’s label.  
- Active pole’s end label uses stronger weight/colour; near-centre uses neutral emphasis on both.

### Colours (trait track)

| Element | Token / hex |
|---------|-------------|
| Track background | ink-100 `#ececf2` |
| Half highlight | court-200 at ~70% opacity `#b8dcb9` |
| Dot fill | court-600 `#047e10` |
| Dot ring | court-200 |
| Active labels | court-800 `#034f0a` |
| Inactive labels | ink-500 `#626979` |
| Detail footnote area | ink-50 background, ink-600 text |
| Low confidence note | italic ink-500: “Emerging pattern — more matches will sharpen this” |

There is **no** left-to-right colour gradient on the track — only a neutral track, optional half tint, and a positioned dot.

### Hero card (archetype header)

- Light **background gradient**: court-50 → white (decorative card only, not the trait tracks).  
- Uppercase period label (`All time` / `Last 24 months`), archetype **name** (large), **tagline**, celebration line.  
- **Pills:** one per axis showing the active pole label (Finisher, Crusher, etc.).

---

## Streaks (footer)

Compute from competitive matches sorted by `date`:

- `longestWinStreak`, `longestLossStreak`  
- `currentStreak` + `currentStreakType` from the **last** match only (`win` / `loss` / `none`)

Show footer only if `longestWinStreak ≥ 3`:  
`Longest winning streak: {n} matches` and optionally `Current: {n} wins` if last match was a win and current streak &gt; 0.

---

## Rating model (for axes U, C, S)

Same as Partner Chemistry:

- **Our team:** player rating, or mean(player, partner) when partner rated.  
- **Opponent team:** singles uses opponent 1; doubles averages both when present.  
- **Expected win:** `p = 1 / (1 + 10^(-(our − opp) / 100))`.

A match is **rated** only when both team ratings are available.

---

## Section structure (recommended)

1. **Header** — title “Your player type”, match counts, time toggle.  
2. **Insufficient data** OR:  
3. **Shift banner** (conditional)  
4. **Hero** — archetype name + tagline + celebration + trait pills  
5. **Your four traits** — intro line + four trait bars  
6. **What this means** — bulleted `contextBullets` (bold markdown supported)  
7. **Ways to improve** — grid of 2 tip cards  
8. **Streak line** (optional)

---

## Empty / edge states

| State | Behaviour |
|-------|-----------|
| Below competitive or rated minimum | Insufficient-data card with counts needed; no archetype |
| Sufficient data, axes partially low confidence | Still show archetype; per-axis “Emerging pattern…” when `confidence === 'low'` |
| All-time vs recent different codes | Banner on All time tab only |

---

## Quick reference (implementation checklist)

```
COMPETITIVE = nonCompetitiveReason IS NULL
RATED = both team ratings present

GATE: competitive >= 30 AND rated >= 20 → show archetype

AXIS F: game3% - game1% >= 8pp → Finisher; score = 50 + gap*2.5
AXIS U: underdog (gap>=25 OR p<0.4); >=5 matches & win%>=30 → Crusher
AXIS C: close match (tight 3-gamer OR 1-1→G3); >=8 & win%>=55 → Clutch
AXIS S: favourite p>=0.55; reliable/wildcard rules + volatility

CODE = map poles to F/G, C/H, L/O, R/W → lookup 16 archetypes

TRAIT BAR: dot at score%; half-track tint on lean side; balanced if 46-54
TOGGLE: all | 24m only (no comp/discipline/partner)
TIPS: weakest axis template + archetype tips → max 2
```

---

*Prototype spec — describes intended product behaviour for a greenfield front-end build. Supply the 16 archetype copy objects in your app; the table above is the canonical code → name mapping.*
