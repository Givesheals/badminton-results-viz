# Engineering ticket: All-time summary card

**Assignee:** Chris  
**Tab:** Player summary (“My career in numbers — and how I play”)  
**Position:** First card on the tab  

---

## Overview

The **All-time summary** card is the headline career snapshot. It answers: *How much have I played, how well am I doing overall, and where have I been competing (by tournament level and age)?*

It has three layers:

1. **Collapsible filters** (excluded from share image)
2. **Four headline stats** (always visible in the share image)
3. **“Matches by level & age” pie chart** (always visible in the share image)

All stats and the pie use **competitive matches only** — walkovers and “no match” rows are excluded.

---

## Card layout & styling

### Container

- Rounded card (`rounded-2xl`), **1.5px border** in `#d0d2dc`
- Outer background: `#f8f8fb` at ~80% opacity, light shadow
- Header area: white background, bottom border `#ececf2`, padding ~16–20px
- Shareable content area: white background (stats + pie only)

### Header row

| Element | Position | Notes |
|--------|----------|-------|
| Title | Left | **“All-time summary”**, medium weight, `#141926` |
| Share button | Top-right | Icon button, brand purple `#41016f`; disabled when filtered match count is 0 |
| Match count line | Below title | Only when filters are active — see Filters section |
| Filters | Full width below | Collapsible panel |

### Stats grid

- **Mobile:** 2×2 grid with dividers
- **Desktop (≥640px):** 1×4 row
- Cell dividers: `#ececf2`
- Label: 12px, medium, `#626979`
- Value: 20px mobile / 24px desktop, semibold, `#141926`, tabular numerals
- Detail line (where applicable): 12px, `#626979`

### Pie section

- Separated from stats by top border `#ececf2`
- Subheading: **“Matches by level & age”**, 14px medium, `#343a48`
- Padding ~16–20px

---

## Headline statistics

All four metrics respect the active filters.

| Metric | Display | Detail line (when shown) |
|--------|---------|--------------------------|
| **Matches played** | Integer count | — |
| **Games played** | Integer count | — |
| **Matches won** | Win % to **1 decimal** (e.g. `62.5%`), or **—** if no decided matches | `(X wins)` when there is at least one win or loss |
| **Points won** | Points win % to **1 decimal**, or **—** if no points recorded | `(player points / total points)` when total points > 0 |

**Formatting:** Counts use en-GB locale (e.g. `1,234`). Percentages always show one decimal place.

**Decided matches** = wins + losses (excludes walkovers/no-match).

---

## Filters

Three filters only on this card: **Time**, **Competition**, **Competition age**.  
(Discipline and partner filters exist elsewhere on the dashboard but **not** here.)

### Filter UI

- **Collapsed by default** — compact card header
- Toggle label: **“Filters”**, or **“Filters (N)”** when N filters are active
- **Reset** link appears when any filter is active; restores all defaults
- Open/closed state persists for the session
- Filters are **excluded from the share image**

### Filter summary line

When the filtered match count is **less than** the player’s total match count:

> Showing **{filtered}** of **{total}** matches

Hidden when showing all matches (filtered = total).

---

### Time

| Option | Behaviour |
|--------|-----------|
| **All time** (default) | No date restriction |
| **Last 24 months** | Matches on or after today minus 24 calendar months |
| **Last 12 months** | Same, 12 months |
| **Last 6 months** | Same, 6 months |
| **Last 3 months** | Same, 3 months |
| **{Year}** (one per calendar year in the player’s data) | Matches in that calendar year only; years listed **newest first** |

Only time periods that could return matches need appear; in practice, build the year list from years present in the dataset.

---

### Competition

| Option | Behaviour |
|--------|-----------|
| **All competitions** (default) | No restriction |
| One option per distinct **tournament category** in the player’s data | Exact match on category value; labels sorted alphabetically |

**Tournament category labels** (from the data):

