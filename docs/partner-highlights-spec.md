# Tournament partners — Technical Specification

**Product:** Badminton Results Viz  
**Document purpose:** Ranking and display rules for the Tournament partners dashboard section.  
**Last verified against codebase:** May 2026  

**Related:** [Partner chemistry](partner-chemistry-spec.md) (win rate vs expectation — separate feature).

---

## 1. Summary

Tournament partners shows how far you progress together in **progression tournaments** (non-county), per discipline (doubles / mixed). Partners are **ranked by a composite highlight score** combining event volume and tournament depth. There is **no minimum-events cutoff**; low-signal partners appear lower in the list and behind **Show more**.

**Primary implementation:** `src/lib/partnerAchievements.ts`  
**Progression stages:** `src/lib/tournamentProgression.ts` (`STAGE_RANK`, `bestStageFromMatchesForAchievements`)

---

## 2. Per-partner metrics

For each partner with at least one non-county progression event:

| Metric | Definition |
|--------|------------|
| `eventCount` | Number of progression tournaments together |
| `maxStageRank` | Best (deepest) stage reached in any single event (`STAGE_RANK`, 1–7) |
| `typicalRank` | Median of per-event best stage ranks |
| `stageCounts` | Count of events ending at each `ProgressionStage` |
| `podiumCount` | Winner + runner-up event counts |

County tournaments are excluded from aggregation. Event grouping uses `tournamentKey(match)`.

---

## 3. Highlight score (ranking)

```text
depthScore = 0.35 × maxStageRank + 0.65 × (typicalRank ?? 1)

highlightScore = round2( log1p(eventCount) × (1 + depthScore / 7) )
```

- **Volume:** `log1p(eventCount)` dampens huge gaps while keeping long-term partners near the top.  
- **Depth:** Peak (35%) + typical (65%) multiplies volume so deep runs can outrank shallow partners with similar event counts.  
- **Rounding:** Two decimal places for stable sort comparisons.

**Sort order** (descending):

1. `highlightScore`  
2. `podiumCount`  
3. `eventCount`  
4. `partnerName` (locale compare)

Exported helper: `computePartnerHighlightScore(eventCount, maxStageRank, typicalRank)` for tests.

---

## 4. Display rules

| Rule | Behaviour |
|------|-----------|
| Partner list | All partners with progression data, score-sorted |
| Initial cards | Doubles: 2; Mixed: 3 (constants in `PartnerHighlightsSection`) |
| Show more | +3 partners per click (`PartnerHighlightsFamilyBlock`) |
| Partner filter | Full sorted list |
| Single-partner view | Filter to one row + tournament history panel |

Section filters: **time** and **competition** per discipline block (doubles / mixed); partner filter per block. Filter labels are screen-reader only — defaults read as “All time” and “All competitions” in the selects. No section-level time filter or minimum-events control.

---

## 5. Output fields

### `PartnerAchievementRow`

| Field | Type | Meaning |
|-------|------|---------|
| `partnerName` | string | Partner from data |
| `eventCount` | number | Progression events |
| `stageCounts` | partial record | Events per stage |
| `typicalRank` | number \| null | Median depth |
| `typicalLabel` | string \| null | Human label from median |
| `maxStageRank` | number | Peak depth |
| `highlightScore` | number | §3 composite |
| `podiumCount` | number | Winner + runner-up events |

### `PartnerAchievementsFamily`

| Field | Meaning |
|-------|---------|
| `partners` | All rows, sorted by highlight score |
| `totalPartnerCount` | `partners.length` |

---

## 6. Source file map

| Concern | File |
|---------|------|
| Aggregation + score | `src/lib/partnerAchievements.ts` |
| Score / ordering tests | `src/lib/partnerAchievements.test.ts` |
| Progression stages | `src/lib/tournamentProgression.ts` |
| Section UI | `src/components/charts/PartnerHighlightsSection.tsx` |
| Family block + Show more | `src/components/charts/PartnerHighlightsFamilyBlock.tsx` |
| Cards | `src/components/charts/PartnerHighlightCard.tsx` |

---

*Update this file when ranking weights or display constants change.*
