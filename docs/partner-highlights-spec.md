# Tournament partners — Technical Specification

**Product:** Badminton Results Viz  
**Document purpose:** Ranking and display rules for the Tournament partners dashboard section.  
**Last verified against codebase:** June 2026  

**Related:** [Partner chemistry](partner-chemistry-spec.md) (win rate vs expectation — separate feature). [Tournament progression](tournament-progression-spec.md) (depth and podium rules consumed here). [Build guide](tournament-partners-build-guide.md) (implementation spec for engineers without codebase access).

---

## 1. Summary

Tournament partners shows how far you progress together in **progression tournaments** (non-county), split into **Doubles** (MD, WD, OD) and **Mixed** (XD). Singles are excluded.

Partners are **ranked by a composite highlight score** combining event volume and tournament depth. There is **no minimum-events cutoff**; low-signal partners appear lower in the list and behind **Show more**.

**Primary implementation:** `src/lib/partnerAchievements.ts`  
**Progression stages:** `src/lib/tournamentProgression.ts` (`STAGE_RANK`, `bestStageFromMatchesForAchievements`)

---

## 2. Partner eligibility

A partner appears in the list (and partner filter) only if they have **at least one qualifying event** in the current filter selection.

| Rule | Behaviour |
|------|-----------|
| Discipline | Doubles or mixed only (`partnerName` required) |
| Event key | `competitionName` + `discipline` (`tournamentKey`) |
| County | Excluded — events with any county match are dropped |
| Progression | Event must have at least one match with a parseable group/knockout round (`isProgressionTournament`) |
| Depth per event | `bestStageFromMatchesForAchievements` — see tournament progression spec (walkover final wins count on this path) |

---

## 3. Per-partner metrics

For each eligible partner:

| Metric | Definition |
|--------|------------|
| `eventCount` | Number of qualifying progression events together |
| `maxStageRank` | Best (deepest) stage reached in any single event (`STAGE_RANK`, 1–7) |
| `typicalRank` | Median of per-event best stage ranks |
| `stageCounts` | Count of events whose best stage equals each `ProgressionStage` |
| `podiumCount` | Winner + runner-up event counts |

---

## 4. Highlight score (ranking)

```text
depthScore = 0.35 × maxStageRank + 0.65 × (typicalRank ?? 1)

highlightScore = round2( log1p(eventCount) × (1 + depthScore / 7) )
```

- **Volume:** `log1p(eventCount)` dampens huge gaps while keeping long-term partners competitive.  
- **Depth:** Peak (35%) + typical (65%) multiplies volume so deep runs can outrank shallow partners with similar event counts.  
- **Rounding:** Two decimal places for stable sort comparisons.

**Sort order** (descending):

1. `highlightScore`  
2. `podiumCount`  
3. `eventCount`  
4. `partnerName` (`localeCompare`)

Exported helper: `computePartnerHighlightScore(eventCount, maxStageRank, typicalRank)`.

---

## 5. Display and filters

| Rule | Behaviour |
|------|-----------|
| Partner list | All eligible partners, score-sorted |
| Section layout | **Doubles** and **Mixed** blocks always **stacked vertically** (never side-by-side) |
| Initial cards | **2** per family block |
| Card grid | Up to **2 cards per row**; collapsed cards use natural height (`items-start` — do not stretch to match an expanded neighbour) |
| Show more | +3 partners per click |
| Card interaction | Click toggles inline accordion (default collapsed); chevron on header right; does **not** change filters |
| Expanded content | Tournament history shown directly under the card (no intermediate “Explore N tournaments” toggle) |
| Multiple expanded | Cards toggle independently — several may be open at once |
| Partner filter | Narrows visible cards only; does not auto-expand |
| Share export | Caps at **2** visible partner cards (`SHARE_PARTNER_LIMIT`); expanded history excluded *(built separately — see product; omitted from [build guide](tournament-partners-build-guide.md))* |

**Per-column filters** (independent for doubles and mixed): time, competition, partner, competition age. Defaults: all time, all competitions, all partners, all ages.

Filters apply **before** aggregation; changing filters recomputes scores and re-sorts. Changing filters also resets card expand state (via component remount).

### Accordion hierarchy

Expanded partner history is nested:

1. **Section column** — Doubles or Mixed (discipline family)
2. **Partner card** — partner name, event count, stage chips
3. **Stage group** — deepest finish reached (e.g. Winner, Group match wins)
4. **Tournament event** — competition name; `{N} matches · {date}`
5. **Match row** — opponents, outcome, score (see §6)

