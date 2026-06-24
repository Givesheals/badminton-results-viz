# Opponent scouting notes — Technical specification

**Product:** Badminton Results Viz  
**Audience:** Engineers extending opponent note capture, review, or future rematch serving.  
**Last updated:** June 2026  

---

## Summary

Players can capture **free-text scouting notes** on opponents from tournament recap match rows. Notes are stored in **localStorage** per player name and can be reviewed on the **Notes** dashboard tab.

Notes are tied to a specific match (competition, date, discipline, partner, opponents) and support ambiguous doubles targeting: notes can apply to **the pair** or be assigned to a **specific opponent** retrospectively.

---

## Scope (v1)

| In scope | Out of scope |
|----------|--------------|
| Capture/edit modal from recap match rows | Draw/rematch notification prompts |
| Notes dashboard tab with search | Inline notes on opponent matchups |
| localStorage persistence per player | Server sync |
| Pair vs individual opponent targeting | |

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
  createdAt: string   // ISO timestamp
  updatedAt: string
}
```

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

### Modal (`OpponentNoteModal`)

| State | Behaviour |
|-------|-----------|
| Create | Empty textarea; target picker (doubles only); switching targets loads that target's note |
| Edit | Pre-filled body for selected target; Save / Cancel / Delete |
| Target picker | “The pair” / individual opponent names; dot indicates another target already has a note |

Uses centered `Modal` component (`src/components/ui/Modal.tsx`).

### Notes tab

Dashboard tab **Notes** (`OpponentNotesSection`):

- Notes grouped by opponent name (pair notes appear under each player in the pair)
- Each note shows the note body in quotation marks with minimal chrome; pair notes include a muted **About the pair** line
- **Recorded** line shows create/edit timestamps; a **View match result** control expands the full match scoreboard
- **Edit** uses the same purple note icon as the Events tab
- Match footer uses tournament category chip, discipline chip, and nemeses-style scoreboard row
- Search by opponent, competition, or note text
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

- `src/lib/opponentNotes.test.ts` — storage key, targeting, upsert, lookup, search

---

## Future integration

When a draw/rematch feature exists (possibly outside this app):

```typescript
const relevant = sortNotesNewestFirst(
  getNotesForOpponent(allNotes, drawnOpponentName),
)
```

Show `relevant` in a notification or pre-match prompt. No v1 UI for this path is required; the lookup contract is stable.
