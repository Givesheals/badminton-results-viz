import {
  getNotesForOpponent,
  isScoutingNote,
  noteHasStoredContent,
  sortNotesNewestFirst,
  type OpponentNote,
} from './opponentNotes'

function demoNote(
  id: string,
  opponentName: string,
  body: string,
  options: {
    tags?: OpponentNote['tags']
    competitionName?: string
    date?: string
    discipline?: string
    opponentNames?: string[]
    opponentsDisplay?: string
    target?: OpponentNote['target']
    appliesToDisciplines?: string[]
  } = {},
): OpponentNote {
  const opponentNames = options.opponentNames ?? [opponentName]
  return {
    id: `draw-scout-demo:${id}`,
    body,
    target: options.target ?? { kind: 'opponent', name: opponentName },
    appliesToDisciplines: options.appliesToDisciplines,
    tags: options.tags,
    context: {
      matchKey: `draw-scout-demo\\0${id}`,
      competitionName: options.competitionName ?? 'Norfolk Restricted 2025',
      date: options.date ?? '2025-09-14',
      discipline: options.discipline ?? 'XD',
      disciplineLabel: 'Mixed doubles',
      partnerName: 'Sara Moore',
      opponentNames,
      opponentsDisplay: options.opponentsDisplay ?? opponentNames.join(' & '),
      roundLabel: 'Group A',
      outcome: 'win',
      scoreSummary: '21-15, 21-18',
    },
    createdAt: '2025-09-15T10:00:00.000Z',
    updatedAt: '2025-09-15T10:00:00.000Z',
  }
}

/** Demo personal notes for the draw scout prototype (Cambs Jul 2026 draw). */
export const drawScoutDemoNotes: OpponentNote[] = [
  demoNote(
    'murray',
    'Murray Wright',
    'Loves to intercept at the net - keep lifts tight and deep. Struggles when pushed to his rear forehand corner.',
    {
      competitionName: 'Norfolk Restricted 2025',
      date: '2025-09-14',
      discipline: 'MD',
      tags: {
        customOpponentStyles: ['Aggressive', 'Strong at the net'],
      },
      appliesToDisciplines: ['D'],
    },
  ),
  // Murray is notes-only in the Cambs draw prototype (no prior meeting in demo matches).
  demoNote(
    'dan',
    'Dan Martyres',
    'Big flat game, rushes you early. Slow to the net though - drops off the serve caused problems.',
    {
      competitionName: 'Suffolk Bronze 2026',
      date: '2026-02-02',
      tags: { customOpponentStyles: ['Fast, flat attack'] },
      target: { kind: 'pair' },
      opponentNames: ['Dan Martyres', 'Jane Smith'],
      opponentsDisplay: 'Dan Martyres & Jane Smith',
    },
  ),
  demoNote(
    'dan-alisha-pair',
    'Dan Martyres',
    'They poach constantly as a pair — expect early interceptions. Attack Alisha’s backhand corner to break their rhythm; Dan overcovers mid-court when she is under pressure.',
    {
      competitionName: 'Bedfordshire Bronze 2026',
      date: '2026-04-12',
      discipline: 'XD',
      tags: { customOpponentStyles: ['Poaching pair', 'Strong mid-court'] },
      target: { kind: 'pair' },
      opponentNames: ['Dan Martyres', 'Alisha Johnson'],
      opponentsDisplay: 'Dan Martyres & Alisha Johnson',
      appliesToDisciplines: ['XD'],
    },
  ),
  demoNote(
    'alisha',
    'Alisha Johnson',
    'Quick hands at the net and loves the soft kill. Clears can float when rushed — lift deep to her reverse side.',
    {
      competitionName: 'Norfolk Restricted 2025',
      date: '2025-09-14',
      discipline: 'XD',
      tags: { customOpponentStyles: ['Net killer', 'Soft hands'] },
      opponentNames: ['Alisha Johnson', 'Tom Fielding'],
      opponentsDisplay: 'Alisha Johnson & Tom Fielding',
    },
  ),
  demoNote(
    'daniel-1',
    'Daniel Hughes',
    'Huge smash but predictable - defend cross-court and he tires. Weak backhand under pressure.',
    {
      competitionName: 'Cambridgeshire Bronze 2025',
      date: '2025-11-09',
      discipline: 'OD',
      tags: { customOpponentStyles: ['Big smash', 'Slow around the court'] },
    },
  ),
  demoNote('daniel-2', 'Daniel Hughes', 'Serves short almost every time - stand in and attack it.', {
    competitionName: 'Cambridgeshire Bronze 2025',
    date: '2025-11-09',
    discipline: 'OD',
  }),
  demoNote(
    'ben',
    'Ben Carter',
    'Great deception at the net, sells the dummy. Backhand clear is short - attack it early.',
    {
      competitionName: 'Essex Bronze 2026',
      date: '2026-01-18',
      tags: { customOpponentStyles: ['Deceptive', 'Weak backhand clear'] },
    },
  ),
  demoNote(
    'tom',
    'Tom Fielding',
    'Very patient defender, happy to rally all day. Force the pace and bring him to the net.',
    {
      competitionName: 'Essex Open 2026',
      date: '2026-03-03',
      tags: { customOpponentStyles: ['Defensive'] },
    },
  ),
]

function opponentNamesFromNote(note: OpponentNote): string[] {
  if (note.target.kind === 'opponent') return [note.target.name]
  return note.context.opponentNames
}

/** User notes win; demo notes fill gaps so the draw scout prototype is never empty. */
export function mergeDrawScoutDisplayNotes(userNotes: OpponentNote[]): OpponentNote[] {
  const covered = new Set<string>()
  for (const note of userNotes) {
    if (!isScoutingNote(note) || !noteHasStoredContent(note)) continue
    for (const name of opponentNamesFromNote(note)) {
      covered.add(name.trim().toLowerCase())
    }
  }

  const supplemental = drawScoutDemoNotes.filter((demo) => {
    const names = opponentNamesFromNote(demo)
    return names.some((name) => !covered.has(name.trim().toLowerCase()))
  })

  return sortNotesNewestFirst([...userNotes, ...supplemental])
}

export function isDrawScoutDemoNote(note: OpponentNote): boolean {
  return note.id.startsWith('draw-scout-demo:')
}

export function opponentHasDrawScoutNotes(
  displayNotes: OpponentNote[],
  opponentName: string,
): boolean {
  return getNotesForOpponent(displayNotes, opponentName).some(
    (note) => isScoutingNote(note) && noteHasStoredContent(note),
  )
}
