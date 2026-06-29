# Opponent scouting notes — Technical specification

**Product:** Badminton Results Viz  
**Audience:** Engineers extending opponent note capture, review, or future rematch serving.  
**Last updated:** June 2026  

---

## Summary

Players can capture **free-text scouting notes** on opponents from tournament recap match rows. Notes are stored in **localStorage** per player name and can be reviewed on the **Notes** dashboard tab.

Notes are tied to a specific match (competition, date, discipline, partner, opponents) and support ambiguous doubles targeting: notes can apply to **the pair** or be assigned to a **specific opponent** retrospectively. Each note also declares which **discipline(s)** the scouting insight applies to when facing that opponent again.

---

## Scope (v1)

| In scope | Out of scope |
|----------|--------------|
| Capture/edit modal from recap match rows | Draw/rematch notification prompts |
| Notes dashboard tab with search | Inline notes on opponent matchups |
| localStorage persistence per player | Server sync |
| Pair vs individual opponent targeting | |
| Discipline scope selection (all / some / one) | Discipline-filtered note lookup |

---

## Data model

Defined in `src/lib/opponentNotes.ts`.

### `OpponentNoteTarget`

| Variant | Meaning |
|---------|---------|
| `{ kind: 'pair' }` | Note applies to both opponents (default for doubles) |
| `{ kind: 'opponent', name }` | Note is about one named opponent only |

Singles matches auto-assign to the sole opponent.

### `OpponentNoteMatchContext`

Structured match metadata attached to each note:

- `matchKey` — stable identity aligned with `recapMatchKey()` (one note per match)
- `competitionName`, `date`, `discipline`, `disciplineLabel`
- `partnerName`, `opponentNames[]`, `opponentsDisplay`
- `roundLabel`, `outcome`, `scoreSummary`

### `OpponentNote`

```typescript
{
  id: string
  body: string
  target: OpponentNoteTarget
  context: OpponentNoteMatchContext
  appliesToDisciplines?: string[]  // discipline codes; optional for legacy notes
  createdAt: string   // ISO timestamp
  updatedAt: string
}
```

### `appliesToDisciplines`

- Array of discipline codes (`MS`, `WS`, `OS`, `MD`, `WD`, `OD`, `XD`) stored internally, derived from user-facing **Singles**, **Doubles**, and **Mixed** family selections.
- **Default for new notes:** the family of the source match (e.g. an MD match defaults to Doubles).
- **Legacy notes** without the field fall back to the source match discipline family via `getNoteAppliesToDisciplineFamilies(note)`.
- Family selections expand to all codes in that family on save (`disciplineCodesFromFamilies()`).

**Multiple notes per match** — one note per `matchKey` + `target` combination. A doubles match can have separate notes for the pair and each individual opponent.

**One note per target slot.** Reopening the recap button edits notes for that match; switching the target picker loads that opponent's note independently.

---

## Storage

| Key | Value |
|-----|-------|
| `opponent-notes:{playerName}` (lowercased, trimmed) | JSON array of `OpponentNote` |

- Re-importing the same player retains notes.
- Clearing site data resets notes.
- Implemented in `src/hooks/useOpponentNotes.ts`.

---

## Lookup (future rematch serving)

```typescript
getNotesForOpponent(allNotes, drawnOpponentName)
```

Returns notes where:

1. `target.kind === 'opponent'` and `target.name` matches, **or**
2. `target.kind === 'pair'` and `opponentNames` includes the name.

Pair-targeted notes surface when **either** opponent is redrawn. Users can refine assignment via the modal target picker without breaking lookup.

---

## UI

### Capture entry point

`DisciplineMatchRow` shows an `OpponentNoteButton` on every match row in the tournament recap. Filled icon when a note exists; outline when empty.

The **Notes** tab header includes an **Add note** button that opens `OpponentPickerModal` → `OpponentNoteModal` for direct notes about a single opponent (see [future global player search backlog](./future/backlog-opponent-notes-global-player-search.md)).

### Modal (`OpponentNoteModal`)

| State | Behaviour |
|-------|-----------|
| Create | Empty textarea; target picker (doubles only); discipline picker defaulting to source match discipline; switching targets loads that target's note |
| Edit | Pre-filled body and discipline selection for selected target; Save / Cancel / Delete |
| Target picker | “The pair” / individual opponent names; dot indicates another target already has a note |
| Discipline picker | Toggle buttons for **Singles**, **Doubles**, and **Mixed** using discipline family colours; **Select all** / **Clear** shortcuts; at least one family required to save |

Uses centered `Modal` component (`src/components/ui/Modal.tsx`).

### Notes tab

Dashboard tab **Notes** (`OpponentNotesSection`):

- Notes grouped by opponent name (pair notes appear under each player in the pair)
- Each note shows **discipline family badges** (`DisciplineFamilyChip`: Singles / Doubles / Mixed) inline on the **Recorded** metadata line
- Each note shows the note body in quotation marks with minimal chrome; pair notes include a muted **About the pair** line
- **Recorded** line shows create/edit timestamps; a **View match result** control expands the full match scoreboard
- **Edit** uses the same purple note icon as the Events tab
- Match footer uses tournament category chip, source-match discipline chip, and nemeses-style scoreboard row
- Search by opponent, competition, note text, or discipline code/label
- **Edit** opens the same modal used from recap match rows

Tab order: Events → This season → Player summary → People → Notes.

---

## Implementation map

| Concern | Location |
|---------|----------|
| Types, CRUD, lookup | `src/lib/opponentNotes.ts` |
| Match context builder | `buildNoteContextFromMatch()` |
| Recap data extension | `DisciplineMatchRecap.noteContext` in `src/lib/tournamentRecap.ts` |
| Persistence hook | `src/hooks/useOpponentNotes.ts` |
| React context | `src/context/OpponentNotesContext.tsx` |
| Modal UI | `src/components/notes/OpponentNoteModal.tsx` |
| Recap button | `src/components/notes/OpponentNoteButton.tsx` |
| Notes tab | `src/components/notes/OpponentNotesSection.tsx` |
| Dashboard wiring | `src/components/dashboard/Dashboard.tsx` |

---

## Tests

- `src/lib/opponentNotes.test.ts` — storage key, targeting, upsert, discipline scope, lookup, search

---

## Future integration

When a draw/rematch feature exists (possibly outside this app):

```typescript
const relevant = sortNotesNewestFirst(
  getNotesForOpponent(allNotes, drawnOpponentName),
)
```

Show `relevant` in a notification or pre-match prompt. No v1 UI for this path is required; the lookup contract is stable.
