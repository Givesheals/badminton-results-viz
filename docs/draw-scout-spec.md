# Draw scout — Feature brief

**Product:** Badminton Results Viz / Badminfo  
**Audience:** Engineers implementing the draw-out email refresh and in-app draw scout card.  
**Last updated:** July 2026  
**Related:** [Opponent notes spec](./opponent-notes-spec.md), [`sendgrid/draw-out.html`](../sendgrid/draw-out.html)

---

## Summary

When a tournament draw is published, players need to see **what their draw is** quickly (especially on mobile email). Personal notes are valuable but secondary — they belong in the app, not inlined in the notification.

This feature:

1. **Simplifies the “your draw is out” email** — draw preview only, plus a single CTA when the user has notes on opponents in that draw.
2. **Adds a temporary “Draw scout” card** at the top of the **Events** tab — draw structure + the user’s saved notes on relevant opponents (shown as the most recent / upcoming event, above past tournament recaps).
3. **Lets the user view any entered player’s draw** in that competition (favourites surfaced first; full search for any entrant) so they can prep tactical advice for friends without a share button.

Notes remain private; there is no export or share affordance. The entire Notes feature is already premium-gated — no additional gating here.

---

## Problem

The enhanced draw-out email inlined full note text under each matchup and a “You may also meet” panel. On a phone:

- The draw table (the primary information) competes with note content for limited space.
- Email is the wrong surface for rich scouting detail (discipline caveats, pairing caveats, match result drill-down).

Users also want to explore **someone else’s draw** in the same competition (friend on WhatsApp, car ride to venue) while reading **their own** notes on that friend’s opponents.

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Draw-out email: strip inline notes; add note-count CTA | Server-side note sync for email (count can be computed server-side once notes sync exists; prototype uses mock count) |
| Draw scout card on Events tab | Share / export notes or draw |
| Competition + player pickers | Historical draw browsing after event ends |
| Deep link from email (`?tab=latest-event&draw=…`) | Draw-out email variant for non-entrants |
| Mock draw data for prototype | Live draw API integration (prototype first) |
| “Explore a draw” header link (Events tab) | Push notifications |
| Reuse existing note rendering (`NoteEntry`, tags, discipline chips) | Match journal in draw scout (personal notes only) |

---

## Part 1 — Draw-out email

### Design principle

**Email = draw only.** One optional teaser line + CTA when notes exist. Do not dilute the draw preview.

### Content (unchanged)

- Logo, greeting
- Intro: draw for `{competitionName}` is out; `{favouritesCount}` favourites entered
- **Your draw preview** — discipline groups, rounds, your side vs opponent side (linked names)
- Footer: opt out of draw notifications, unsubscribe

### Content (removed)

- `matchups[].notes` rows beneath each matchup
- `laterNotes` / “You may also meet” panel
- `seeAllDrawNotesUrl` as a secondary link inside the email body (replaced by primary CTA)

### Content (added)

After the draw preview, **only when `notesOpponentCount > 0`**:

```text
You have personal notes on {notesOpponentCount} opponent{s} in this draw.

[View draw notes →]   →  {drawNotesUrl}
```

When `notesOpponentCount === 0`, omit this block entirely (draw-only email).

### Email payload shape

```typescript
type DrawOutEmailData = {
  recipientFirstName: string
  competitionName: string
  competitionUrl: string
  favouritesCount: number
  /** Slug for deep link, e.g. cambridgeshire-senior-bronze-july-2026 */
  competitionSlug: string
  /** Count of distinct opponents in this draw the user has personal notes on. */
  notesOpponentCount: number
  drawNotesUrl: string // e.g. …/player/{id}?tab=latest-event&draw={competitionSlug}
  notificationSettingsUrl: string
  unsubscribeUrl: string
  disciplineGroups: DrawDisciplineGroup[] // matchups WITHOUT notes[]
}

type DrawMatchup = {
  id: string
  roundLabel: string
  yourSide: DrawPlayer[]
  opponentSide: DrawPlayer[]
  // notes removed
}
```

Remove types/fields: `DrawNoteLine`, `matchups[].notes`, `laterNotes`, `seeAllDrawNotesUrl`.

### Files to update

