# Draw companion — Feature brief

**Product:** Badminton Results Viz / Badminfo  
**Audience:** Engineers implementing the draw-out email refresh and in-app draw companion card.  
**Last updated:** July 2026  
**Related:** [Opponent notes spec](./opponent-notes-spec.md), [`sendgrid/draw-out.html`](../sendgrid/draw-out.html)

---

## Summary

When a tournament draw is published, players need to see **what their draw is** quickly (especially on mobile email). Personal notes are valuable but secondary — they belong in the app, not inlined in the notification.

This feature:

1. **Simplifies the “your draw is out” email** — draw preview only, plus a single CTA when the user has notes on opponents in that draw.
2. **Adds a “Draw companion” view** on the public **tournament page** — accessible via a Companion stage chip (Premium always; rare gift for some non-Premium). Shows draw structure + the user’s saved notes on relevant opponents.
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
| Draw companion on tournament page (stage chip) | Share / export notes or draw |
| Competition + player pickers | Historical draw browsing after event ends |
| Deep link from email into companion | Draw-out email variant for non-entrants |
| Mock draw data for prototype | Live draw API integration (prototype first) |
| Gift visibility (~1 in 10 non-Premium) | Push notifications |
| Reuse existing note rendering (`NoteEntry`, tags, discipline chips) | Match journal in draw companion (personal notes only) |

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

## Part 2 — Draw companion card (in-app)

### Placement

**Decided:** Companion stage chip on the public Badminfo **tournament page** (alongside Entries / Groups / Finals). Selecting Companion swaps the page content below the stage bar — not a modal.

**Who sees it:** Premium users always; non-Premium may get a rare gift (~1 in 10 when their set BE number is entered). Otherwise the page is unchanged (stage bar shows Entries / Groups / Finals only). Gift users have no notes (notes are Premium-only).

**Prototype:** Menu → Tournament page preview. Visibility toggle (Premium / Gift / Hidden) simulates the three visitor states.

```
Tournament page
├── Tournament info card
├── Category tabs
├── Stage: Entries · Groups · Finals · Companion ★  (Companion only if Premium/gift)
└── Content area (bracket / entries / groups — or Draw companion when Companion selected)
```

The Events tab remains tournament recap only (no draw companion card).
### Card structure

