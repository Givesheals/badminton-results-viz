# Tournament Recap — Front-end build spec

**Audience:** Engineer implementing or extending the Tournament Recap dashboard card.  
**Assumption:** Match history data is already loaded and normalised into a consistent match model. You are not implementing import or persistence.  
**Scope:** Dashboard **Tournament recap** section — weekend recap cards, discipline blocks, match rows, celebrations, and related callouts.

---

## What you are building

A card on the player dashboard that summarises each tournament weekend: competition name, date range, win rate, celebrations, discipline-by-discipline breakdown, and curiosities (freak flags, record milestones).

Recaps are grouped by **competition name** and **consecutive calendar days** (a “weekend bucket”). Each bucket becomes one navigable recap card when multiple events exist in the history.

---

## Card structure

```
Tournament recap card
├── Header (competition, category chip, date or date range, win %)
├── Celebration hero (senior county debut, podium, stage reaches)
├── Event summary callouts
├── By discipline
│   └── Discipline block (per discipline)
│       ├── Discipline header (chip, label, W-L, stage, rating, shared partner)
│       ├── Discipline callouts
│       └── Match rows
├── Emoji insights
├── Record milestones
└── Freak flags (nailbiter, single-digit scare, etc.)
```

Data is computed in `src/lib/tournamentRecap.ts` via `computeTournamentRecaps()`. UI lives under `src/components/dashboard/recap/`.

---

## Display hierarchy principle

**Keep cards lean.** Show information at the highest level where it is still true for all children, and omit it from lower levels.

This avoids repeating the same partner name or date on every match row when the context is already clear from a parent section.

---

## Date display rules

| Level | When shown | Format |
|-------|------------|--------|
| Card header | Always | Single date if all matches share one day; `dateFrom → dateTo` if the recap spans multiple days |
| Match row | Only when `dateFrom !== dateTo` | Formatted match date, optionally followed by round label (`date · round`) |
| Match row (single-day recap) | Hidden | Round label alone may still appear if present |

`showDate` on each `DisciplineMatchRecap` is set in the data layer from the weekend bucket’s date range.

---

## Partner display rules

| Level | When shown | Format |
|-------|------------|--------|
| Discipline header | All competitive matches in that discipline share the same non-null partner | `with {partnerName}` directly below the discipline title |
| Match row | Partners vary within the discipline, or partner cannot be hoisted | `with {partnerName}` under the opponent line |
| Match row (uniform partner) | Hidden | Partner inherited from discipline header |

A partner is hoisted only when **every** competitive match in the discipline has the same non-null `partnerName`. Singles disciplines naturally have no partner to hoist.

`showPartnerName` on each `DisciplineMatchRecap` is `true` only when the match has a partner and the discipline-level partner was not hoisted.

---

## Out of scope for display hierarchy

The lean-card rules apply to **discipline match rows** only. These sections keep their own self-contained layout:

- Freak-flag curiosity cards (nailbiter, single-digit scare, money’s worth)
- Celebration hero
- Event summary and discipline callout cards
- Record milestone cards
- Emoji insight cards

---

## Key data types

Defined in `src/lib/tournamentRecap.ts`:

- `TournamentRecap` — one weekend bucket (`dateFrom`, `dateTo`, `disciplines`, etc.)
- `DisciplineRecap` — one discipline within a recap (`partnerName` when uniform, `matches`, stats)
- `DisciplineMatchRecap` — one match row (`showDate`, `showPartnerName`, opponents, score, highlights)
- `SeniorCountyDebutCelebration` — first-ever senior county appearance at this event (`celebrations.seniorCountyDebut`)

---

## Senior county debut card

Shown when the player has **no prior senior county matches** anywhere in their uploaded history and this recap includes at least one competitive match at **County** level with **Senior** age.

- **Detection:** `isSeniorCountyMatch()` in `src/lib/tournamentProgression.ts` (County category + Senior age group).
- **Wording:** Title is “First senior county appearance”. Copy says “playing at senior county level” — it does **not** claim squad selection, because subs and fill-ins count as appearances.
- **Placement:** Own hero card at the top of the celebration section (before podium cards).
- **Season accolades:** The same milestone appears in **This season’s accolades** when the first-ever senior county event falls in the current season (`computeSeasonSeniorCountyDebut` in `seasonTrophyCabinet.ts`).

---

## Future engineering (out of scope here)

**First appearance per team:** When full team/squad data is available, celebrate the first time a player represents each distinct county team (not just senior county as a category). Current match history does not expose reliable team identity, so this prototype only detects the first senior county event overall. File a product ticket referencing this spec when building against real squad data.

---

## Related specs

- [Tournament progression](tournament-progression-spec.md) — stage labels, podium, progression charts
- [Category milestone claims](category-milestone-claims-spec.md) — claim flow from recap links
- [Partner chemistry](partner-chemistry-spec.md) — overperformance math used for discipline callouts
- [Opponent matchups](opponent-matchups-spec.md) — nemesis / favourite-opponent milestones in recap
- [Charts](charts.md) — Recharts usage (summary pie is separate from recap UI)