| File | Change |
|------|--------|
| `sendgrid/draw-out.html` | Remove note rows and later-notes panel; add CTA block |
| `sendgrid/draw-out.test-data.json` | Match slim payload |
| `src/lib/notificationPreviewData.ts` | Update types + `drawOutPreview` |
| `src/components/notifications/DrawOutEmail.tsx` | Mirror template |
| `sendgrid/README.md` | Document that email no longer needs note bodies |

---

## Part 2 — Draw scout card (in-app)

### Placement

Top of the **Events** tab (`TournamentRecapSection`), above past tournament recaps — treated as the user’s most recent / upcoming event.

```
Events tab
├── Draw scout card (conditional — upcoming draw; see visibility rules)
└── Tournament recap (newest past weekend first, Previous/Next nav)
```

### Card structure

```
Draw scout card
├── Competition picker (always visible when card is shown)
├── Player picker (combobox; favourite chips show a gold star)
├── Context line (when viewing someone else's draw)
├── Draw by discipline
│   └── Matchup block (per round)
│       ├── Header: discipline left edge + your side vs opponents (tappable when intel exists)
│       ├── Collapsed teaser: amber “View notes” (left) + outline ghost chip “Played you: {m}” (mobile: right-aligned; desktop: reserved notes-slot cluster)
│       └── Expanded:
│           ├── Tabs “Notes” / “Your games” only when both exist (default Notes); otherwise single panel
│           ├── Exact pairing block first (pair notes or games vs both, per active panel)
│           └── Then each opponent alone (solo / other-partner notes or games without partner)
└── "You may also meet" (collapsible; knockout-path opponents with notes)
```

### Competition picker

Always shown at the top of the card when the card is visible.

**List contents** — **upcoming and in-progress only** (see lifecycle). Past competitions are never searchable or listed.

| Section | Source |
|---------|--------|
| Your competitions | Upcoming/in-progress comps the signed-in player is entered in |
| Favourites this weekend | Upcoming/in-progress comps where ≥1 favourite is entered (excluding comps already under “Your competitions”) |
| Search | Type to find any upcoming or in-progress competition with a published draw |

**Default selection:**

1. User’s soonest active competition (if entered)
2. Else soonest active competition where a favourite is entered
3. Else none until chosen via “Explore a draw”

Changing competition resets the player picker unless the same player is also entered in the newly selected comp.

### Player picker

Single combobox: **“Whose draw”**

| Section | Contents |
|---------|----------|
| Pinned | `{playerName} (you)` when entered in selected comp |
| Favourites in this draw | Favourites who are entered (starred in the list) |
| All entered players | Search/filter any entrant in this competition |

**Quick chips (below the combobox):**

- Always show **You** when entered
- Show at most **2** favourite name chips (keeps the selected favourite visible when possible)
- If more favourites remain, a **★ +N more** control opens the combobox — never expands into a long chip row (designed for ~10–15 favourites)

**Default selection:**

- **You**, if entered in the selected competition
- Else placeholder: “Choose a player…”

**When viewing another player’s draw**, show a context line:

> Viewing **Sara Moore**’s draw — your notes on their opponents

Notes displayed are always from the **signed-in user’s** `OpponentNotesContext` — never another user’s notes. No share button.

### Note resolution

For each opponent name in the viewed player’s draw:

```typescript
const relevant = sortNotesNewestFirst(
  getNotesForOpponent(allNotes, opponentName),
)
// Filter by discipline scope where applicable (see opponent-notes-spec)
// Apply pairing caveat when note target was a pair with a different partner
```

Reuse existing UI primitives from `OpponentNotesSection` (`NoteEntry`, `DisciplineChip`, `NoteTagChips`, `OpponentNoteMatchFooter`).

**Exclude** match journal notes (`kind: 'match'`).

### “You may also meet”

Per discipline, show knockout opponents the viewed player might face **outside their current groups** — grouped by **round**, then ranked by **probability** within each round (percentages in a round sum to 100%).