```
Draw companion card
├── Competition picker (always visible when card is shown)
├── Player picker (combobox; favourite chips show a gold star)
├── Context line (when viewing someone else's draw)
├── Draw by discipline
│   └── Matchup block (per round)
│       ├── Upcoming: full card — names, ratings, notes / past games
│       ├── Played: compact — Win/Loss + score, shorter names, still expandable
│       ├── Next probable: “opponent TBD” + ranked probable list
│       └── Next definite: full companion card for the known opponent
└── "You may also meet" (collapsible; later knockout rounds not already promoted)
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
- **Exclude rounds already promoted** into the main matchup list (definite next or probable-next slot) — see progressive states below

```typescript
type DrawScoutLaterOpponent = {
  opponentSide: DrawPlayer[]   // 1 = singles, 2 = pair
  disciplineCode: string
  roundLabel: string
  probability: number        // 0–1; same discipline + round sums to 1
}
```

### Progressive states (in-tournament)

As scores arrive, matchup cards and knockout placement evolve. **Same UI for own draw and someone else’s** — results are always shown (especially useful when scouting a friend).

| State | When | UI |
|-------|------|-----|
| **Upcoming** | Match not played | Full scout card (names, ratings, notes / past games) |
| **Played** | Result recorded | Compact card: **Win/Loss** + score headline, shorter names (no ratings), still expandable for notes |
| **Next — probable** | Advanced; bracket opponent unsettled | Promoted into main list under the round label; “Next up · opponent TBD” + ranked probable opponents (probability badges; top 2 + show more) |
| **Next — definite** | Advanced; opponent known | Promoted into main list as a normal full companion card (no probability badge) |

Played group cards **stay visible** (compact) — they are not collapsed into a hidden accordion.

Promotion rules:

1. When a knockout round becomes the player’s next match, add it to `disciplineGroups.matchups` (not only under “You may also meet”).
2. If the opponent is known → definite matchup (`opponentSide` filled).
3. If the opponent is unsettled → `opponentPending: true` + `probableOpponents[]`.
4. Remove that round from `laterOpponentsByEntrant` for the discipline (UI also filters promoted rounds as a safety net).

#### Prototype fixture story (Simon’s Cambs draw)

One competition, three disciplines, three stages in one scroll:

| Discipline | Group stage | Quarter-final |
|------------|-------------|---------------|
| **Open Singles (OS)** | Unplayed — full upcoming cards | Still under “You may also meet” |
| **Open Doubles (OD)** | Both played (compact wins) | Promoted **probable** next |
| **Mixed Doubles (XD)** | Both played (compact wins) | Promoted **definite** next (Tom & Lucy) |

### Freshness & cross-discipline status

Tournaments often run disciplines concurrently, and results feeds vary from near-live to sporadic. Draw companion surfaces **what we know**, with freshness always visible so status claims are trusted.

#### A — Results freshness (always)

Sit directly under the competition / “whose draw” controls.

| Cadence | Copy |
|---------|------|
| Any | `Results last updated {relative time}` (e.g. `14 min ago`, `2 hr ago`) |
| `sporadic` | Append `· scores may lag` |
| `live` / `frequent` | No lag caveat |

Never label the draw “live” unless `updateCadence === 'live'`.

#### B — Path until opponent decided (TBD next only)

Per-opponent path status on each probable row (group games remaining / next round cue) — not a section-level “Opponent decided after…” lead-in under the round header.

#### C — Cross-discipline busy banner (high visual weight)

Show on **upcoming definite** matchups and **probable** opponent rows when a named opponent is still active in another discipline at this competition.

| Rule | Detail |
|------|--------|
| Placement | Directly under that opponent’s name/pair row (not above the round) |
| Visual | Callout strip: strong border + tinted background + bold lead line (stronger than notes/games badges) |
| Lead (fresh) | `{Name} still playing {code}` e.g. `Lucy still playing OS` |
| Lead (stale, ≥2 hr since last update) | `As of {relative}: {Name} still in {code}` |
| Support | `{round} next` e.g. `QF next` · optional freshness (`14 min ago`) |
| Hide when | Match already played vs them; person finished that discipline; insufficient data |

Do **not** invent a remaining-match count for knockouts (wins extend the path). Prefer the **next round** cue instead.

#### Data (prototype)

```typescript
type DrawUpdateCadence = 'live' | 'frequent' | 'sporadic'

type DrawPlayerBusyStatus = {
  disciplineCode: string       // e.g. "OS"
  nextRoundShort: string       // e.g. "QF", "SF", "Group"
}

// on DrawScoutCompetition:
resultsLastUpdatedAt?: string // ISO datetime
updateCadence?: DrawUpdateCadence
busyPlayersByName?: Record<string, DrawPlayerBusyStatus>

