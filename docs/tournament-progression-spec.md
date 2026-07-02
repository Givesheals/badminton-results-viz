# Tournament progression — Technical Specification

**Product:** Badminton Results Viz  
**Document purpose:** Rules for how far a player progresses in a tournament, podium placement (1st / 2nd / 3rd), and category milestones. Use this when writing product markdowns that engineers will implement.  
**Last verified against codebase:** June 2026  

**Related:** [Tournament partners](partner-highlights-spec.md) (partner depth ranking — consumes these rules).

---

## 1. Summary

**Depth** is how far a player reached in one competition + discipline. It is derived from match `Round` labels, win/loss outcomes, and format rules below — not from a separate “draw format” column.

**Podium** (season trophy shelves, weekend recap cards) is 1st / 2nd / 3rd place. This is separate from tournament **level** chips (Copper, Bronze, Silver, Gold).

**Primary implementation:** `src/lib/tournamentProgression.ts`  
**Podium mapping:** `src/lib/seasonTrophyCabinet.ts` (`placementFromBestStage`)  
**Weekend celebrations:** `src/lib/tournamentRecap.ts`

---

## 2. Stage ladder

Stages are ordered by `STAGE_RANK` (1 = shallowest):

| Rank | Stage | Short label |
|------|-------|-------------|
| 1 | `group-stages` | Grp |
| 2 | `group-wins` | GW |
| 3 | `knockout` | KO |
| 4 | `quarter-final` | QF |
| 5 | `semi-final` | SF |
| 6 | `runner-up` | RU / 2nd |
| 7 | `winner` | W |

**Category milestones** (`Grp`, `GW`, `QF`, `SF`, `RU`, `W`) are **cumulative by rank**: reaching runner-up ticks all shallower milestones for that tournament level + age combination.

In the dashboard UI, shallower achieved rounds are **auto-claimed on load**; only the deepest achieved round per card stays claimable until the player taps it. See [category-milestone-claims-spec.md](category-milestone-claims-spec.md).

**Progression UI** merges `knockout` into `quarter-final` on the depth bar only.

**County** events and events with no parseable round labels are excluded from progression stats.

---

## 3. Product rules (1–6)

### Rule 1 — Winning counts regardless of format

**Status:** Implemented  

A main final win → `winner`. Walkover final wins count in the achievements path (`bestStageFromMatchesForAchievements`).

**Round-robin-only events** (every parseable round is a group/box/RR label; no knockout bracket): if the player won every group match in a **complete** schedule for a draw of **3+ teams**, depth is `winner`. Draw size is inferred from unique group opponents + 1 (see §5).

### Rule 2 — Runner-up always counts as runner-up

**Status:** Implemented  

Main final loss → `runner-up`. Silver Final loss is treated as a main final loss (not semi-final exit).

### Rule 3 — 3rd place requires a real competitive win

**Status:** Implemented  

3rd place (bronze shelf / joint-3rd recap card) requires:

- `bestStage` of `semi-final` (semi exit or bronze-final path), **and**
- At least one **competitive** win in the event (non-walkover), **and**
- Not a small round-robin-only event (≤3 teams inferred), **and**
- For **bronze final** wins: at least one competitive non-walkover win **outside** the bronze final (walkover-only paths into bronze do not qualify).

Semi-final **loss** with zero competitive wins does **not** award 3rd.

### Rule 4 — Box → later rounds count; skipped rounds still tick milestones

**Status:** Implemented  

If the event included a group/box/round-robin phase, playing a later knockout round counts as that depth **even when intermediate rounds were skipped** (e.g. box → semi-final with no quarter-final). Loss in that round still credits the round reached.

Cumulative milestone ticks follow `STAGE_RANK` (first final-equivalent depth ticks all shallower milestones).

### Rule 5 — Joint 2nd = 2nd, not 3rd

**Status:** Documented only (not implemented in this repo)  

When the full draw is visible, formats that award **joint 2nd** (e.g. “Joint 2nd”, “Shared 2nd”, Silver Final loss in some structures) must map to **2nd place**, never 3rd.

This visualization only sees one player’s match rows, so joint-2nd detection is deferred to a future product with full-draw data. Engineers should implement Rule 5 where entrant/placement metadata exists.