- One section per entered discipline (not a single card-level panel)
- Round headers (Quarter-finals, Semi-finals, …) with opponents sorted most likely first
- Leading **53%** badge (option A), opponent pair names below
- Top **2** opponents visible per round; “+N more in quarter-finals” reveals the rest
- All plausible opponents shown (not filtered to those with notes)
- Rows with notes or previous games expand into Notes / Your games tabs (same as draw matchups)
- Rows without intel use the same card shell with “No notes or games yet” (not expandable)

```typescript
type DrawScoutLaterOpponent = {
  opponentSide: DrawPlayer[]   // 1 = singles, 2 = pair
  disciplineCode: string
  roundLabel: string
  probability: number        // 0–1; same discipline + round sums to 1
}
```

---

## Part 3 — Visibility & lifecycle

### When the card auto-shows

The draw scout card appears when **any** active competition (draw published, not yet expired — see below) satisfies:

1. The user is entered, **or**
2. A favourite is entered, **or**
3. The user arrived via deep link `?tab=latest-event&draw={slug}` (legacy `?tab=notes&draw=` still opens Events)

### When the card is hidden

No active competitions qualify for auto-show → card hidden until the user picks a competition via **“Explore a draw →”** or a deep link.

### Expiry rule

Remove a competition from active lists (and hide the card if none remain) when **both** are true:

1. The competition has finished (last match day over), **and**
2. That competition’s **weekend** has passed (last calendar day of the event’s weekend)

Use whichever boundary is **later**. No grace period beyond the weekend — no historical draw browsing. Competition search and pickers only surface **upcoming** and **in-progress** events.

### Entry points

Both entry points are kept:

| Entry | When | Behaviour |
|-------|------|-----------|
| **In-card competition picker** | Card visible | Switch between active competitions; defaults to user’s comp when available |
| **Header “Explore a draw →”** | Always in Events tab (recap header) | Opens competition picker (same upcoming/in-progress scope). Useful when the card is hidden, or as a discoverable alternate path when the card is already showing |
| **Email CTA** | Draw-out notification | Deep link opens Events tab, selects competition from `draw` param, scrolls card into view |

---

## Part 4 — Deep links & URL params

### Query parameters

| Param | Example | Behaviour |
|-------|---------|-----------|
| `tab` | `notes` | Activate Notes dashboard tab |
| `draw` | `cambridgeshire-senior-bronze-july-2026` | Select competition in draw scout card |
| `player` | `Sara%20Moore` | Optional; select player in player picker. Default: self if entered |

Example email CTA:

```text
https://badminfo.com/player/{playerId}?tab=latest-event&draw=cambridgeshire-senior-bronze-july-2026
```

Prototype app can read the same params from `window.location.search` or integrate with `DashboardNavigationContext` (extend tab routing similarly to existing section deep links).

---

## Part 5 — Data model (prototype)

Until a live draw API exists, drive the card from mock data in `src/lib/drawScoutPreviewData.ts` (new file).

### `DrawScoutCompetition`

```typescript
type DrawScoutCompetition = {
  slug: string
  name: string
  /** ISO date of first day; used for sorting and weekend calculation */
  startDate: string
  /** ISO date of last day */
  endDate: string
  competitionUrl: string
  /** Entrants with their draw structure keyed by player name */
  entrants: DrawScoutEntrant[]
  /** Opponents user might meet later in knockouts (per entrant) */
  laterOpponentsByEntrant: Record<string, DrawScoutLaterOpponent[]>
}

type DrawScoutEntrant = {
  name: string
  isYou?: boolean
  isFavourite?: boolean
  disciplineGroups: DrawDisciplineGroup[] // same shape as email (no notes)
}

type DrawScoutLaterOpponent = {
  opponentSide: DrawPlayer[]
  disciplineCode: string
  roundLabel: string
  probability: number
}
```

### Active competition helper

```typescript
function isDrawScoutCompetitionActive(
  comp: DrawScoutCompetition,
  now: Date,
): boolean {
  // true while draw is published AND not past expiry (competition over + weekend over)
}
```

### Note count for email (prototype)

```typescript
function countDrawOpponentsWithNotes(
  entrant: DrawScoutEntrant,
  allNotes: OpponentNote[],
): number
```

Count distinct opponent names across all matchups + later opponents where `getNotesForOpponent` returns personal notes.

---

## Part 6 — Component plan

