# Opponent notes — Technical specification

**Product:** Badminton Results Viz  
**Audience:** Engineers extending opponent note capture, review, or future rematch serving.  
**Last updated:** July 2026  

---

## Summary

Players can capture **opponent notes** (scouting) and optional **match journal** notes from tournament recap match rows. Notes are stored in **localStorage** per player name and can be reviewed on the **Notes** dashboard tab.

Opponent notes are tied to a specific match and support doubles targeting: notes can apply to **the pair** or a **specific opponent**. Match journal notes apply to **the game itself** (how you played, conditions, partner context) and do not surface on future rematch prompts.

**Tap-to-tag** inputs classify opponent playing styles, pair dynamics (doubles), and journal context. Users can also create **custom tags** remembered per player for quick-add.

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Capture/edit modal from recap match rows | Draw/rematch notification prompts |
| Notes dashboard tab with search | Inline notes on opponent matchups |
| localStorage persistence per player | Server sync |
| Pair vs individual opponent targeting | |
| Match journal (`kind: 'match'`) per game | |
| Built-in + custom tags | Discipline-filtered note lookup |
| Discipline scope on opponent notes (`S` / `D` / `XD`) | |
| Direct notes from Notes tab (no match context) | |

---

## Data model

Defined in `src/lib/opponentNotes.ts`, `src/lib/noteTags.ts`, and `src/lib/customNoteTags.ts`.

### `OpponentNoteTarget`

| Variant | Meaning |
|---------|---------|
| `{ kind: 'pair' }` | Note applies to both opponents as a pair |
| `{ kind: 'opponent', name }` | Note is about one named opponent only |
| `{ kind: 'match' }` | Match journal note about this game (one per `matchKey`) |

Singles matches auto-assign notes to the sole opponent.

Use `MATCH_NOTE_TARGET` constant for the match journal slot.

**Default doubles target:** first opponent name (not the pair).

### `OpponentNoteMatchContext`

Structured match metadata attached to each note:

- `matchKey` — stable identity aligned with `recapMatchKey()`; direct notes use `direct\0…` prefix
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
  appliesToDisciplines?: string[]  // scouting only; S / D / XD (legacy codes collapsed on read)
  tags?: NoteTags
  matchJournal?: MatchJournalFields  // match target only
  createdAt: string
  updatedAt: string
}
```

### `MatchJournalFields`

```typescript
{
  selfReflection?: string  // how I played / what to work on
  gameEvents?: string      // what happened in the game
}
```

Legacy match notes may store diary text in `body` only; readers fall back to `body` for `gameEvents` via `getMatchJournalFields()`.

### `NoteTags`

```typescript
{
  // Built-in (enum-backed)
  opponentStyles?: OpponentStyleTag[]    // opponent target
  pairStyles?: PairStyleTag[]            // pair target (doubles)
  selfFeel?: SelfFeelTag[]              // journal: I was tired, I felt sharp, …
  partnerContext?: PartnerContextTag[]   // journal: partner injured (doubles)
  matchFlow?: MatchFlowTag[]            // journal: we came back, we lost a lead

  // Custom (free-text, per note)
  customOpponentStyles?: string[]
  customPairStyles?: string[]
  customSelfFeel?: string[]
  customGameEvents?: string[]
}
```

Legacy `gameContext` tags are migrated on read to `selfFeel` / `partnerContext`.

**Content rule:** Opponent notes use `noteHasContent(body, tags)`. Match journal notes use `matchJournalHasContent()` across `matchJournal` fields, journal tags, and legacy `body`.

### Discipline scope (`appliesToDisciplines`)

Scouting notes can be scoped to which discipline types the observation applies to when facing that opponent again.

| Scope code | Meaning | Chip styling |
|------------|---------|--------------|
| `S` | Singles (any of MS, WS, OS) | Singles colour |
| `D` | Doubles (any of MD, WD, OD) | Doubles colour |
| `XD` | Mixed doubles | Mixed colour |

**Offered codes:** `SCOUTING_APPLIES_TO_DISCIPLINE_CODES = ['S', 'D', 'XD']`

- Direct notes default to all three.
- Notes from a match row default to the scope matching that match’s discipline family.
- Legacy stored codes (`OS`, `WS`, `OD`, `WD`, `MS`, `MD`, etc.) collapse to `S` / `D` / `XD` on read via `collapseToScoutingScopeCodes()`.
- New saves store `S` / `D` / `XD` only.

Helpers: `getNoteScoutingAppliesToDisciplineCodes()`, `normalizeScoutingAppliesToDisciplineCodes()`, `mapToScoutingAppliesToCode()`.

### Custom tag library (quick-add)

Separate from per-note tag storage. Remembered per player for the `+` quick-add row.

| Key | Value |
|-----|-------|
| `badminton-custom-note-tags:{playerName}` | JSON map of `CustomTagGroup` → `string[]` |

Groups: `opponentStyles`, `pairStyles`, `selfFeel`, `gameEvents`.

| Rule | Value |
|------|-------|
| Max tags per group | 6 |
| Max label length | 24 characters |
| Deduping | Case-insensitive |

Implemented in `src/lib/customNoteTags.ts`.

Bulk updates when renaming or removing a library tag (optional, user-confirmed) are in `src/lib/customTagNoteUpdates.ts` and exposed via `renameCustomTagEverywhere` / `removeCustomTagEverywhere` on the notes context.

---

## Storage

| Key | Value |
|-----|-------|
| `opponent-notes:{playerName}` (lowercased, trimmed) | JSON array of `OpponentNote` |

Implemented in `src/hooks/useOpponentNotes.ts`.

---

## Lookup (future rematch serving)

```typescript
getNotesForOpponent(allNotes, drawnOpponentName)
```

Returns **scouting notes only** (`target.kind !== 'match'`) where:

1. `target.kind === 'opponent'` and `target.name` matches, **or**
2. `target.kind === 'pair'` and `opponentNames` includes the name.

Match journal notes are excluded from rematch lookup.

```typescript
getMatchJournalNotes(allNotes)  // all notes with target.kind === 'match'
```

---

## UI

### Capture entry points

1. **Events tab** — `DisciplineMatchRow` shows `OpponentNoteButton` on every match row (pen icon when notes exist, plus icon when empty). Opens modal with match context.
2. **Notes tab** — **Add note** → opponent picker → modal with `buildDirectNoteContext()` (opponent-notes only; no **My game** tab).

### Modal (`OpponentNoteModal`)

Title: **Add match notes** / **Edit match notes**.

Top-level mode tabs: **About them** | **My game** (game tab hidden for direct notes from the Notes tab).

#### About them tab

- Segmented opponent control (doubles): opponent names first, **The pair** last
- **Combo note box** — textarea with selected tag chips inside the bordered area (tap chip to remove from this note)
- **Quick-add row** below the box: `+ {tag label}` buttons for unselected built-in and remembered custom tags
- **`···` button** at end of quick-add row — opens **Your tags** management panel (see below)
- **Applies to:** collapsed discipline scope — selected `S` / `D` / `XD` chips + **Change** link; expanded picker toggles all three scope chips + **Done**

Playing style tags (built-in + custom) are scoped to opponent vs pair target.

#### My game tab

Two sections, each with the same combo-box + quick-add pattern:

| Section | Text field | Built-in tag groups |
|---------|------------|---------------------|
| **How I played** | Self-reflection textarea | `selfFeel` |
| **What happened** | Game events textarea | `matchFlow` + `partnerContext` (doubles) |

#### Tag interaction model

| Action | Behaviour |
|--------|-----------|
| Tap `+ {label}` below box | Add tag to this note (chip appears inside combo box) |
| Tap chip inside combo box | Remove tag from **this note only** |
| Tap `···` | Open tag management panel |

#### Your tags panel (`···`)

Inline panel for managing the **custom tag library** (not built-in tags):

- **Add** new custom tag (subject to per-group limit)
- **Rename** a custom tag — optional checkbox to also rename on all saved notes that use it (shows count)
- **Remove** from quick-add — optional checkbox to also remove from all saved notes (shows count)

Footer copy explains that removing from quick-add does not change saved notes unless the user opts in.

Save persists both modal modes. Delete is mode-specific: **Delete opponent note** / **Delete game note**.

### Notes tab (`OpponentNotesSection`)

Two areas:

1. **Opponent notes** — grouped by opponent name (pair-scoped notes appear under each player in the pair)
2. **Match journal** — chronological game notes (`getMatchJournalNotes()`), not grouped by opponent

**Review layout:**

- Opponent notes: tag chips above quote text; discipline scope chips (`S` / `D` / `XD`) in metadata row
- Journal entries: **How I played** and **What happened** blocks each show tag chips above quote text when present

Search matches body, journal fields, opponents, competition, disciplines, scope codes, and tag labels.

---

## Implementation map

| Concern | Location |
|---------|----------|
| Types, CRUD, lookup, discipline scope | `src/lib/opponentNotes.ts` |
| Tag catalogues, normalization, display | `src/lib/noteTags.ts` |
| Custom tag library (localStorage) | `src/lib/customNoteTags.ts` |
| Bulk tag rename/remove on notes | `src/lib/customTagNoteUpdates.ts` |
| Tag picker + combo box UI | `src/components/notes/NoteTagPicker.tsx` |
| Modal UI | `src/components/notes/OpponentNoteModal.tsx` |
| Notes tab | `src/components/notes/OpponentNotesSection.tsx` |
| Persistence hook + bulk tag ops | `src/hooks/useOpponentNotes.ts` |
| Discipline chip styling (`S`, `D`, match codes) | `src/lib/disciplineStyle.ts` |

---

## Tests

| File | Coverage |
|------|----------|
| `src/lib/opponentNotes.test.ts` | Targeting, match journal, discipline scope (`S`/`D`/`XD`), grouping, upsert |
| `src/lib/noteTags.test.ts` | Normalization, display, scouting tag scoping, custom tags |
| `src/lib/customNoteTags.test.ts` | Library storage, limits, deduping |
| `src/lib/customTagNoteUpdates.test.ts` | Bulk rename/remove on saved notes |

---

## Future integration

When a draw/rematch feature exists:

```typescript
const relevant = sortNotesNewestFirst(
  getNotesForOpponent(allNotes, drawnOpponentName),
)
```

Match journal notes are intentionally omitted from this path.

See also: [Backlog: global player search for direct opponent notes](future/backlog-opponent-notes-global-player-search.md).
