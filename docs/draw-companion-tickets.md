# Draw companion — engineering tickets

Share each ticket below as its own GitHub issue. Attach the matching screenshots to every ticket.

**Product:** Draw companion on the public tournament page  
**Out of scope for this whole set:** opponent notes, note badges/tabs, share/export, email changes  
**Audience:** Engineer building from design (screenshots + this text). Do not assume an existing codebase.

**Suggested order:** 1 → 2 → 3 → 4 → 5 → 6 → 7

---

## Ticket 1 — Companion stage chip on the tournament page

### Goal
Add a **Companion** chip to the tournament page stage bar. Selecting it swaps the main content area to Draw companion.

### Context
The tournament page already has stage chips such as **Entries · Groups · Finals**. Companion sits alongside those and behaves the same way: one selected stage at a time; content under the stage bar changes.

### Visibility
| Visitor | Companion chip |
|---------|----------------|
| Premium | Always shown |
| Gift (rare non-Premium) | Shown |
| Everyone else | Hidden — stage bar unchanged |

When gift users open Companion, show a small one-off gift banner above the companion content (screenshot). Premium users see no gift banner.

### Behaviour
1. Companion chip label: **Companion**, with a small crown icon (Premium/gift cue).
2. Selecting Companion selects that stage and loads Draw companion content below.
3. Selecting Entries / Groups / Finals restores that stage’s existing content.
4. Selected chip uses the same selected styling as other stage chips.

### Acceptance criteria
- [ ] Companion appears only for Premium and gift visitors
- [ ] Clicking Companion swaps page content (inline, not a modal)
- [ ] Gift visitors see the gift banner; Premium do not
- [ ] Matches stage-bar screenshots

### Out of scope
Draw list content, player picker, match history, notes.

### Screenshots
_Attach: stage bar with Companion; Companion selected; gift banner; Premium without gift banner._

---

## Ticket 2 — Show the player’s draw (read-only cards)

### Goal
Under Companion, show the signed-in player’s draw for this tournament: disciplines, rounds, and matchups — **no expand/collapse, no past games, no notes**.

### Layout (top → bottom)
1. Title: **Draw companion**
2. Optional freshness line if data available: `Results last updated {relative time}` (e.g. `14 min ago`). If update cadence is sporadic, append `· scores may lag`.
3. For each discipline the player is entered in:
   - Discipline heading (e.g. Open Singles) with colour cue
   - For doubles/mixed: partner line under the heading (e.g. `Simon Parker & Sara Moore`)
   - Round sections (e.g. Group A, Quarter-finals)
   - One card per matchup

### Matchup card (upcoming only for this ticket)
- Both sides: player name(s); ratings when available
- Singles = one name per side; doubles/mixed = pair (`Name & Name`)
- Flat card — **not** an accordion; no chevron; not clickable to expand
- No past-game teasers, notes badges, busy banners, or result styling yet

### Round headers
- Distinguish **played** rounds vs the **up next** round visually (screenshot)
- Played group cards stay visible in the list (do not hide completed rounds)

### Default player
Show the signed-in player’s draw when they are entered. If they are not entered, show an empty/placeholder state until Ticket 3.

### Acceptance criteria
- [ ] All entered disciplines render with correct matchups
- [ ] Cards are static (no accordion)
- [ ] No notes or match-history UI
- [ ] Matches draw-structure screenshots

### Depends on
Ticket 1

### Out of scope
Player switching, accordion, completed Win/Loss card, busy banner, “You may also meet”, notes.

### Screenshots
_Attach: full draw for one player across disciplines; upcoming matchup cards; round headers._

---

## Ticket 3 — Choose whose draw to view

### Goal
Let the user view **any entrant’s** draw in this tournament via a **Whose draw** control. Favourites are easier to reach than the full field.

### Control
- Label: **Whose draw**
- Combobox / search input; placeholder when empty: `Choose a player…`
- Typing filters entrants in this competition

### List order (when opened, no/light filter)
1. **You** — signed-in player, if entered (label like `Simon Parker (you)`)
2. **Favourites** — favourites entered in this draw (gold star)
3. **All players** — remaining entrants

