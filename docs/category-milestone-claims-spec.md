# Category milestone claims — Technical specification

**Product:** Badminton Results Viz  
**Audience:** Engineers extending the Category milestones section or deep-link navigation.  
**Last updated:** June 2026  

**Related:** [Tournament progression](tournament-progression-spec.md) (milestone rules and stage ladder).

---

## Summary

**Category milestones** track how far the player has progressed at each tournament level + age combination (Grp → W). The dashboard section shows one card per combination with round badges.

**Claims** are a lightweight UX layer: the player taps to acknowledge newly unlocked rounds, then collapses finished cards to reduce clutter. Claims are stored in **localStorage** per player name — they are not synced to a server.

---

## States

### Round badge

| State | Meaning |
|-------|---------|
| `locked` | Round not yet achieved in match history |
| `claimable` | Achieved but not yet claimed (pulsing badge) |
| `claimed` | Player tapped to claim; shows green tick |

### Card

| State | Meaning |
|-------|---------|
| `active` | At least one round not yet achieved |
| `ready_to_claim` | All rounds achieved; at least one round unclaimed — **Claim** button on card |
| `complete` | Player claimed the whole card; row collapses to a compact summary |

---

## Implementation map

| Concern | Location |
|---------|----------|
| Claim keys and state resolution | `src/lib/categoryMilestoneClaims.ts` |
| localStorage read/write | `src/hooks/useCategoryMilestoneClaims.ts` |
| Section UI | `src/components/charts/CategoryMilestonesSection.tsx` |
| Card / round UI | `src/components/charts/TournamentCategoryCompletion.tsx` |
| Milestone data | `computeCategoryMilestones()` in `src/lib/tournamentProgression.ts` |
| Deep link from recap | `CategoryMilestoneClaimLink.tsx`, `DashboardNavigationContext` |

---

## Storage keys

Claims are keyed by **player name** from the uploaded dataset and stored under a prefix in localStorage (see `useCategoryMilestoneClaims`). Re-importing the same player retains claims; clearing site data resets them.

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

- `src/lib/categoryMilestoneClaims.test.ts` — state resolution and keys
- `src/lib/tournamentProgression.test.ts` — milestone computation
- Navigation behaviour: manual / integration via recap links
