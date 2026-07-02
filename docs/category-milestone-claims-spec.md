# Category milestone claims — Technical specification

**Product:** Badminton Results Viz  
**Audience:** Engineers extending the Category milestones section or deep-link navigation.  
**Last updated:** July 2026  

**Related:** [Tournament progression](tournament-progression-spec.md) (milestone rules and stage ladder).

---

## Summary

**Category milestones** track how far the player has progressed at each tournament level + age combination (Grp → W). The dashboard section shows one card per combination with round badges.

**Claims** are a lightweight UX layer: the player taps to acknowledge their **frontier** (best achieved) round per card, then collapses finished cards to reduce clutter.

On load, **shallower achieved rounds are auto-claimed** so first visit is not a wall of pulsing badges — at most one `?` per card remains claimable until the player taps it.

**Persistence:** claims are **in-memory only** for now (prototype). They reset on page reload; frontier auto-claims are recomputed from match history each time. localStorage per player name is planned but not implemented yet.

---

## Frontier auto-claim

For each category card (`comboKey` = tournament level + competition age):

1. Find the **deepest achieved** milestone (last achieved stage in `CATEGORY_COMPLETION_STAGES` order).
2. Treat every other achieved stage as **already claimed** (green tick, no pulse).
3. Leave only the frontier round in `claimable` state until the player taps it.

| Card progress | Auto-claimed | Claimable |
|---------------|--------------|-----------|
| Grp + GW only | Grp | GW |
| Through SF | Grp, GW, QF | SF |
| Full ladder (W) | Grp … RU | W |

Functions: `deepestAchievedMilestone()`, `buildFrontierAutoClaims()` in `categoryMilestoneClaims.ts`.

The hook merges **frontier auto-claims** (derived from `computeCategoryMilestones()` on all competitive matches) with **manual claims** (rounds and cards the player taps during the session). Re-importing data recomputes frontier claims; manual session claims are preserved until reload.

---

## States

### Round badge

| State | Meaning |
|-------|---------|
| `locked` | Round not yet achieved in match history |
| `claimable` | Achieved, is the card frontier, and not yet manually claimed (pulsing `?`) |
| `claimed` | Achieved and either auto-claimed (shallower than frontier) or manually claimed |

### Card

| State | Meaning |
|-------|---------|
| `active` | At least one round not yet achieved, or frontier not yet manually claimed |
| `ready_to_claim` | All rounds achieved and all rounds claimed — **Claim** button on card |
| `complete` | Player claimed the whole card; row collapses to a compact summary |

---

## Implementation map

| Concern | Location |
|---------|----------|
| Claim keys, frontier auto-claim, state resolution | `src/lib/categoryMilestoneClaims.ts` |
| In-memory claim state (frontier + manual merge) | `src/hooks/useCategoryMilestoneClaims.ts` |
| Section UI | `src/components/charts/CategoryMilestonesSection.tsx` |
| Card / round UI | `src/components/charts/TournamentCategoryCompletion.tsx` |
| Milestone data | `computeCategoryMilestones()` in `src/lib/tournamentProgression.ts` |
| Deep link from recap | `CategoryMilestoneClaimLink.tsx`, `DashboardNavigationContext` |
| In-app help copy | `categoryMilestonesInfo` in `src/content/sectionInfo.tsx` |

---

## Claim keys

Round keys: `{comboKey}:{stage}`  
Card keys: `{comboKey}:card`  

`comboKey` comes from `categoryAgeComboKey()` (tournament level + competition age).

---

## Navigation

`DashboardNavigationContext` exposes `navigateToCategoryMilestone(comboKey, stage)`:

- Switches to the **All-time** tab.
- Scrolls to `#category-milestones`.
- Highlights the target round (e.g. from a tournament recap “claim your QF” link).

Section id constant: `CATEGORY_MILESTONE_SECTION_ID` in `categoryMilestoneClaims.ts`.

---

## Tests

- `src/lib/categoryMilestoneClaims.test.ts` — keys, state resolution, frontier auto-claim
- `src/lib/tournamentProgression.test.ts` — milestone computation
- Navigation behaviour: manual / integration via recap links

---

## Future work

- **localStorage persistence** per player name so manual card collapses and newly claimed frontiers survive reloads.
- **One-time onboarding flag** so frontier migration does not re-run after persistence ships (only genuinely new achievements become claimable).
