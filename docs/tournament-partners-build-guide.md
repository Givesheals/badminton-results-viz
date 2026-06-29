# Tournament partners — Build guide

**Product:** Badminton Results Viz  
**Audience:** Engineer implementing this section from scratch (no dependency on the prototype codebase)  
**Last verified against prototype:** June 2026  

**Companion docs (internal prototype):** [partner-highlights-spec.md](partner-highlights-spec.md) (ranking rules), [tournament-progression-spec.md](tournament-progression-spec.md) (how far someone progressed in an event).

---

## 1. Purpose

Tournament partners answers: *“With each partner, how far do we usually get in graded progression events?”*

It is **not** about win rate vs rating expectation (that is a separate Partner chemistry feature). Here, partners are ranked by **how many progression events you share** and **how deep you typically run** together. County events are out of scope.

**Design intent:** Celebrate long-term partnerships and deep runs; surface full tournament history on demand without changing filters when browsing.

---

## 2. Section shell

### Header

- Title: **Tournament partners** (`font-medium`, ink-900)
- **Information button** (popover) beside the title. Accessible label: **About Tournament partners**. Body copy:

  > How far you go together with each partner in tournaments, ranked by event volume and how deep you usually run.
  >
  > County events and events without knockout or group rounds in the data are not included. Walkovers can count toward how far you went if you were awarded the win.

- Outer card: white background, rounded corners, light border (`#d0d2dc`), subtle shadow, padding.

### Layout

Two blocks, **always stacked vertically** (never side-by-side, even on wide screens):

1. **Doubles** — men’s, women’s, and open doubles (discipline codes MD, WD, OD)
2. **Mixed** — mixed doubles (XD)

Singles are excluded entirely.

Each block is an independently filtered sub-section with its own partner list.

---

## 3. Visual system

### Typography

- System sans stack: Segoe UI, Helvetica Neue, Arial, system-ui
- Body: ink-900 on white; secondary/meta: ink-500/600 at `text-xs` or `text-sm`
- Partner names and tournament titles: `font-medium`

### Brand palette (purple)

| Token | Hex | Use |
|-------|-----|-----|
| brand-50 | `#f6effb` | Hover fills |
| brand-200 | `#d6bbf0` | Borders, chevrons |
| brand-500 | `#7030a5` | Primary accent |
| brand-600 | `#41016f` | Deep accent, winner stage |
| brand-700 | `#35015b` | Links, Show more button text |

### Discipline families

| Family | Accent | Soft background | Left border |
|--------|--------|-----------------|-------------|
| Doubles | `#a0acda` | `#f8f9fd` | 4px doubles accent |
| Mixed | `#7acfd2` | `#f7fcfc` | 4px mixed accent |

Each family block: rounded container, soft family background, coloured left border. Family title appears as a small pill chip (white text on family accent).

### Progression stage colours (chips)

Deepest stages use stronger brand purple; group stages use grey (group labels are light — use ink-500 `#626979` for those chip backgrounds so white text reads clearly):

| Stage | Label | Colour |
|-------|-------|--------|
| Winner | Winner | `#41016f` |
| Runner-up | Final | `#7030a5` |
| Semi-final | Semi-final | `#9c63d0` |
| Quarter-final | Quarter-final | `#bf97e5` |
| Knockout | Knockout | `#d6bbf0` |
| Group match wins | Group match wins | `#626979` |
| Group stages | Group stages | `#626979` |

Chip format: **`{count}× {stage label}`** (e.g. `1× Winner`, `11× Group match wins`). Show only stages with count &gt; 0, **deepest first**.

### Outcomes

- Win: gain green `#04670d`
- Loss: loss red `#850000`

### Chevrons

- Brand purple `#7030a5`, 20×20px on partner and tournament headers
- Centre-right of the row, vertically centred against the full card height
- Rotates 180° when expanded

---

## 4. What counts as data

### Partner eligibility

A partner appears in the list (and partner filter) only with **≥1 qualifying event** under the current filters.

| Rule | Detail |
|------|--------|
| Disciplines | Doubles (MD/WD/OD) or Mixed (XD); must have a partner name |
| Event identity | One event = same **competition name + discipline code** |
| County | Excluded — drop any event with a county-category match |
| Progression | Event must include at least one match whose round parses to a group or knockout stage |
| Depth per event | Best stage reached in that event, using progression rules (walkover wins can count when awarded the win) |

No minimum event count to appear — low-signal partners sort lower and sit behind **Show more**.

### Progression stage ladder (depth rank 1–7)

| Rank | Stage | Display label |
|------|-------|---------------|
| 1 | Group stages | Group stages |
| 2 | Group match wins | Group match wins |
| 3 | Knockout | Knockout |
| 4 | Quarter-final | Quarter-final |
| 5 | Semi-final | Semi-final |
| 6 | Runner-up | Final |
| 7 | Winner | Winner |

---

## 5. Partner ranking

For each eligible partner, compute:

| Metric | Meaning |
|--------|---------|
| `eventCount` | Qualifying progression events together |
| `maxStageRank` | Best depth in any single event (1–7) |
| `typicalRank` | Median of per-event best depths |
| `stageCounts` | How many events ended at each stage |
| `podiumCount` | Events ending Winner + Final (runner-up) |

### Highlight score

```text
depthScore = 0.35 × maxStageRank + 0.65 × (typicalRank ?? 1)

highlightScore = round to 2dp( ln(1 + eventCount) × (1 + depthScore / 7) )
```

**Intention:** Volume (`ln(1 + events)`) keeps long-term partners competitive without letting huge counts dominate. Depth (typical weighted more than peak) lets deep partnerships outrank shallow ones with similar volume.

