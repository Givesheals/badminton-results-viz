# Charts and dependencies

**Product:** Badminton Results Viz  
**Last updated:** June 2026  

All dashboard charts use **[Recharts](https://recharts.org/)** (v3.x).

---

## Library

| Library | Version (approx.) | Used for |
|---------|-------------------|----------|
| [Recharts](https://recharts.org/) | 3.x | Bar charts, line charts, pie charts, and all dashboard visuals |

---

## Matches by level & age pie

**UI:** `src/components/charts/MatchesByCategoryAgeChart.tsx`  
**Data:** `computeMatchesByCategoryAgeForPie()` in `src/lib/matchesByCategoryAge.ts`  
**Colours:** `getDistinctPieSliceColors()` in `src/lib/pieChartColors.ts`  

Shown in the **All-time summary** card on the **All-time** dashboard tab.

### Layout

- Recharts `PieChart` with a **vertical legend** on the right (`ChartLegend` custom content).
- Pie sits on the left; legend width and pie radius scale with container width via `computePieLayout()`.
- On narrow containers (&lt; 400px), the legend takes more horizontal space so labels stay readable.

### Tooltips

Custom tooltip preserves grouped-slice detail: when age groups are combined, the tooltip lists which labels are included.

### Changing this chart

- Tune `MAX_OUTER_RADIUS`, `PIE_INSET`, and breakpoint thresholds in `computePieLayout()` at the top of `MatchesByCategoryAgeChart.tsx`.
- Legend styling lives in `ChartLegend`.

---

## Other Recharts charts

| Section | Component |
|---------|-----------|
| Results over time | `WinRateOverTimeChart.tsx`, `PlayingActivityChart.tsx` |
| Matches by discipline | `CategoryChart.tsx` |
| Partner chemistry | `PartnerChemistryChart.tsx` |
| Tournament progression | `TournamentProgressionChart.tsx` |
| Season rating | `SeasonRatingChart.tsx` |

---

## Related specs

- [Tournament progression](tournament-progression-spec.md) — category milestones data (separate from this pie)
- [Tournament recap](tournament-recap-spec.md) — recap cards (no pie)