- Standard levels: **Copper**, **Bronze**, **Silver**, **Gold** (title-cased from raw values)
- Missing/NA category → label **County**

---

### Competition age

| Option | Behaviour |
|--------|-----------|
| **All ages** (default) | No restriction |
| One option per age value present in the player’s data | Matches where **either** the top-level age group **or** the sub-age group equals the selected value |

**Option ordering:**

1. Top-level groups first: **Junior**, **Senior**, **Masters**, **Other** (in that priority order)
2. Then sub-age values (e.g. **U13**, **U15**, **U17**, **O40**) sorted by age, excluding duplicates already covered by top-level entries

Options are **data-driven** — only ages the player has actually competed in appear.

---

## Empty & low-data behaviour

### Zero matches after filtering

| Area | Behaviour |
|------|-----------|
| Stats | Counts show **0**; percentages show **—**; no detail lines |
| Pie chart | Centred message: **“No match data for level and age in this selection.”** (~192px tall area) |
| Share button | **Disabled** |
| Filter summary | Still shows “Showing 0 of {total} matches” if filters are active |

### Partial / sparse data

- Stats always render with whatever the filtered set contains (e.g. 3 matches still shows real percentages).
- Pie needs at least one competitive match with a level/age combination; otherwise same empty state as above.
- A single pie slice renders with **no** padding gap between segments.

---

## Pie chart: “Matches by level & age”

### Important note on implementation

Our prototype pie is **illustrative only**. We used a library that could not reliably draw **external label lines/callouts** on crowded pies. Please choose chart technology that supports **proper labelled slices with connector lines** — that is a requirement for production.

Layout guidance from the prototype (adapt as needed for the chosen library):

- Pie on the **left**, labels/legend on the **right**
- On narrow viewports (<400px), give the label area **more horizontal space** (~50% vs ~48%) so text stays readable
- Chart height: **280px** desktop, **232px** on very narrow (<360px)
- Max pie radius: **96px**; minimum **44px** after responsive scaling
- **1° padding** between slices when there are 2+ slices
- **2px white stroke** between slices

### What each slice represents

Each slice counts **competitive matches** grouped by the combination of:

- **Tournament level** (Copper / Bronze / Silver / Gold / County)
- **Competition age** (sub-age if present, otherwise top-level age group)

**Default slice label format:** `{age} {level}` — e.g. `U15 Bronze`, `Senior Gold`  
If no age is recorded: level only — e.g. `Gold`

**Percentage:** `round(matches / total × 1000) / 10` → one decimal place  
**Sort order:** Match count descending, then label A–Z

### Maximum slices: 8

If unique level×age combinations exceed **8**, dynamically **merge** slices until ≤ 8. When any merging has occurred, show a footnote above the chart:

> Earlier age groups are combined to keep the chart readable.

### Grouping algorithm

Start at the **finest granularity** — one slice per unique `(tournament level × competition age)` pair. Then repeatedly apply the **single best merge** until ≤ 8 slices or no merge is possible.

#### Broad age bands

Each match’s age maps to a broad band for grouping decisions:

| Broad band | Rule |
|------------|------|
| **Juniors** | Sub-age matches `U##`, or age group = Junior |
| **Seniors** | Age group or label = Senior |
| **Masters** | Sub-age matches `O##`, or age group = Masters |
| **Other** | Everything else |

Broad band labels when used: **Juniors**, **Seniors**, **Masters**, **Other**

#### Protected ages

Within each broad band, identify the age label with the **most recent match date**. That label is **protected** — grouping should avoid collapsing it until all other options are exhausted. This keeps the player’s **current** age band visible as a distinct slice for as long as possible.

#### Merge types (finest → coarsest)

When choosing which merge to apply, prefer merges involving **older/stale** data (earliest `lastMatchDate` among affected slices). Tie-breakers: merge that removes **more** slices, then prefer the **finer-grained** merge type.