### Quick chips (under the combobox)
- **You** chip when entered
- At most **2** favourite name chips (keep the selected favourite visible when possible)
- If more favourites exist: **★ +N more** opens the combobox — never a long chip row

### Defaults
- Default to **You** when entered
- Else leave unselected / `Choose a player…`

### Context line
When viewing someone other than yourself:

> Viewing **{Name}**’s draw — prep for their opponents

(Do not mention notes.)

### Behaviour
- Changing player reloads the draw below for that entrant
- Same card layout as Ticket 2
- Viewing another player does **not** change whose results/history identity is “you” later — that comes in Ticket 4

### Acceptance criteria
- [ ] Can select self, a favourite, or any entrant
- [ ] List sections and stars match design
- [ ] Chip row caps at You + 2 favourites + overflow control
- [ ] Context line only when not viewing self
- [ ] Matches picker screenshots

### Depends on
Ticket 2

### Out of scope
Notes, match history, completed cards, busy banner, “You may also meet”.

### Screenshots
_Attach: combobox open (You / Favourites / All); chips; viewing another player’s draw + context line._

---

## Ticket 4 — Past match history under each draw matchup

### Goal
Turn each **upcoming** draw matchup into an accordion. Expanding it shows the signed-in user’s **past games** against that opponent (or either player in a doubles pair).

### Accordion rules
- Chevron on the card; tap header to expand/collapse
- Only expandable when there is at least one past game vs the opponent side
- If no past games: keep the flat card (no chevron), same as Ticket 2
- Optional teaser on the closed card when games exist (e.g. `3 previous games`) — screenshot

### Expanded content
- List past matches vs:
  - the pair as a unit when relevant, and/or
  - each individual on the opponent side
- Reuse the product’s existing past-match / head-to-head presentation where one exists; otherwise a clear list: event, score, win/loss, date
- History is always from the **signed-in user’s** perspective — even when Whose draw is a friend

### Doubles / mixed
Show history for the pair and for each named opponent when data exists (screenshot).

### Acceptance criteria
- [ ] Matchups with history expand; those without stay flat
- [ ] Expanded panel shows past games only (no notes UI)
- [ ] Works for singles and doubles/mixed
- [ ] Works when viewing another player’s draw (history still = signed-in user vs those opponents)
- [ ] Matches accordion screenshots

### Depends on
Ticket 3

### Out of scope
Notes tabs/badges, completed Win/Loss draw card (Ticket 5), busy banner, “You may also meet”.

### Screenshots
_Attach: closed card with games teaser; expanded singles; expanded doubles with pair + individuals._

---

## Ticket 5 — Completed match card (Win / Loss + score)

### Goal
When a draw match has a result, replace the upcoming scout card with the **compact completed** card from the design.

### When to use
| State | Card |
|-------|------|
| Not played | Upcoming card (Tickets 2–4) |
| Result recorded | Compact completed card |

### Completed card content
- Clear **Win** or **Loss** for the viewed entrant’s side
- Score summary (e.g. `21-18, 19-21, 21-15`)
- Shorter name treatment; **no ratings** on the compact card
- Still expandable for past-game history when Ticket 4 data exists
- Played cards **remain in the list** (compact) — do not remove or collapse the whole round away

### Round progression (same scroll)
As the tournament advances, a discipline can show mixed states in one view — e.g. compact completed group games, then an upcoming or next knockout card. Match the progressive fixture screenshots.

### Acceptance criteria
- [ ] Played matchups use compact Win/Loss + score design
- [ ] Unplayed matchups stay on the upcoming card
- [ ] Completed cards can still expand for history when available
- [ ] Matches completed-card screenshots

### Depends on
Ticket 4 (history expand). Can soft-depend on Ticket 2 only if shipping completed cards before history — prefer after 4.

### Out of scope
Notes, busy banner, probable-opponent lists, “You may also meet”.

### Screenshots
_Attach: Win card; Loss card; mixed discipline with completed + upcoming; expanded completed card._

