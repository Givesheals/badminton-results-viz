# Best Wins — Front-end build spec

**Audience:** Engineer implementing the **Best wins** dashboard block from scratch.  
**Assumption:** Match history is already loaded and normalised into a consistent match model (one row per game). You are not implementing import or persistence.  
**Scope:** Dashboard **Best wins** section only — two ranked match lists, filters, and client-side aggregation. Tournament recap milestones that reuse these sort rules are out of scope unless explicitly requested.

---

## What you are building

A card on the player dashboard that works as a **highlight reel** — the wins the player should feel proud of, framed in two complementary ways:

| Panel | Question it answers | User feeling |
|-------|---------------------|--------------|
| **Strongest beaten** | Who was the **best-rated opposition** I have ever beaten? | Prestige — “I beat someone at that level.” |
| **Biggest upset wins** | When did I win despite the ratings saying I **shouldn’t**? | Drama — “I had only X% chance going in.” |

Each panel is a **ranked list of individual matches** (not aggregated by opponent). The same opponent can appear multiple times if they were beaten in different events. This is intentional: each row is a specific moment, not a head-to-head summary.

The two lists overlap by default on purpose — a win can be both your strongest opponent ever beaten *and* your biggest upset. By default the upset list **skips** matches already shown in the strongest-beaten list so the two panels feel distinct; the user can opt in to overlap.

---

## Input data contract

Each match row should expose at least the fields below. Your normalisation layer may rename them, but the semantics must match.

### Fields used by this section

| Field | Role |
|-------|------|
| `date` | Sort tie-break; shown in row meta |
| `discipline` | Discipline filter; team-rating rules |
| `outcome` | Must be `'win'` to count |
| `nonCompetitiveReason` | Must be `null` for the match to count |
| `playerRating` | Our-side rating before the match |
| Partner rating | From partner field; used for our team average in doubles |
| Opponent 1 / 2 **rating** | Opponent team strength |
| Opponent name(s) | Primary row label |
| `partnerName` | Shown in doubles rows (`with {partner}`) |
| `competitionName` | Row identity + tooltip |
| `scoreSummary` | Shown in row meta; also used for non-score-finish detection |
| Per-game score columns | At least one complete game pair required |
| Tournament category label | Optional chip in row meta |
| Competition age label | Optional text in row meta (e.g. Senior, U17) |
| Round / stage | Optional text in row meta (e.g. Quarter-final) |

### Fields not wired to this section’s filters

Time period, competition level, partner, and competition-age filters exist elsewhere on the dashboard but are **not** exposed here — always “all”.

---

## Match inclusion

A match enters aggregation if **all** of the following hold:

1. **Competitive** — `nonCompetitiveReason == null` (walkovers and “no match” rows excluded upstream).
2. **Decisive win** — `outcome === 'win'`.
3. **Played scores** — at least one game where both our-side and opponent-side scores are present (not null).
4. **No non-score finish** — score summary and opponent text must not indicate walkover, no-match, or retirement (even if numeric scores exist in the sheet).

Losses, draws, and unknown outcomes never appear.

### Rated vs unrated