| Priority | Merge type | What gets combined | Resulting label |
|----------|------------|-------------------|-----------------|
| 1 | **Same age, all levels** | All slices sharing one age label across tournament levels | Age label alone, e.g. `U15` |
| 2 | **Consecutive stale ages** | Within one broad band, consecutive **non-protected** age labels (runs of 2+) | Range, e.g. `U13–U15` |
| 3 | **Same broad band + level** | All ages within one broad band at one tournament level | e.g. `Juniors Bronze` |
| 4 | **Same broad band** | All slices in one broad band regardless of level | e.g. `Juniors` |

If no merge is possible without touching protected ages, **allow protected-age merges** as a last resort.

#### Tooltip / detail for grouped slices

When a slice is grouped (not a single level×age pair), the tooltip/hover should show:

- Slice label
- `{count} matches ({percent}%)`
- **“Includes {label1}, {label2}, …”** — comma-separated list of the original fine-grained labels that were merged in

### Slice colours (in order, up to 8)

| # | Hex | Description |
|---|-----|-------------|
| 1 | `#41016f` | Brand purple |
| 2 | `#047e10` | Court green |
| 3 | `#159eda` | Blue |
| 4 | `#a16207` | Amber |
| 5 | `#64748b` | Slate |
| 6 | `#0f766e` | Teal |
| 7 | `#c2410c` | Orange |
| 8 | `#6d28d9` | Violet |

Legend: vertical list on the right; each entry has a **10px coloured circle** with a light ring, plus the slice label in 12px `#343a48`.

---

## Share

- **Share icon** in the card header (top-right)
- Captures **stats + pie only** — not filters, not the share button itself
- Suggested filename: `badminton-all-time-summary.png`
- **Mobile:** native share sheet with PNG where supported
- **Desktop:** download the PNG
- Disabled when there are zero matches in the current filter selection
- Brief feedback states: “Saving…”, “Shared!”, “Saved!”, “Failed”

---

## Product intent (explicitly discussed)

These are the goals we had in mind — not new requirements to invent around:

1. **Career snapshot.** This card sits on the “Player summary” tab whose subtitle is *“My career in numbers — and how I play.”* It is the first thing a player sees when looking at their long-term record.

2. **Steady baseline vs volatility.** In player-type copy we explicitly reference this card alongside “Results over time”:
   - For steady, dependable players, All-time summary should feel **reassuringly consistent**
   - For more volatile players, All-time win % may **wobble** even when individual highlights look great
   - For some players, All-time summary and Results over time may **tell different stories** — that contrast is intentional and useful

3. **Where they compete.** The pie answers *where in the badminton pyramid have I actually played?* — the mix of levels (Copper through County) and age groups over a career. Grouping exists so a long career with many age transitions doesn’t produce an unreadable chart; the footnote makes that explicit.

4. **Current age stays visible.** Protected-age logic reflects the intent that a player’s **present** age band shouldn’t disappear into “U11–U15” while older, stale bands get merged away.

5. **Shareable pride moment.** Share produces a clean, social-ready image of headline stats (no filter chrome) for WhatsApp, Instagram, etc.

6. **Pie labels are a known gap.** We accept that our prototype legend-only pie is not good enough; **label lines/callouts** are an explicit ask for production.

---

## Acceptance criteria (summary)

- [ ] Card renders as first item on Player summary tab with title, share, collapsible filters, stats, and pie
- [ ] Three filters (Time, Competition, Competition age) behave as specified; filter summary line when filtered < total
- [ ] Four stats correct for filtered competitive matches; empty states use 0 and —
- [ ] Pie groups to max 8 slices using the merge rules; protected current age; footnote when grouped
- [ ] Grouped-slice tooltips list included fine-grained labels
- [ ] Pie uses label lines/callouts (not prototype legend-only approach)
- [ ] Colours, sizing, and typography match spec above
- [ ] Share captures stats + pie only; disabled at zero matches