Each level toggles independently (multiple partners, stages, and events may be open at once). Chevron on the centre-right of partner and tournament headers.

**Auto-expand on partner open** (nested levels only; partner card still toggles manually):

| Events with partner | Stages | Auto-expanded when partner card opens |
|---------------------|--------|---------------------------------------|
| 1 | 1 | Stage group **and** tournament (matches visible) |
| 2+ | 1 | Stage group only; tournaments stay collapsed |
| 2+ | 2+ | Nothing below partner level |

Logic: `partnerHistoryAutoExpandLevel()` in `partnerTournamentHistory.ts`. Applies when the history panel mounts (each time the partner card is expanded).

---

## 6. Tournament history match rows

Match rows inside an expanded tournament (`PartnerHistoryMatchRow` in `PartnerTournamentHistoryPanel.tsx`) use a **compact layout** that deliberately deviates from the standard discipline match row used in [Tournament recap](tournament-recap-spec.md) and expanded rows in [Opponent matchups](opponent-matchups-spec.md).

Those sections follow the product-wide **lean-card** principle: show context at the highest level still true for all children. Tournament partners pushes that further because rows sit **three accordion levels deep**, leaving very little horizontal width.

### What each row shows

| Field | Shown | Notes |
|-------|-------|-------|
| Round / stage | Yes | Italic label when parseable (e.g. *Group*) |
| Opponents | Yes | `vs {opponents}`; wraps to full width (no truncation) |
| Outcome + score | Yes | Single bottom line, e.g. `Win · 21-13, 21-12` |
| Discipline-family shading | Yes | Soft doubles/mixed background on the row only |

### Deviations from standard match cards — and why

| Omitted vs standard match row | Reason |
|-------------------------------|--------|
| **Player and partner names** | Already fixed at the **partner card** level (the accordion item title). Every match in this panel is with the same partner; repeating names on each row adds noise without new information. |
| **Discipline chip and left border** | Discipline family is fixed at the **section column** (Doubles or Mixed). A per-row chip or coloured border duplicates context already established two levels up. |
| **Score in a right-hand column** | Nested accordions leave insufficient horizontal space for the usual two-column layout (opponents left, per-game scores right). Score is placed **underneath** the opponent line instead. Because our player/partner side is not shown on the row (see above), there is also **no “our team” column** to align a score against — unlike recap or H2H rows where both sides are named. |
| **Ratings** | Omitted for the same width constraints; progression depth and head-to-head outcomes are the focus at this level, not rating context. |

### Layout reference

```text
Partner card          ← partner name (fixed for all rows below)
  Stage group         ← finish depth (fixed for events in group)
    Tournament        ← competition + date (fixed for matches in event)
      Match row       ← round · vs Opponents · Win/Loss · score
```

---

## 7. Output types

### `PartnerAchievementRow`

| Field | Meaning |
|-------|---------|
| `partnerName` | Partner from data |
| `eventCount` | Qualifying progression events |
| `stageCounts` | Events per best stage |
| `typicalRank` / `typicalLabel` | Median depth and label |
| `maxStageRank` | Peak depth |
| `highlightScore` | §4 composite |
| `podiumCount` | Winner + runner-up events |

### `PartnerAchievementsFamily`

| Field | Meaning |
|-------|---------|
| `partners` | All rows, sorted |
| `totalPartnerCount` | `partners.length` |

---

## 8. Source file map

| Concern | File |
|---------|------|
| Aggregation + score | `src/lib/partnerAchievements.ts` |
| Score / ordering tests | `src/lib/partnerAchievements.test.ts` |
| Progression stages | `src/lib/tournamentProgression.ts` |
| Discipline filter + history | `src/lib/partnerTournamentHistory.ts` |
| Section UI | `src/components/charts/PartnerHighlightsSection.tsx` |
| Family block + Show more | `src/components/charts/PartnerHighlightsFamilyBlock.tsx` |
| Accordion item (card + history) | `src/components/charts/PartnerHighlightAccordionItem.tsx` |
| Cards | `src/components/charts/PartnerHighlightCard.tsx` |
| Tournament history content | `src/components/charts/PartnerTournamentHistoryPanel.tsx` |
| Share cap | `src/lib/shareLimits.ts` |

---

*Update this file when ranking weights, eligibility rules, display constants, or match-row layout change.*
