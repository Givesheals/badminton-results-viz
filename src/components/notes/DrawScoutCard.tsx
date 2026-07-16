import { createPortal } from 'react-dom'
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { getDisciplineFamily } from '../../lib/disciplineStyle'
import {
  filterLaterOpponentsWithViewerIntel,
  formatCompetitionDateRange,
  formatCompetitionPickerLabel,
  formatMatchupIntelTeaser,
  getDefaultCompetitionSlug,
  getDefaultPlayerName,
  getEntrantForCompetition,
  getExactDrawPairNotes,
  getIndividualDrawScoutNotes,
  getMatchupIntelCounts,
  groupLaterOpponentsByRound,
  groupMatchupsByRound,
  listActiveDrawScoutCompetitions,
  shouldAutoShowDrawScoutCard,
  type DrawScoutCompetition,
  type DrawScoutLaterOpponent,
  type LaterOpponentRoundGroup,
} from '../../lib/drawScout'
import {
  mergeDrawScoutDisplayNotes,
} from '../../lib/drawScoutDemoNotes'
import { readDrawScoutDeepLink } from '../../lib/drawScoutDeepLink'
import { drawScoutPreviewCompetitions } from '../../lib/drawScoutPreviewData'
import type { DrawDisciplineGroup, DrawMatchup } from '../../lib/drawTypes'
import { formatScoutingTagsForDisplay } from '../../lib/noteTags'
import {
  formatNoteRecordedSummary,
  formatNoteScopeInGroup,
  getNoteScoutingAppliesToDisciplineCodes,
  type OpponentNote,
} from '../../lib/opponentNotes'
import {
  buildDrawScoutResultMatches,
  getDrawScoutPreviousMatches,
  getDrawScoutPreviousMatchesAgainstOpponentAlone,
  getDrawScoutPreviousMatchesAgainstPair,
  mergeDrawScoutDisplayMatches,
} from '../../lib/drawScoutMatches'
import type { NormalizedMatch } from '../../types/matchHistory'
import { DisciplineChip } from '../discipline/DisciplineChip'
import { DrawMatchupRow } from './DrawMatchupRow'
import { DrawScoutPreviousGames } from './DrawScoutPreviousGames'
import { NoteTagChips } from './NoteTagPicker'
import { recapMatchKey } from '../../lib/tournamentRecap'

const DISCIPLINE_DOT: Record<string, string> = {
  mixed: 'bg-discipline-mixed',
  doubles: 'bg-discipline-doubles',
  singles: 'bg-discipline-singles',
  unknown: 'bg-ink-300',
}

type Props = {
  playerName: string
  allNotes: OpponentNote[]
  allMatches: NormalizedMatch[]
  competitions?: DrawScoutCompetition[]
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-ink-500 transition ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function SwapIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M7.707 3.293a1 1 0 010 1.414L6.414 6H13a1 1 0 110 2H6.414l1.293 1.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zM12.293 11.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L13.586 15H7a1 1 0 110-2h6.586l-1.293-1.293a1 1 0 010-1.414z" />
    </svg>
  )
}