### Rule 6 — Pure knockout: must earn the round with a win

**Status:** Implemented  

When there was **no** group/box phase:

- A loss at the only knockout match (e.g. sole quarter-final) → `group-stages` / `group-wins`, **not** quarter-final.
- A win at a knockout round credits that round and allows a **loss** at the next round to count as reaching the deeper stage (e.g. QF win + SF loss → `semi-final`).
- Main final win/loss still maps to `winner` / `runner-up` (Rule 2).

---

## 4. Round label parsing

| Round text (examples) | Parsed stage | Notes |
|------------------------|--------------|-------|
| Group, Groups, Pool, League, RR, Round robin, Box, G1, Group A | `group-stages` | |
| R128–R16, Last 16, Knockout, KO | `knockout` | |
| Quarter, QF, Last 8 | `quarter-final` | |
| Semi, SF, Last 4 | `semi-final` | |
| Final, Gold (not bronze/silver/plate) | Main final | Win → `winner`, loss → `runner-up` |
| Bronze Final | Placement final | Win may → 3rd (Rule 3); loss → no podium |
| Silver Final | Main final | Loss → `runner-up` |

Unrecognised or missing rounds do not contribute to depth.

---

## 5. Small-draw inference

There is **no Draw Size column** in the standard export. The product estimates entrant count as:

```text
unique opponents in group-phase matches + 1
```

**Limitations:**

- Based on this player’s opponents only; incomplete data may mis-classify.
- Small round-robin (≤3 teams inferred) blocks 3rd-place podium.
- RR champion promotion requires entrant count ≥ 3 and a full RR schedule (`group match count ≥ entrantCount − 1`).

**Future:** a `Draw Size` column could replace inference.

---

## 6. Walkovers

| Context | Behaviour |
|---------|-----------|
| Walkover / no-match rows | Excluded from competitive progression stats |
| Walkover **final** win (achievements path) | Can count as `winner` |
| Walkover **final** loss (achievements path) | Can count as `runner-up` |
| Walkover as only win before bronze final | Does **not** qualify for 3rd (Rule 3) |
| Walkover group win | Can count toward `group-wins` in achievements path |

“Concession” in product language = walkover only (not retirements).

---

## 7. Consumer map

| Module | Functions |
|--------|-----------|
| `tournamentProgression.ts` | `bestStageFromMatches`, `bestStageFromMatchesForAchievements`, `refineEarnedBestStage`, `qualifiesForThirdPlace` |
| `seasonTrophyCabinet.ts` | `placementFromBestStage`, `computeSeasonTrophyCabinet` |
| `tournamentRecap.ts` | `buildCelebrations`, `hasJointThirdPodium` |
| `seasonJourney.ts` | Weekend dots via `bestStageFromMatchesForAchievements` |
| `partnerAchievements.ts` | Partner depth via `bestStageFromMatchesForAchievements` |
| Category milestones UI | `computeCategoryMilestones` → `buildCategoryCompletionMilestones` |
| Category milestone claims | `buildFrontierAutoClaims`, `categoryMilestoneClaims.ts`, `useCategoryMilestoneClaims` — see [category-milestone-claims-spec.md](category-milestone-claims-spec.md) |

All depth consumers should use `bestStageFromMatches*` (not raw round labels per match).

---

## 8. Test matrix (regression)

| Scenario | Expected depth / podium |
|----------|-------------------------|
| Sole QF, loss, no group | `group-stages` — not QF |
| Sole QF, win, no group | `quarter-final`; QF milestone ticked |
| Box win + SF loss | `semi-final` |
| Box win + R16 loss | `knockout` |
| 3-team RR, won all group | `winner` |
| 3-team RR, 1W 1L | `group-wins`; no 3rd |
| QF win + SF loss, no group | `semi-final`; joint-3rd eligible |
| SF loss, zero competitive wins | No 3rd |
| WO group win + bronze final win | No 3rd |
| QF win + bronze final win | 3rd |
| Pure KO QF loss only | No QF milestone / no QF depth |

Tests: `tournamentProgression.test.ts`, `seasonTrophyCabinet.test.ts`, `tournamentRecap.test.ts`.
