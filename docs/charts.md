# Charts and dependencies

**Product:** Badminton Results Viz  
**Last updated:** June 2026  

This app uses two chart libraries. Most dashboard charts stay on **Recharts**; one pie chart uses **Nivo** because Recharts does not provide reliable external callout labels for crowded pies.

---

## Libraries

| Library | Version (approx.) | Used for |
|---------|-------------------|----------|
| [Recharts](https://recharts.org/) | 3.x | Bar charts, line charts, and most dashboard visuals |
| [@nivo/pie](https://nivo.rocks/pie/) | 0.99.x | **Matches by level & age** pie only |
| [@nivo/core](https://nivo.rocks/) | 0.99.x | Peer dependency of `@nivo/pie` |

Install both Nivo packages when setting up locally (`package.json` lists `@nivo/core` and `@nivo/pie`). Do not add Nivo elsewhere unless you have a similar labelling problem — Recharts remains the default for new charts.

**Why two libraries?** Recharts has no built-in collision avoidance for pie callout labels ([open issue since 2017](https://github.com/recharts/recharts/issues/490)). A custom label overlay on top of Recharts was tried and failed because slice geometry was computed twice and leader lines detached from slices. Nivo owns both the pie and its **arc link labels**, so lines stay attached to the correct segment.

---

## Matches by level & age pie

**UI:** `src/components/charts/MatchesByCategoryAgeChart.tsx`  
**Data:** `computeMatchesByCategoryAgeForPie()` in `src/lib/matchesByCategoryAge.ts`  
**Colours:** `getDistinctPieSliceColors()` in `src/lib/pieChartColors.ts`  

Shown in the **All-time summary** card on the **All-time** dashboard tab.

### Responsive behaviour

| Viewport width | Label style |
|----------------|-------------|
| **&lt; 520px** | Pie only + **grid legend** below (category name and % on separate lines). Avoids overlap and clipping on phones. |
| **≥ 520px** | **Arc link labels** (leader lines from slice to label). Pie uses Nivo `fit` so the chart shrinks to leave room for labels inside the SVG. |

### Callout label rules (wide screens)

- Two lines per label: category name, then percentage (no hyphen).
- Slices smaller than **14°** (~4% of the pie) omit callouts; hover the slice for full detail (`arcLinkLabelsSkipAngle`).
- Side margins scale with the longest category name so text is not clipped.
- Animation is disabled (`animate={false}`) so share captures stay stable.

### Tooltips

Custom tooltip preserves grouped-slice detail: when age groups are combined, the tooltip lists which labels are included.

### Changing this chart

- Tune `CALLOUT_BREAKPOINT`, `ARC_LINK_SKIP_ANGLE`, and margin helpers at the top of `MatchesByCategoryAgeChart.tsx`.
- Custom label rendering: `arcLinkLabelComponent` (`ArcLinkLabelWithPercent`).
- If you add another pie with callouts, prefer extending this component or reusing Nivo — do not overlay custom SVG on Recharts pie sectors.

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