function DrawScoutNoteContent({
  note,
  opponentName,
  drawnCoOpponent,
  hidePairScopeLine = false,
}: {
  note: OpponentNote
  opponentName: string
  drawnCoOpponent: string | null
  hidePairScopeLine?: boolean
}) {
  const scope = formatNoteScopeInGroup(note, opponentName, {
    drawnCoOpponent,
    context: 'draw-scout',
  })
  const tagLabels = formatScoutingTagsForDisplay(note.tags)
  const appliesTo = getNoteScoutingAppliesToDisciplineCodes(note)
  const hasBody = note.body.trim() !== ''
  const pairScopeLine =
    !hidePairScopeLine && scope.kind === 'pair'
      ? scope.secondary != null && scope.secondary !== ''
        ? `${scope.primary} · ${scope.secondary}`
        : scope.primary
      : null

  return (
    <div className="space-y-1.5">
      {tagLabels.length > 0 && <NoteTagChips labels={tagLabels} />}
      {hasBody && (
        <p className="text-sm leading-relaxed text-ink-900">
          <span aria-hidden="true">&ldquo;</span>
          {note.body}
          <span aria-hidden="true">&rdquo;</span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
        {appliesTo.length > 0 && (
          <>
            <span className="flex flex-wrap items-center gap-1">
              {appliesTo.map((code) => (
                <DisciplineChip key={code} code={code} />
              ))}
            </span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span>{formatNoteRecordedSummary(note)}</span>
      </div>
      {pairScopeLine != null && <p className="text-xs text-ink-500">{pairScopeLine}</p>}
    </div>
  )
}

function DrawScoutIntelBlock({
  title,
  notes,
  noteScopeOpponentName,
  drawnCoOpponent,
  hidePairScopeLine = false,
  resultItems,
  previousGamesAriaName,
  autoOpenPreviousGames = false,
  viewingOwnDraw = true,
  disciplineCode,
}: {
  title: string
  notes: OpponentNote[]
  noteScopeOpponentName: string
  drawnCoOpponent: string | null
  hidePairScopeLine?: boolean
  resultItems: ReturnType<typeof buildDrawScoutResultMatches>
  previousGamesAriaName: string
  autoOpenPreviousGames?: boolean
  viewingOwnDraw?: boolean
  disciplineCode?: string | null
}) {
  if (notes.length === 0 && resultItems.length === 0) return null

  return (
    <div className="border-t border-ink-100 pt-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        {disciplineCode != null && <DisciplineChip code={disciplineCode} />}
      </div>
      {notes.length > 0 && (
        <div className="mt-2 space-y-3">
          {notes.map((note) => (
            <DrawScoutNoteContent
              key={note.id}
              note={note}
              opponentName={noteScopeOpponentName}
              drawnCoOpponent={drawnCoOpponent}
              hidePairScopeLine={hidePairScopeLine}
            />
          ))}
        </div>
      )}
      <DrawScoutPreviousGames
        opponentName={previousGamesAriaName}
        items={resultItems}
        defaultOpen={autoOpenPreviousGames}
        hasNotes={notes.length > 0}
        viewingOwnDraw={viewingOwnDraw}
        className={notes.length > 0 ? 'mt-3' : 'mt-2'}
      />
    </div>
  )
}

function OpponentDrawIntelSection({
  opponentName,
  coOpponentName,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  disciplineCode,
  autoOpenPreviousGames = false,
  viewingOwnDraw = true,
}: {
  opponentName: string
  coOpponentName: string | null
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  disciplineCode?: string | null
  autoOpenPreviousGames?: boolean
  viewingOwnDraw?: boolean
}) {
  const notes = useMemo(
    () => getIndividualDrawScoutNotes(displayNotes, opponentName, coOpponentName),
    [coOpponentName, displayNotes, opponentName],
  )
  const previous = useMemo(() => {
    if (coOpponentName != null) {
      return getDrawScoutPreviousMatchesAgainstOpponentAlone(
        displayMatches,
        opponentName,
        coOpponentName,
        playerName,
      )
    }
    return getDrawScoutPreviousMatches(displayMatches, opponentName, playerName)
  }, [coOpponentName, displayMatches, opponentName, playerName])
  const noteMatchKeys = useMemo(
    () => new Set(notes.map((note) => note.context.matchKey)),
    [notes],
  )
  const resultItems = useMemo(
    () => buildDrawScoutResultMatches(previous.matches, noteMatchKeys, matchByKey),
    [matchByKey, noteMatchKeys, previous.matches],
  )

  return (
    <DrawScoutIntelBlock
      title={opponentName}
      notes={notes}
      noteScopeOpponentName={opponentName}
      drawnCoOpponent={coOpponentName}
      resultItems={resultItems}
      previousGamesAriaName={opponentName}
      autoOpenPreviousGames={autoOpenPreviousGames}
      viewingOwnDraw={viewingOwnDraw}
      disciplineCode={disciplineCode}
    />
  )
}

function MatchupNotes({
  matchup,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  autoOpenPreviousGames = false,
  viewingOwnDraw = true,
}: {
  matchup: DrawMatchup
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  autoOpenPreviousGames?: boolean
  viewingOwnDraw?: boolean
}) {
  const opponentA = matchup.opponentSide[0] ?? null
  const opponentB = matchup.opponentSide[1] ?? null

  const pairNotes = useMemo(() => {
    if (opponentA == null || opponentB == null) return []
    return getExactDrawPairNotes(displayNotes, opponentA.name, opponentB.name)
  }, [displayNotes, opponentA, opponentB])

  const pairPrevious = useMemo(() => {
    if (opponentA == null || opponentB == null) {
      return { matches: [] as NormalizedMatch[], isDemo: false }
    }
    return getDrawScoutPreviousMatchesAgainstPair(
      displayMatches,
      opponentA.name,
      opponentB.name,
      playerName,
    )
  }, [displayMatches, opponentA, opponentB, playerName])

  const pairNoteMatchKeys = useMemo(
    () => new Set(pairNotes.map((note) => note.context.matchKey)),
    [pairNotes],
  )
  const pairResultItems = useMemo(
    () => buildDrawScoutResultMatches(pairPrevious.matches, pairNoteMatchKeys, matchByKey),
    [matchByKey, pairNoteMatchKeys, pairPrevious.matches],
  )

  const hasPairBlock = pairNotes.length > 0 || pairResultItems.length > 0
  const pairTitle =
    opponentA != null && opponentB != null
      ? `${opponentA.name} & ${opponentB.name}`
      : 'This pairing'

  const individuals = matchup.opponentSide.filter((player) => {
    const coOpponent =
      matchup.opponentSide.find((other) => other.name !== player.name)?.name ?? null
    const notes = getIndividualDrawScoutNotes(displayNotes, player.name, coOpponent)
    const history =
      coOpponent != null
        ? getDrawScoutPreviousMatchesAgainstOpponentAlone(
            displayMatches,
            player.name,
            coOpponent,
            playerName,
          )
        : getDrawScoutPreviousMatches(displayMatches, player.name, playerName)
    return notes.length > 0 || history.matches.length > 0
  })

  if (!hasPairBlock && individuals.length === 0) return null

  return (
    <>
      {hasPairBlock && opponentA != null && opponentB != null && (
        <DrawScoutIntelBlock
          title={pairTitle}
          notes={pairNotes}
          noteScopeOpponentName={opponentA.name}
          drawnCoOpponent={opponentB.name}
          hidePairScopeLine
          resultItems={pairResultItems}
          previousGamesAriaName={pairTitle}
          autoOpenPreviousGames={autoOpenPreviousGames}
          viewingOwnDraw={viewingOwnDraw}
        />
      )}
      {individuals.map((player) => {
        const coOpponent =
          matchup.opponentSide.find((other) => other.name !== player.name)?.name ?? null
        return (
          <OpponentDrawIntelSection
            key={player.name}
            opponentName={player.name}
            coOpponentName={coOpponent}
            displayNotes={displayNotes}
            displayMatches={displayMatches}
            playerName={playerName}
            matchByKey={matchByKey}
            autoOpenPreviousGames={autoOpenPreviousGames}
            viewingOwnDraw={viewingOwnDraw}
          />
        )
      })}
    </>
  )
}

function MatchupBlock({
  matchup,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  viewingOwnDraw = true,
}: {
  matchup: DrawMatchup
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  viewingOwnDraw?: boolean
}) {
  const [open, setOpen] = useState(false)
  const counts = useMemo(
    () => getMatchupIntelCounts(matchup, displayNotes, displayMatches, playerName),
    [displayMatches, displayNotes, matchup, playerName],
  )
  const teaser = formatMatchupIntelTeaser(counts.noteCount, counts.gamesPlayed, {
    viewingOwnDraw,
  })
  const autoOpenPreviousGames = counts.noteCount === 0 && counts.gamesPlayed > 0

  if (teaser == null) {
    return <DrawMatchupRow matchup={matchup} />
  }

  return (
    <DrawMatchupRow
      matchup={matchup}
      expandable={{
        open,
        onToggle: () => setOpen((value) => !value),
        teaser,
      }}
      notes={
        <MatchupNotes
          matchup={matchup}
          displayNotes={displayNotes}
          displayMatches={displayMatches}
          playerName={playerName}
          matchByKey={matchByKey}
          autoOpenPreviousGames={autoOpenPreviousGames}
          viewingOwnDraw={viewingOwnDraw}
        />
      }
    />
  )
}

function RoundGroupBlock({
  disciplineCode,
  roundLabel,
  matchups,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  viewingOwnDraw = true,
}: {
  disciplineCode: string
  roundLabel: string
  matchups: DrawMatchup[]
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  viewingOwnDraw?: boolean
}) {
  return (
    <div className="mt-3 first:mt-2">
      <p className="text-xs font-medium text-ink-500">
        {disciplineCode}: {roundLabel}
      </p>
      <div className="mt-1">
        {matchups.map((matchup) => (
          <MatchupBlock
            key={matchup.id}
            matchup={matchup}
            displayNotes={displayNotes}
            displayMatches={displayMatches}
            playerName={playerName}
            matchByKey={matchByKey}
            viewingOwnDraw={viewingOwnDraw}
          />
        ))}
      </div>
    </div>
  )
}

function DisciplineBlock({
  group,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  viewingOwnDraw = true,
}: {
  group: DrawDisciplineGroup
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  viewingOwnDraw?: boolean
}) {
  const dotClass = DISCIPLINE_DOT[getDisciplineFamily(group.disciplineCode)]
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden />
        <h4 className="text-sm font-bold text-ink-900">{group.disciplineLabel}</h4>
      </div>
      <div className="mt-1">
        {groupMatchupsByRound(group.matchups).map((roundGroup) => (
          <RoundGroupBlock
            key={`${group.disciplineCode}-${roundGroup.roundLabel}`}
            disciplineCode={group.disciplineCode}
            roundLabel={roundGroup.roundLabel}
            matchups={roundGroup.matchups}
            displayNotes={displayNotes}
            displayMatches={displayMatches}
            playerName={playerName}
            matchByKey={matchByKey}
            viewingOwnDraw={viewingOwnDraw}
          />
        ))}
      </div>
    </div>
  )
}

const LATER_OPPONENTS_INITIAL_VISIBLE = 3

function LaterRoundGroup({
  group,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  viewingOwnDraw,
  viewedPlayerName,
  isFirst = false,
}: {
  group: LaterOpponentRoundGroup
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  viewingOwnDraw: boolean
  viewedPlayerName: string
  isFirst?: boolean
}) {
  const [showAll, setShowAll] = useState(false)
  const visibleOpponents = showAll
    ? group.opponents
    : group.opponents.slice(0, LATER_OPPONENTS_INITIAL_VISIBLE)
  const hiddenCount = group.opponents.length - visibleOpponents.length
  const roundContext = viewingOwnDraw
    ? 'Opponents you could face'
    : `Opponents ${viewedPlayerName} could face`

  return (
    <div className={isFirst ? undefined : 'mt-5 border-t border-ink-200 pt-5'}>
      <div className="rounded-lg bg-ink-100 px-3 py-2">
        <h5 className="text-sm font-semibold text-ink-900">{group.roundLabel}</h5>
        <p className="mt-0.5 text-xs text-ink-500">{roundContext}</p>
      </div>
      <div className="mt-3 space-y-4">
        {visibleOpponents.map((opponent) => (
          <OpponentDrawIntelSection
            key={`${group.roundLabel}-${opponent.name}-${opponent.disciplineCode}`}
            opponentName={opponent.name}
            coOpponentName={null}
            displayNotes={displayNotes}
            displayMatches={displayMatches}
            playerName={playerName}
            matchByKey={matchByKey}
            disciplineCode={opponent.disciplineCode}
            viewingOwnDraw={viewingOwnDraw}
          />
        ))}
      </div>
      {hiddenCount > 0 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs font-medium text-brand-600 transition hover:text-brand-700"
        >
          +{hiddenCount} more in {group.roundLabel.toLowerCase()}
        </button>
      )}
      {showAll && group.opponents.length > LATER_OPPONENTS_INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mt-2 text-xs font-medium text-ink-500 transition hover:text-ink-700"
        >
          Show less
        </button>
      )}
    </div>
  )
}

function LaterSection({
  opponents,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  viewingOwnDraw,
  viewedPlayerName,
}: {
  opponents: DrawScoutLaterOpponent[]
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  viewingOwnDraw: boolean
  viewedPlayerName: string
}) {
  const [open, setOpen] = useState(false)
  const relevant = useMemo(
    () => filterLaterOpponentsWithViewerIntel(opponents, displayNotes, displayMatches, playerName),
    [displayMatches, displayNotes, opponents, playerName],
  )
  const roundGroups = useMemo(() => groupLaterOpponentsByRound(relevant), [relevant])

  if (relevant.length === 0) return null

  const title = viewingOwnDraw
    ? `You may also meet (${relevant.length})`
    : `${viewedPlayerName} may also meet (${relevant.length})`
  const helper = viewingOwnDraw
    ? 'Knockout opponents outside your groups — with your personal notes.'
    : `Knockout opponents outside ${viewedPlayerName}'s groups — with your personal notes.`

  return (
    <div className="mt-4 border-t border-ink-100 pt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-ink-800">{title}</span>
        <ChevronIcon open={open} />
      </button>
      <p className="mt-0.5 text-xs text-ink-500">{helper}</p>
      {open && (
        <div className="mt-4">
          {roundGroups.map((group, index) => (
            <LaterRoundGroup
              key={group.roundLabel}
              group={group}
              displayNotes={displayNotes}
              displayMatches={displayMatches}
              playerName={playerName}
              matchByKey={matchByKey}
              viewingOwnDraw={viewingOwnDraw}
              viewedPlayerName={viewedPlayerName}
              isFirst={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CompetitionHeader({
  competition,
  alternatives,
  onSelect,
}: {
  competition: DrawScoutCompetition
  alternatives: DrawScoutCompetition[]
  onSelect: (slug: string) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const showChange = alternatives.length > 1

  return (
    <div>
      <div className="flex items-start gap-2">
        <h4 className="min-w-0 flex-1 text-base font-semibold leading-snug text-ink-900">
          {competition.name}
        </h4>
        {showChange && (
          <button
            type="button"
            onClick={() => setPickerOpen((value) => !value)}
            className="mt-0.5 shrink-0 rounded-md p-1 text-brand-600 transition hover:bg-brand-50 hover:text-brand-700"
            aria-label={pickerOpen ? 'Cancel changing competition' : 'Change competition'}
            aria-expanded={pickerOpen}
          >
            <SwapIcon />
          </button>
        )}
      </div>
      <p className="mt-0.5 text-xs text-ink-500">{formatCompetitionDateRange(competition)}</p>
      {showChange && pickerOpen && (
        <ul className="mt-2 space-y-1 rounded-lg border border-ink-100 bg-white p-1 shadow-sm">
          {alternatives.map((comp) => {
            const selected = comp.slug === competition.slug
            return (
              <li key={comp.slug}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(comp.slug)
                    setPickerOpen(false)
                  }}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                    selected
                      ? 'bg-brand-50 font-medium text-brand-800'
                      : 'text-ink-800 hover:bg-ink-50'
                  }`}
                >
                  <span className="block">{comp.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">
                    {formatCompetitionDateRange(comp)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const VISIBLE_FAVOURITE_CHIPS = 4

type PlayerOption = {
  name: string
  label: string
  isFavourite: boolean
  isYou: boolean
}

function buildPlayerOptions(competition: DrawScoutCompetition): PlayerOption[] {
  const you = competition.entrants.find((entrant) => entrant.isYou)
  const favourites = competition.entrants.filter(
    (entrant) => entrant.isFavourite && entrant.name !== you?.name,
  )
  const rest = competition.entrants
    .filter((entrant) => !entrant.isYou && !entrant.isFavourite)
    .sort((a, b) => a.name.localeCompare(b.name))

  const seen = new Set<string>()
  const options: PlayerOption[] = []

  for (const entrant of [you, ...favourites, ...rest].filter(Boolean)) {
    if (seen.has(entrant!.name)) continue
    seen.add(entrant!.name)
    options.push({
      name: entrant!.name,
      label: entrant!.isYou ? `${entrant!.name} (you)` : entrant!.name,
      isFavourite: entrant!.isFavourite === true,
      isYou: entrant!.isYou === true,
    })
  }

  return options
}

function matchPlayerOption(query: string, option: PlayerOption): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return (
    option.name.toLowerCase().includes(normalized) ||
    option.label.toLowerCase().includes(normalized)
  )
}

function resolvePlayerOption(query: string, options: PlayerOption[]): PlayerOption | null {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return null

  const exact =
    options.find((option) => option.name.toLowerCase() === normalized) ??
    options.find((option) => option.label.toLowerCase() === normalized)
  if (exact) return exact

  return options.find((option) => matchPlayerOption(normalized, option)) ?? null
}

function PlayerChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition ${
        selected ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
      }`}
    >
      {label}
    </button>
  )
}

function PlayerCombobox({
  id,
  competition,
  value,
  onChange,
}: {
  id: string
  competition: DrawScoutCompetition
  value: string
  onChange: (name: string) => void
}) {
  const listId = `${id}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const [showAllFavourites, setShowAllFavourites] = useState(false)
  const [listStyle, setListStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )

  const options = useMemo(() => buildPlayerOptions(competition), [competition])
  const selectedOption = options.find((option) => option.name === value) ?? null
  const filtered = options.filter((option) => matchPlayerOption(query, option))

  const favourites = options.filter((option) => option.isFavourite)
  const you = options.find((option) => option.isYou)
  const viewingEntrant = competition.entrants.find((entrant) => entrant.name === value)

  const selectOption = useCallback(
    (option: PlayerOption) => {
      onChange(option.name)
      setQuery('')
      setListOpen(false)
    },
    [onChange],
  )

  const commitQuery = useCallback(() => {
    const match = resolvePlayerOption(query, options)
    if (match) {
      selectOption(match)
      return
    }
    setQuery('')
    setListOpen(false)
  }, [options, query, selectOption])

  useEffect(() => {
    setShowAllFavourites(false)
    setQuery('')
    setListOpen(false)
  }, [competition.slug])

  useLayoutEffect(() => {
    if (!listOpen) {
      setListStyle(null)
      return
    }

    const updatePosition = () => {
      const input = inputRef.current
      if (!input) return
      const rect = input.getBoundingClientRect()
      setListStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [listOpen, filtered.length])

  useEffect(() => {
    if (!listOpen) return

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (inputRef.current?.contains(target)) return
      const panel = document.getElementById(listId)
      if (panel?.contains(target)) return
      commitQuery()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setQuery('')
        setListOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [commitQuery, listId, listOpen])

  const visibleFavourites = showAllFavourites
    ? favourites
    : favourites.slice(0, VISIBLE_FAVOURITE_CHIPS)
  const hiddenFavouriteCount = Math.max(0, favourites.length - VISIBLE_FAVOURITE_CHIPS)
  const inputValue = query !== '' ? query : (selectedOption?.label ?? '')

  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-ink-700">
        Whose draw
      </label>
      <div className="relative mt-0.5">
        <input
          ref={inputRef}
          id={id}
          type="search"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          value={inputValue}
          placeholder="Choose a player…"
          onFocus={() => setListOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setListOpen(true)
            const match = resolvePlayerOption(event.target.value, options)
            if (match && event.target.value.trim().toLowerCase() === match.name.toLowerCase()) {
              selectOption(match)
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitQuery()
            }
          }}
          className="w-full rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {listOpen && listStyle != null && filtered.length > 0
          ? createPortal(
              <ul
                id={listId}
                role="listbox"
                className="max-h-48 overflow-y-auto rounded-lg border border-ink-200 bg-white py-1 shadow-lg"
                style={{
                  position: 'fixed',
                  top: listStyle.top,
                  left: listStyle.left,
                  width: listStyle.width,
                  zIndex: 60,
                }}
              >
                {filtered.map((option) => {
                  const selected = value === option.name
                  return (
                    <li key={option.name} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectOption(option)}
                        className={`w-full px-3 py-2 text-left text-sm transition ${
                          selected
                            ? 'bg-brand-50 font-medium text-brand-800'
                            : 'text-ink-800 hover:bg-ink-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    </li>
                  )
                })}
              </ul>,
              document.body,
            )
          : null}
      </div>
      {(favourites.length > 0 || you) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {you && (
            <PlayerChip
              label={you.label}
              selected={value === you.name}
              onClick={() => selectOption(you)}
            />
          )}
          {visibleFavourites.map((option) => (
            <PlayerChip
              key={option.name}
              label={option.label}
              selected={value === option.name}
              onClick={() => selectOption(option)}
            />
          ))}
          {hiddenFavouriteCount > 0 && !showAllFavourites && (
            <button
              type="button"
              onClick={() => setShowAllFavourites(true)}
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50"
            >
              +{hiddenFavouriteCount} more
            </button>
          )}
          {showAllFavourites && favourites.length > VISIBLE_FAVOURITE_CHIPS && (
            <button
              type="button"
              onClick={() => setShowAllFavourites(false)}
              className="shrink-0 text-xs font-medium text-ink-500 transition hover:text-ink-700"
            >
              Show less
            </button>
          )}
        </div>
      )}
      {value && viewingEntrant != null && !viewingEntrant.isYou && (
        <p className="mt-1.5 text-xs text-ink-600">
          Viewing <strong>{value}</strong>&rsquo;s draw — your notes on their opponents
        </p>
      )}
    </div>
  )
}

export function DrawScoutExploreModal({
  open,
  competitions,
  initialSlug,
  youName,
  onClose,
  onConfirm,
}: {
  open: boolean
  competitions: DrawScoutCompetition[]
  initialSlug: string | null
  youName: string
  onClose: () => void
  onConfirm: (competitionSlug: string, playerName: string) => void
}) {
  const titleId = useId()
  const [slug, setSlug] = useState(initialSlug ?? competitions[0]?.slug ?? '')
  const competition = competitions.find((item) => item.slug === slug) ?? null
  const [playerName, setPlayerName] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return
    const nextSlug =
      initialSlug ??
      getDefaultCompetitionSlug(competitions, { youName }) ??
      competitions[0]?.slug ??
      ''
    setSlug(nextSlug)
    const comp = competitions.find((item) => item.slug === nextSlug)
    setPlayerName(comp ? getDefaultPlayerName(comp, youName) ?? '' : '')
    setSearch('')
  }, [competitions, initialSlug, open, youName])

  if (!open) return null

  const filteredComps = competitions.filter((comp) =>
    formatCompetitionPickerLabel(comp).toLowerCase().includes(search.trim().toLowerCase()),
  )

  const canConfirm = competition != null && playerName.trim() !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-semibold text-ink-900">
          Explore a draw
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          Choose an upcoming or in-progress competition, then whose draw to view.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor={`${titleId}-search`} className="text-sm font-medium text-ink-700">
              Competition
            </label>
            <input
              id={`${titleId}-search`}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search competitions…"
              className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {filteredComps.map((comp) => (
                <li key={comp.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSlug(comp.slug)
                      setPlayerName(getDefaultPlayerName(comp, youName) ?? '')
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      slug === comp.slug
                        ? 'bg-brand-50 font-medium text-brand-800 ring-1 ring-brand-200'
                        : 'text-ink-800 hover:bg-ink-50'
                    }`}
                  >
                    {formatCompetitionPickerLabel(comp)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {competition && (
            <PlayerCombobox
              id={`${titleId}-player`}
              competition={competition}
              value={playerName}
              onChange={setPlayerName}
            />
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (!competition) return
              onConfirm(competition.slug, playerName)
              onClose()
            }}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            View draw
          </button>
        </div>
      </div>
    </div>
  )
}

export function DrawScoutCard({
  playerName,
  allNotes,
  allMatches,
  competitions = drawScoutPreviewCompetitions,
  forcedVisible = false,
  initialCompetitionSlug = null,
  initialPlayerName = null,
}: Props & {
  forcedVisible?: boolean
  initialCompetitionSlug?: string | null
  initialPlayerName?: string | null
}) {
  const playerPickerId = useId()
  const deepLink = useMemo(() => readDrawScoutDeepLink(), [])
  const activeCompetitions = useMemo(
    () => listActiveDrawScoutCompetitions(competitions),
    [competitions],
  )

  const autoShow = useMemo(
    () =>
      shouldAutoShowDrawScoutCard(competitions, {
        youName: playerName,
        deepLinkSlug: deepLink.drawSlug ?? initialCompetitionSlug,
      }),
    [competitions, deepLink.drawSlug, initialCompetitionSlug, playerName],
  )

  const showCard = forcedVisible || autoShow

  const [competitionSlug, setCompetitionSlug] = useState<string | null>(() =>
    getDefaultCompetitionSlug(activeCompetitions, {
      youName: playerName,
      deepLinkSlug: deepLink.drawSlug ?? initialCompetitionSlug,
    }),
  )
  const [viewingPlayerName, setViewingPlayerName] = useState<string>('')

  const competition =
    activeCompetitions.find((comp) => comp.slug === competitionSlug) ?? null

  useEffect(() => {
    if (!competition) return
    const defaultPlayer =
      initialPlayerName ??
      deepLink.playerName ??
      getDefaultPlayerName(competition, playerName) ??
      ''
    setViewingPlayerName(defaultPlayer)
  }, [competition, deepLink.playerName, initialPlayerName, playerName])

  useEffect(() => {
    if (initialCompetitionSlug) {
      setCompetitionSlug(initialCompetitionSlug)
    }
  }, [initialCompetitionSlug])

  useEffect(() => {
    if (initialPlayerName) {
      setViewingPlayerName(initialPlayerName)
    }
  }, [initialPlayerName])

  const displayNotes = useMemo(() => mergeDrawScoutDisplayNotes(allNotes), [allNotes])
  const displayMatches = useMemo(() => mergeDrawScoutDisplayMatches(allMatches), [allMatches])

  const matchByKey = useMemo(() => {
    const map = new Map<string, NormalizedMatch>()
    for (const match of displayMatches) {
      map.set(recapMatchKey(match), match)
    }
    return map
  }, [displayMatches])

  if (!showCard || activeCompetitions.length === 0) return null

  const entrant =
    competition && viewingPlayerName
      ? getEntrantForCompetition(competition, viewingPlayerName)
      : null

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-brand-200/80 bg-gradient-to-b from-brand-50/50 to-white shadow-sm">
      <div className="border-b border-brand-100/80 px-4 py-3 sm:px-5">
        <p className="text-xs font-medium text-ink-500">Draw scout</p>

        <div className="mt-2 space-y-3">
          {competition && (
            <CompetitionHeader
              competition={competition}
              alternatives={activeCompetitions}
              onSelect={(nextSlug) => {
                setCompetitionSlug(nextSlug)
                const nextComp = activeCompetitions.find((comp) => comp.slug === nextSlug)
                if (nextComp) {
                  setViewingPlayerName(getDefaultPlayerName(nextComp, playerName) ?? '')
                }
              }}
            />
          )}

          {competition && (
            <PlayerCombobox
              id={playerPickerId}
              competition={competition}
              value={viewingPlayerName}
              onChange={setViewingPlayerName}
            />
          )}
        </div>
      </div>

      <div className="px-4 py-3 sm:px-5">
        {!entrant ? (
          <p className="text-sm text-ink-600">Choose a player to view their draw.</p>
        ) : (
          <div className="space-y-6">
            {entrant.disciplineGroups.map((group) => (
              <DisciplineBlock
                key={group.disciplineCode}
                group={group}
                displayNotes={displayNotes}
                displayMatches={displayMatches}
                playerName={playerName}
                matchByKey={matchByKey}
                viewingOwnDraw={entrant.isYou === true}
              />
            ))}
            <LaterSection
              opponents={competition?.laterOpponentsByEntrant[entrant.name] ?? []}
              displayNotes={displayNotes}
              displayMatches={displayMatches}
              playerName={playerName}
              matchByKey={matchByKey}
              viewingOwnDraw={entrant.isYou === true}
              viewedPlayerName={viewingPlayerName.split(' ')[0] ?? viewingPlayerName}
            />
          </div>
        )}
      </div>
    </section>
  )
}

export function useDrawScoutVisibility(competitions = drawScoutPreviewCompetitions) {
  const deepLink = useMemo(() => readDrawScoutDeepLink(), [])
  const activeCount = listActiveDrawScoutCompetitions(competitions).length
  return {
    hasActiveCompetitions: activeCount > 0,
    deepLink,
  }
}