After the above gates, a win must have **both** our team rating and opponent team rating computable (see [Team ratings](#team-ratings)). Wins that pass eligibility but lack ratings are **silently excluded** from both lists. They do not appear as rows and are not called out in the UI.

---

## Team ratings

All displayed ratings are **whole numbers** (rounded).

### Our team rating

- **Singles:** player rating.
- **Doubles / mixed:** average of player rating and partner rating when partner rating exists; otherwise player rating alone.

If player rating is missing → match is unrated and excluded.

### Opponent team rating

- **Singles:** opponent 1 rating.
- **Doubles / mixed:** average of opponent 1 and opponent 2 when both exist; if only one exists, use that one; if neither → unrated, excluded.

### Derived fields (per eligible rated win)

```
ratingGap = opponentTeamRating − ourTeamRating
```

- **Positive gap** → we were the underdog (opponent rated higher).
- **Negative gap** → we were the favourite.
- **Zero** → evenly rated.

---

## Pre-match win chance (Biggest upset wins metric)

Use the **official rating-difference → win chance table** (not the logistic model used elsewhere in the product).

### Rules

- **Favorite** = higher-rated side before the match (by team average in doubles).
- Look up the favorite’s win chance from the table using **absolute** rating difference (whole points).
- **Our pre-match win chance** = `100 − favoriteWinChance` when we were the underdog; otherwise the favorite’s chance applies to us.
- **Above table max (75 pts):** extrapolate linearly at +0.3% per point until favorite chance reaches **99%**, then flatline.
- **Display:** clamp to **1%–99%** (never show 0% or 100%); show as a **whole-number percent** with the label **“win chance”**.

Example: opponent team 72 pts higher → favorite ~83.7% → our chance ~16.3% → display **16% win chance**.

The full lookup table lives in product docs (`docs/rating-win-chance-table.md`); reproduce that table in your implementation.

---

## Step-by-step aggregation

Apply dashboard filters first (see [Controls and filter options](#controls-and-filter-options)), then:

### Step 1 — Build rated win rows

For each match passing [Match inclusion](#match-inclusion):

1. Compute our team rating and opponent team rating.
2. If either is null → count as unrated (skip).
3. Otherwise build a row with: match reference, both team ratings, `ratingGap`, and `preMatchWinChancePercent`.

### Step 2 — Sort two full lists

**Strongest beaten** — sort all rated wins by:

1. `opponentTeamRating` **descending** (highest-rated opposition first).
2. Tie-break: `date` **descending** (newer first).

**Biggest upset wins (raw)** — sort all rated wins by:

1. `ratingGap` **descending** (largest underdog gap first; favourite wins sink to the bottom).
2. Tie-break: `date` **descending**.

There is **no minimum rating gap** for dashboard rows. Wins where we were favourite can appear at the bottom of the upset list if needed to fill the display limit.

### Step 3 — Apply overlap rule for upset display

When **overlap is off** (default):

1. Take the top `limit` rows from strongest beaten.
2. Walk the raw upset-sorted list in order; **skip** any match already in that strongest-beaten top `limit`.
3. Take the first `limit` non-skipped rows for the upset panel.

When **overlap is on**: upset panel = first `limit` rows of the raw upset-sorted list (no skipping).

**Match identity for deduplication:** same competition name + date + discipline + opponent name string.

### Step 4 — Slice for display

Each panel shows at most **`limit`** rows (default 5). Fewer rows appear when the filtered set has fewer qualifying wins — no padding or placeholders.

---

## Minimums and low-data behaviour

| Concept | Rule |
|---------|------|
| Minimum meetings | **None** — a single rated win can appear. |
| Minimum upset gap | **None** on the dashboard. |
| Minimum wins per opponent | **None** — lists are per-match. |
| Show top limit | Default **5**; user can raise to 10, 20, or All (see filters). |

### Empty and edge states

| Condition | What to show |
|-----------|----------------|
| No rated wins in filtered set | Single message: **“No rated wins in this selection.”** Hide both panels. |
| Has rated wins but fewer than `limit` | Show all available rows; no footnote. |
| Strongest beaten has rows; upset panel empty after dedup | Upset panel **title and info icon still show**; list area is empty (no message). Can happen when every top upset is already in strongest beaten. |
| Unrated wins only | Same as zero rated wins — user sees the empty message even if unrated wins exist. |

There is no “hidden below threshold” footnote (unlike Nemeses / Favourite opponents).

---

## Ordering summary

| Panel | Primary sort | Tie-break |
|-------|--------------|-----------|
| Strongest beaten | Opponent team rating ↓ | Date ↓ |
| Biggest upset wins | Rating gap (opp − us) ↓ | Date ↓ |

List order implies rank (1st row = #1) but **rank badges are not required** — position in the ordered list is sufficient.

---

## Controls and filter options

Collapsible filter panel with reset to defaults. Under the section title, when discipline filter narrows the set:

`Showing {filteredCount} of {totalCount} matches`

Hidden when counts are equal.

**Not exposed:** time period, competition level, partner, competition age.

### 1. Discipline

Single select by **discipline family**:

| Value | Includes |
|-------|----------|
| All disciplines | Everything |
| Singles | MS, WS, OS (and equivalents) |
| Doubles | MD, WD, OD |
| Mixed | XD |

Unknown discipline codes are excluded when a family filter is active.

### 2. Show top

| Value | Label |
|-------|--------|
| 5 | 5 (default) |
| 10 | 10 |
| 20 | 20 |
| *dynamic* | **All** — only when total rated wins **> 20**; value = total rated win count |

Applies to **both panels equally**.

### 3. Overlap checkbox

| State | Label | Behaviour |
|-------|-------|-----------|
| **Off (default)** | *(checkbox unchecked)* — copy reads **“Biggest upset wins: Allow overlap with Strongest beaten”** | Upset list skips matches in strongest-beaten top N |
| **On** | Same label; checkbox checked | Same match may appear in both lists |

Reset restores: discipline = all, show top = 5, overlap = off.

---

## UI layout and row content

```
┌─────────────────────────────────────────────────────────────┐
│  Best wins                              [Filters ▾]         │
│  Showing X of Y matches (when narrowed)                     │
├──────────────────────────┬──────────────────────────────────┤
│  STRONGEST BEATEN (ⓘ)    │  BIGGEST UPSET WINS (ⓘ)          │
│  Opponent name      720  │  Opponent name        16%        │
│  with Partner              │                        win chance│
│  Bronze · QF · 3 Mar · 21-15, 21-12                        │
│  ...                     │  ...                             │
└──────────────────────────┴──────────────────────────────────┘
```

- Section: white card, rounded corners, anchor id for in-page navigation.
- Two columns from large breakpoint up; stacked on narrow viewports.
- Each row: discipline-coloured left border and soft background tint.

### Row elements

| Element | Content |
|---------|---------|
| Discipline chip | Code (e.g. WS, XD); colour by family |
| Primary line | Opponent name(s); truncate on wide screens, wrap on narrow |
| Partner line | `with {partner}` — doubles/mixed only |
| Meta line | Tournament category chip (if any) · competition age · stage · short date (en-GB, e.g. `3 Mar 2026`) · score summary |
| **Strongest beaten metric** | Opponent team rating (integer). Tooltip: “Average opponent team rating” |
| **Biggest upset metric** | Whole-number **win chance %** + small label “win chance”. Tooltip explains gap, e.g. “~16% win chance before the match — they were rated 72 pts higher on average” (adjust wording when user was favourite or evenly rated) |

Rows are **not expandable** — all context fits in the row.

---

## Info tooltips (ⓘ)

### Strongest beaten

- Your rated wins ranked by opponent strength — the average of opponent ratings in doubles.
- Walkovers, retirements, no-match rows, and wins without played game scores are excluded.
- Unrated wins do not appear here.

### Biggest upset wins

- Wins where you were the underdog — ranked by how much higher-rated the opposition was, with your pre-match win chance from the official rating-difference table.
- **When overlap is off:** “Matches already in your top {N} strongest beaten are skipped so the two lists do not repeat the same match.” (`{N}` = current Show top value.)
- **When overlap is on:** “Matches can appear in both lists, including those already shown in your strongest beaten highlights.”
- Same exclusions as strongest beaten: no walkovers, retirements, or unrated wins without played scores.

---

## Quick reference (implementation checklist)

```
FILTER matches by discipline family only (default: all)

INCLUDE match IF:
  nonCompetitiveReason IS NULL
  AND outcome === 'win'
  AND at least one played game score pair exists
  AND NOT walkover / no-match / retired text

BUILD row IF both team ratings computable:
  ourTeam = singles: playerRating
            doubles: avg(player, partner) or player if no partner rating
  oppTeam = singles: opp1Rating
            doubles: avg(opp1, opp2) or single available rating
  ratingGap = oppTeam − ourTeam
  winChance = lookup from official table (abs gap), underdog side

SORT strength: oppTeamRating DESC, date DESC
SORT upset:    ratingGap DESC, date DESC

UPSET DISPLAY (default):
  skip matches in top-N of strength list, then take N
UPSET DISPLAY (overlap on):
  first N of upset sort

EMPTY: no rated wins → "No rated wins in this selection."
SHOW ≤ N rows per panel; no minimum count required
```

---

## Appendix: recap milestones (out of scope unless requested)

The tournament recap can flag when a recent win **newly enters the all-time top 5** on either list, using the same sort and overlap rules on prior vs prior+weekend data. A separate “big upset” recap threshold (opponent ≥ 30 pts higher) exists for narrative copy — it does **not** apply to the dashboard lists.

---

*Prototype spec — describes intended product behaviour for a greenfield front-end build. Data and normalisation are assumed to exist; adjust only if your API differs.*