---

## Ticket 6 — “Still playing” cross-discipline busy banner

### Goal
On relevant opponent rows, show a high-visibility callout when that opponent is **still active in another discipline** at this tournament.

### Where it appears
- Upcoming **definite** matchups (under the opponent name/pair)
- Later / probable opponent rows once those exist (Ticket 7)
- **Not** on completed (played) matchups vs that person

### Visual
Callout strip: strong border + tinted background + bold lead line — heavier than history teasers (screenshot).

### Copy
| Condition | Lead | Support |
|-----------|------|---------|
| Fresh results | `{FirstName} still playing {disciplineCode}` e.g. `Lucy still playing OS` | `{round} next` e.g. `QF next`, optionally `· {relative time}` |
| Stale results (≥ ~2 hours since last update) | `As of {relative}: {FirstName} still in {code}` | `{round} next` |

### Hide when
- Match already played vs them
- Person has finished that other discipline
- Insufficient data

Do **not** invent remaining knockout match counts. Prefer next-round cues (`QF next`, `SF next`).

### Acceptance criteria
- [ ] Banner shows only when opponent is busy elsewhere
- [ ] Placement and visual weight match design
- [ ] Fresh vs stale copy rules applied
- [ ] Hidden for played matchups and finished opponents
- [ ] Matches busy-banner screenshots

### Depends on
Ticket 2 (matchup cards). Ideally after Ticket 5 so played cards correctly omit the banner.

### Out of scope
Notes, full “You may also meet” section (Ticket 7 can reuse this banner on its rows).

### Screenshots
_Attach: banner on upcoming card; doubles with one busy player; stale variant if available._

---

## Ticket 7 — “You may also meet” (knockout probabilities)

### Goal
Per discipline, add a collapsible **You may also meet** section listing knockout opponents the viewed player might face later, ranked by probability. Also support the **next match / opponent TBD** case when the bracket opponent is not settled yet.

### Section chrome
- Own draw title: **You may also meet**
- Someone else’s draw: **{FirstName} may also meet**
- Helper: possible knockout opponents, most likely first (screenshot)
- Collapsible section

### Organisation
1. Group by **round** (Quarter-finals, Semi-finals, Final, …)
2. Within a round, sort by **probability** (highest first)
3. Probabilities in a round should sum to ~100%
4. Show top **2** opponents per round; **Show more** / **Show less** for the rest

### Opponent row
- Leading probability badge (e.g. `53%`)
- Opponent name(s)
- Optional path status under the name when waiting on their bracket (e.g. `1 group game remaining · 14 min ago` or `QF next · 14 min ago`)
- Busy banner from Ticket 6 when applicable
- Expandable for past games when history exists (same rules as Ticket 4); if none: muted `No notes or games yet` is fine as empty copy, or simply non-expandable — **no notes feature**

### Exclude promoted rounds
If a knockout round is already shown in the main draw list as the player’s next match (definite opponent **or** opponent TBD), **do not** also list that round under “You may also meet”.

### Next match — opponent TBD (probable next)
When the viewed player has advanced but the opponent is unsettled, promote that round into the main matchup list:
- Header/copy: next up, **opponent TBD**
- Ranked probable opponents with probability badges (top 2 + show more)
- Path status on each candidate row
- Same expand/history and busy-banner rules as above

When the opponent becomes known, replace with a normal definite upcoming card (Ticket 2/4).

### Acceptance criteria
- [ ] Per-discipline collapsible section with round groups + probabilities
- [ ] Top 2 + show more per round
- [ ] Promoted next rounds excluded from the section
- [ ] Opponent-TBD next slot works in the main list
- [ ] History expand and busy banner reuse prior tickets
- [ ] Matches “You may also meet” and probable-next screenshots

### Depends on
Tickets 4–6 recommended (history + completed + busy). Minimum: Ticket 2–3 for structure/picker.

### Out of scope
Notes, sharing, email CTA.

### Screenshots
_Attach: collapsed/expanded section; probability rows; show more; opponent TBD next; definite next with section excluding that round._