**Sort descending by:**

1. `highlightScore`
2. `podiumCount`
3. `eventCount`
4. Partner name (locale alphabetical)

---

## 6. Filters

Each family block (Doubles / Mixed) has **independent** filter state. Filters sit in a collapsible **Filters** panel (2×2 grid); show active count in the toggle label; **Reset** clears all four.

| Filter | Default display | Options source | Effect |
|--------|-----------------|----------------|--------|
| **Time** | All time | Last 24/12/6/3 months + each calendar year in the dataset | Restricts matches before aggregation |
| **Competition** | All competitions | Competition categories present in that family after **time** filter only | Further restricts matches |
| **Partner** | All partners | Partners in the **current scored list** (after time, competition, age — before partner filter) | Narrows **visible cards** only; does not re-rank others |
| **Competition age** | All ages | Age groups/sub-groups present in the full dataset | Restricts matches |

**Interaction rules:**

- All filters apply to match data **before** partner scores are computed; changing any filter recomputes ranking and clears expanded accordion state.
- **Partner filter ≠ card click.** Clicking a card toggles its accordion only; it never sets the partner filter.
- If a selected partner or competition is no longer valid after a filter change, clear that selection automatically.
- When **partner filter** is set but that partner has no data in the current time/competition/age selection:
  - If they have data **all time** (same other filters): show “No {doubles\|mixed} data in this period” with suggestion to try All time.
  - Otherwise: “No {doubles\|mixed} progression data with {name} in your results.”
- When a new dataset is loaded, reset all filters to defaults.

---

## 7. Partner cards

### Visibility

- Show **2** partners initially per family block
- **Show more:** +3 per click until all are visible
- When partner filter is active: show matching partner(s) only; hide Show more
- Footer when fully expanded: “Showing all {N} {doubles\|mixed} partners” (small ink-500 text)

### Grid

- Up to **2 cards per row** on sm+ breakpoints; single column on very narrow screens
- **`items-start` alignment:** a collapsed card keeps its natural height — it must **not** stretch to match an expanded neighbour. The next row starts below the tallest card in the row above; nothing flows into the gap beside a short card.

### Card header (accordion trigger)

- Left: partner name + `{N} event(s) together` (meta, right-aligned on same row)
- Right: chevron (centre-right of full card)
- Below: stage chips (deepest first) or “No classified finishes in this selection.”
- Whole header clickable; hover: light brand tint
- Default **collapsed**

---

## 8. Accordion hierarchy

Five nested levels:

```text
Family block (Doubles / Mixed)
  Partner card
    Stage group (e.g. Semi-final · 2 events)
      Tournament (competition name · N matches · date)
        Match row
```

Each level toggles independently — **multiple partners, stages, and tournaments may be open at once.**

### Auto-expand when a partner card opens

Apply once when the history panel opens (not on manual re-toggle of inner levels):

| Total events with partner | Stage groups | Auto-open |
|---------------------------|--------------|-----------|
| 1 | 1 | Stage **and** tournament (matches visible) |
| 2+ | 1 | Stage only; tournaments stay collapsed |
| 2+ | 2+ | Nothing below partner level |

### Stage group row

- Pill with stage colour + “`{label}` · `{N} event(s)`”
- Chevron right
- When expanded: list of tournament rows
- If &gt;8 tournaments in one stage: show first 8, then “Show {N} more in {stage}” link

### Tournament row

- Title: competition name (no underline)
- Meta line: `{N} matches · {date}` (en-GB, e.g. `15 Feb 2025`)
- Chevron centre-right
- Expanded: match list on light background

### History sort order

- Stage groups: **deepest stage first**
- Tournaments within a stage: **newest date first**
- Matches within a tournament: deepest round first, then newest date

---

## 9. Match rows (compact layout)

Rows sit three accordion levels deep — **deliberately simpler than standard match cards elsewhere in the product.**

| Shown | Notes |
|-------|-------|
| Round label | Italic, small, when parseable (e.g. *Semi-final*, *Group*) |
| Opponents | `vs {names}` — **wrap fully, no ellipsis** |
| Outcome + score | One line below: `Win · 21-13, 21-12` or `Loss · …` or `Walkover` |

| Omitted | Why |
|---------|-----|
| Player / partner names | Fixed at partner card level |
| Discipline chip / left border | Fixed at family block level |
| Score in a right column | No horizontal room; no “our team” column to align against |
| Ratings | Space; focus is progression depth here |

Keep soft **family background shading** on each match row.

---

## 10. Empty states

| Condition | Copy |
|-----------|------|
| No partners in either family (and no partner filter active) | “No doubles or mixed matches with a partner in the current selection.” |
| Family block has no progression partners | “No progression tournaments with a partner in this category yet.” |
| Partner filter, no data in period (but all-time exists) | See §6 |
| Partner filter, no data ever | See §6 |
| Expanded partner, no progression events in selection | “No tournament progression events with {name} in this selection.” |

---

## 11. Accessibility

- Partner / tournament headers: `aria-expanded`, `aria-controls` linking to panel id
- Partner card toggle label: “Show/Hide tournament history for {name}”
- Information popover: labelled trigger, keyboard-dismissible
- Focus rings on interactive elements (brand-tinted)

---

## 12. Out of scope for this guide

- **Share / export** — separate feature
- Partner chemistry section
- Progression rule edge cases — see tournament progression spec for full depth algorithm (round-robin winners, bronze paths, etc.)

---

*Update when UX, ranking weights, or filter behaviour changes in the prototype.*