| Component | Responsibility |
|-----------|----------------|
| `DrawScoutCard` | Card shell, visibility, competition + player state |
| `DrawScoutCompetitionPicker` | Dropdown + search |
| `DrawScoutPlayerPicker` | Combobox with favourites section |
| `DrawScoutMatchupBlock` | One round row + nested notes |
| `DrawScoutLaterSection` | Per-discipline “You may also meet” grouped by round |
| `TournamentRecapSection` | Mount `DrawScoutCard` above tournament recap; “Explore a draw →” in Events header |

Extract shared note row rendering from `OpponentNotesSection` if needed to avoid duplication (`DrawScoutNoteList` or shared `NoteEntry`).

---

## Part 7 — Implementation checklist

### Email (can ship independently)

- [x] Slim `DrawOutEmailData` type
- [x] Update `draw-out.html` + test JSON
- [x] Update `DrawOutEmail.tsx` preview
- [x] Update `notificationPreviewData.ts` comments

### Draw scout card (prototype)

- [x] Add `drawScoutPreviewData.ts` with 1–2 competitions (reuse matchup data from current `drawOutPreview`)
- [x] Implement `isDrawScoutCompetitionActive()`
- [x] Build `DrawScoutCard` + pickers
- [x] Wire notes from `useOpponentNotesContext()`
- [x] Integrate into `TournamentRecapSection` (Events tab)
- [x] Parse `?tab=latest-event&draw=&player=` on load (legacy `tab=notes` remaps to Events)
- [ ] Add in-app preview route or dev flag to simulate “draw is out” state

### Tests

- [x] `isDrawScoutCompetitionActive` — weekend boundary cases
- [x] `countDrawOpponentsWithNotes` — distinct opponents, empty notes
- [x] Default competition/player selection logic

### Docs

- [x] Update `opponent-notes-spec.md` future integration → link here
- [x] Update `sendgrid/README.md`

---

## UX copy reference

| Location | Copy |
|----------|------|
| Email CTA | View draw notes → |
| Email teaser | You have personal notes on {n} opponent(s) in this draw. |
| Card title | Draw scout |
| Player picker label | Whose draw |
| Competition picker label | Competition |
| Viewing other player | Viewing **{name}**’s draw — your notes on their opponents |
| Later section title | You may also meet |
| Later section helper | Entered this draw but not in their group — you could face them in the knockouts. |
| Header entry (always visible) | Explore a draw → |
| Empty player | Choose a player… |
| No notes on opponent | (omit row, or muted “No notes yet”) |

---

## Open questions (deferred)

| Topic | Decision |
|-------|----------|
| Server note sync for email count | Required for production email; prototype uses client-side count from mock + localStorage |
| Live draw API shape | Map 1:1 onto `DrawScoutCompetition` when available |
| Favourites list source | Prototype: mock names flagged `isFavourite`; production: user favourites service |
| Competition search scope | **Decided:** upcoming and in-progress only |
| Header “Explore a draw” vs in-card picker | **Decided:** keep both |

---

## ASCII — final layout

```
┌─────────────────────────────────────────────────┐
│ Events                                          │
├─────────────────────────────────────────────────┤
│ ┌─ DRAW SCOUT (most recent / upcoming) ───────┐ │
│ │ Competition  [ Cambs Senior Bronze · 12 Jul ▼]│
│ │ Whose draw   [ Simon Parker (you)            ▼]│
│ │ ★ Sara  ★ Martin  ★ +N more                  │ │
│ │                                              │ │
│ │ ● Mixed Doubles · Group A                    │ │
│ │   …matchup cards…                            │ │
│ │   You may also meet                          │ │
│ │     Quarter-finals · 45% Tom & Lucy …        │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ TOURNAMENT RECAP ──── [Explore a draw →] ──┐ │
│ │ …past weekend recap…                         │ │
│ └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Prototype matchup fixtures (Simon’s Cambs draw):** notes-only (Murray), both (Dan & Alisha), games-only (Gilhooly & Mayfield), neither (Chris Nolan & Alex Reid).

**Notes accent:** soft amber on the View notes badge, Notes tab indicator, and “Note from this game” labels. Brand purple remains for clickable chrome (selected chips, primary buttons).