// on DrawMatchup when opponentPending:
gamesUntilOpponentDecided?: number
opponentDecidedBlocker?: { playerName: string; disciplineLabel: string }
```

**Prototype cues (Simon’s Cambs):** freshness ~14 min ago · frequent; OS Callum → still playing OD; OD QF TBD → `~2 more games` + per-probable path lines (`1 group game remaining · 14 min ago`, …); XD QF Tom & Lucy definite (no cross-discipline busy — they’ve advanced).

#### Probable-opponent path status

Under each **Next — probable** candidate (same discipline you’re waiting on):

| Situation | Example |
|-----------|---------|
| Still in groups | `1 group game remaining · 14 min ago` |
| Through to a knockout round | `QF next · 14 min ago` |

Do not invent remaining knockout match counts. Cross-discipline busy banners (red) remain separate when someone is still active in another event.

---

## Part 3 — Visibility & lifecycle

### When Companion appears on the tournament page

The Companion stage chip is shown when the visitor is:

1. **Premium**, **or**
2. **Gift-eligible** (~1 in 10 non-Premium when their set BE number is entered)

Otherwise the stage bar shows Entries / Groups / Finals only — page otherwise unchanged.

Within the companion, competition lists still follow draw lifecycle (published, not yet expired — see below).

### Expiry rule

Remove a competition from active picker lists when **both** are true:

1. The competition has finished (last match day over), **and**
2. That competition’s **weekend** has passed (last calendar day of the event’s weekend)

Use whichever boundary is **later**. No grace period beyond the weekend — no historical draw browsing. Competition search and pickers only surface **upcoming** and **in-progress** events.

### Entry points

| Entry | When | Behaviour |
|-------|------|-----------|
| **Companion stage chip** | Premium or gift on tournament page | Selects Companion stage; page content swaps to draw companion |
| **In-companion competition picker** | Companion stage open | Switch between active competitions; defaults to user’s comp when available |
| **Email CTA** | Draw-out notification | Deep link opens tournament page Companion stage for that competition |

---

## Part 4 — Deep links & URL params

### Query parameters

| Param | Example | Behaviour |
|-------|---------|-----------|
| `tab` | `notes` | Activate Notes dashboard tab |
| `draw` | `cambridgeshire-senior-bronze-july-2026` | Select competition in draw companion card |
| `player` | `Sara%20Moore` | Optional; select player in player picker. Default: self if entered |

Example email CTA:

```text
https://badminfo.com/player/{playerId}?tab=latest-event&draw=cambridgeshire-senior-bronze-july-2026
```

Prototype app can read the same params from `window.location.search` or integrate with `DashboardNavigationContext` (extend tab routing similarly to existing section deep links).

---

## Part 5 — Data model (prototype)

Until a live draw API exists, drive the card from mock data in `src/lib/drawScoutPreviewData.ts`.

```typescript
type DrawMatchResult = {
  outcome: 'win' | 'loss'
  scoreSummary: string // e.g. "21-18, 19-21, 21-15"
}

type DrawProbableOpponent = {
  opponentSide: DrawPlayer[]
  probability: number
}

