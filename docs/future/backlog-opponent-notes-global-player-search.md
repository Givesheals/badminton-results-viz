# Backlog: global player search for direct opponent notes

**Status:** Future work (not in prototype)  
**Suggested owner:** Chris  
**Related:** [Opponent notes spec](./opponent-notes-spec.md)

---

## Context

The Notes tab now supports **Add note** → pick an opponent → write a scouting note without tying it to a specific match (`buildDirectNoteContext()` in `src/lib/opponentNotes.ts`).

In the prototype, the opponent picker (`OpponentPickerModal`) only lists players who appear in the user’s imported match history (`collectKnownOpponentNames()`).

---

## Product requirement

Users should be able to add a scouting note about **any player in existence**, not only opponents they have already played.

Examples:

- Preparing for a drawn opponent they have never met
- Notes from watching another court / external scouting
- Notes passed on by a partner about someone outside the user’s dataset

---

## Prototype limitation

| Today | Future |
|-------|--------|
| Search opponents from imported spreadsheet rows | Search full player registry / club database / external API |
| `collectKnownOpponentNames(allMatches)` | Global player lookup with typeahead |
| No player creation if not found | Optional “add player by name” fallback |

---

## Suggested implementation notes

1. **Player lookup API** — typeahead endpoint returning `{ id, displayName, club? }`; debounced search in `OpponentPickerModal`.
2. **Fallback** — if no match, allow free-text name entry (creates a local-only player stub until registry sync exists).
3. **Direct note context** — continue using `buildDirectNoteContext(name)`; no change to storage shape required.
4. **Privacy / data source** — confirm which player directory Chris’s backend exposes (county, national, club-only).

---

## Acceptance criteria (draft for ticket)

- [ ] Opponent picker searches beyond imported match history
- [ ] Results show players the user has never played
- [ ] Selected player opens the existing note compose modal (single-player target, discipline families)
- [ ] Empty search state explains difference between “no history” vs “no registry match”
- [ ] Document sync behaviour if player later appears in imported results

---

## UI entry point

Notes tab → **Add note** → `OpponentPickerModal` → `OpponentNoteModal`

No change to Events-tab match-row capture flow.