type DrawMatchup = {
  id: string
  roundLabel: string
  yourSide: DrawPlayer[]
  opponentSide: DrawPlayer[]
  result?: DrawMatchResult           // compact played card
  opponentPending?: boolean          // next slot, opponent TBD
  probableOpponents?: DrawProbableOpponent[]
  gamesUntilOpponentDecided?: number
  opponentDecidedBlocker?: { playerName: string; disciplineLabel: string }
}
```

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
  /** ISO datetime of last results ingest */
  resultsLastUpdatedAt?: string
  updateCadence?: 'live' | 'frequent' | 'sporadic'
  /** Players still active in another discipline (keyed by full name) */
  busyPlayersByName?: Record<string, DrawPlayerBusyStatus>
}

type DrawScoutEntrant = {
  name: string
  isYou?: boolean
  isFavourite?: boolean
  disciplineGroups: DrawDisciplineGroup[] // same shape as email (no notes)
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
| `DrawCompanionStageBar` | Stage chips including Companion (Premium/gift only) |
| `DrawCompanionContent` | Gift banner + mounts `DrawScoutCard` |
| `DrawScoutCard` | Card shell, competition + player state |
| `DrawScoutCompetitionPicker` | Dropdown + search |
| `DrawScoutPlayerPicker` | Combobox with favourites section |
| `DrawScoutMatchupBlock` | One round row + nested notes |
| `DrawScoutLaterSection` | Per-discipline “You may also meet” grouped by round |
| `TournamentPagePreview` / `TournamentPageMock` | Prototype of public tournament page + Companion stage |

Extract shared note row rendering from `OpponentNotesSection` if needed to avoid duplication (`DrawScoutNoteList` or shared `NoteEntry`).

---

## Part 7 — Implementation checklist

### Email (can ship independently)

- [x] Slim `DrawOutEmailData` type
- [x] Update `draw-out.html` + test JSON
- [x] Update `DrawOutEmail.tsx` preview
- [x] Update `notificationPreviewData.ts` comments

### Draw companion (prototype)

- [x] Add `drawScoutPreviewData.ts` with 1–2 competitions (reuse matchup data from current `drawOutPreview`)
- [x] Implement `isDrawScoutCompetitionActive()`
- [x] Build `DrawScoutCard` + pickers
- [x] Wire notes from `useOpponentNotesContext()`
- [x] Tournament page preview with Companion stage chip (inline content swap)
- [x] Premium / Gift / Hidden visibility states
- [ ] Production deep link into tournament page Companion stage
- [ ] Live draw API integration

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
| Card title | Draw companion |
| Player picker label | Whose draw |
| Competition picker label | Competition |
| Viewing other player | Viewing **{name}**’s draw — your notes on their opponents |
| Later section title | You may also meet |
| Later section helper | Entered this draw but not in their group — you could face them in the knockouts. |
| Stage chip | Companion |
| Empty player | Choose a player… |
| No notes on opponent | (omit row, or muted “No notes yet”) |
| Freshness | Results last updated {relative} |
| Freshness (sporadic) | Results last updated {relative} · scores may lag |
| Path status (group) | ~{n} group games left |
| Path status (knockout) | {round} next |
| Busy banner (fresh) | {Name} still playing {code} |
| Busy banner (stale) | As of {relative}: {Name} still in {code} |
| Busy banner support | {round} next · {relative} |

---

## Open questions (deferred)

| Topic | Decision |
|-------|----------|
| Server note sync for email count | Required for production email; prototype uses client-side count from mock + localStorage |
| Live draw API shape | Map 1:1 onto `DrawScoutCompetition` when available |
| Favourites list source | Prototype: mock names flagged `isFavourite`; production: user favourites service |
| Competition search scope | **Decided:** upcoming and in-progress only |
| Tournament page placement | **Decided:** Companion stage chip (inline content swap, not modal) |

---

## ASCII — final layout

```
┌─────────────────────────────────────────────────┐
│ Tournament page                                 │
├─────────────────────────────────────────────────┤
│ ┌─ Tournament info card ───────────────────────┐ │
│ │ Cambridge CSBC Senior Tier 4 · …             │ │
│ └──────────────────────────────────────────────┘ │
│ Categories: All · OS · WS · OD · WD · XD         │
│ Stage: Entries · Groups · Finals · Companion ★   │
│                                                  │
│ ┌─ DRAW COMPANION ─────────────────────────────┐ │
│ │ Competition  [ Cambs Senior Bronze · 12 Jul ▼]│
│ │ Whose draw   [ Simon Parker (you)            ▼]│
│ │ ★ Sara  ★ Martin  ★ +N more                  │ │
│ │                                              │ │
│ │ ● Mixed Doubles · Group A                    │ │
│ │   …matchup cards…                            │ │
│ │   You may also meet                          │ │
│ │     Quarter-finals · 45% Tom & Lucy …        │ │
│ └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Prototype matchup fixtures (Simon’s Cambs draw):** progressive states — Singles unplayed; Doubles compact group results + probable QF; Mixed compact group wins + definite QF (Tom & Lucy). Intel mix retained: notes-only (Murray), both (Dan & Alisha), games-only (Gilhooly & Mayfield), neither (Chris Nolan & Alex Reid).

**Notes accent:** soft amber on the View notes badge, Notes tab indicator, and “Note from this game” labels. Brand purple remains for clickable chrome (selected chips, primary buttons).
