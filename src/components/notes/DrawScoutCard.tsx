import { createPortal } from 'react-dom'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getDisciplineFamily, getDisciplineStyle } from '../../lib/disciplineStyle'
import {
  filterLaterOpponentsForDisciplineDraw,
  formatCompetitionPickerLabel,
  formatCrossDisciplineBusyBanner,
  formatDrawRoundSectionHeading,
  formatLaterOpponentProbability,
  formatMatchupIntelTeaser,
  formatOpponentPathStatusLine,
  formatResultsLastUpdatedLine,
  getBusyStatusesForPlayers,
  getDefaultCompetitionSlug,
  getDefaultPlayerName,
  getDisciplinePairIdentityPlayers,
  getDisciplineProgressStatus,
  getDrawRoundSectionRoles,
  getEntrantForCompetition,
  drawCompanionDisciplineSectionId,
  resolveDrawCompanionBusyJump,
  getExactDrawPairNotes,
  getIndividualDrawScoutNotes,
  getLaterOpponentIntelCounts,
  getMatchupIntelCounts,
  groupLaterOpponentsByRound,
  groupMatchupsByRound,
  isProbableNextMatchup,
  laterOpponentKey,
  laterOpponentToMatchup,
  listActiveDrawScoutCompetitions,
  shouldAutoShowDrawScoutCard,
  shouldShowYouMayAlsoMeet,
  splitPlayedAndNextMatchups,
  type DisciplineProgressStatus,
  type DrawRoundSectionRole,
  type DrawScoutCompetition,
  type DrawScoutLaterOpponent,
  type LaterOpponentRoundGroup,
} from '../../lib/drawScout'
import type {
  DrawDisciplineGroup,
  DrawMatchup,
  DrawPlayer,
  DrawPlayerBusyStatus,
  DrawProbableOpponent,
} from '../../lib/drawTypes'
import {
  applyDrawCompanionBuildStage,
  getDrawCompanionBuildFeatures,
  type DrawCompanionBuildStage,
} from '../../lib/drawCompanionBuildStage'
import {
  mergeDrawScoutDisplayNotes,
} from '../../lib/drawScoutDemoNotes'
import { readDrawScoutDeepLink } from '../../lib/drawScoutDeepLink'
import { getDrawScoutPreviewCompetitions } from '../../lib/drawScoutPreviewData'
import { formatScoutingTagsForDisplay } from '../../lib/noteTags'
import {
  formatNoteRecordedSummary,
  formatNoteScopeInGroup,
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
import { DrawIntelToggle, DrawMatchupRow } from './DrawMatchupRow'
import { DrawPairNames, DrawPlayerNameLink } from './DrawPairNames'
import { DrawScoutPreviousGames } from './DrawScoutPreviousGames'
import { NoteTagChips } from './NoteTagPicker'
import { recapMatchKey } from '../../lib/tournamentRecap'

const DISCIPLINE_DOT: Record<string, string> = {
  mixed: 'bg-discipline-mixed',
  doubles: 'bg-discipline-doubles',
  singles: 'bg-discipline-singles',
  unknown: 'bg-ink-300',
}

type DrawCompetitionStatus = {
  resultsLastUpdatedAt?: string
  busyPlayersByName?: Record<string, DrawPlayerBusyStatus>
}

type DrawCompanionJumpContextValue = {
  onBusyPlayer: (playerName: string, disciplineCode: string, profileUrl?: string) => void
}

const DrawCompanionJumpContext = createContext<DrawCompanionJumpContextValue | null>(null)

type Props = {
  playerName: string
  allNotes: OpponentNote[]
  allMatches: NormalizedMatch[]
  competitions?: DrawScoutCompetition[]
}

function CrossDisciplineBusyBanners({
  players,
  competitionStatus,
}: {
  players: DrawPlayer[]
  competitionStatus?: DrawCompetitionStatus | null
}) {
  const jump = useContext(DrawCompanionJumpContext)
  if (competitionStatus == null) return null
  const rows = getBusyStatusesForPlayers(players, competitionStatus.busyPlayersByName)
  if (rows.length === 0) return null

  return (
    <div className="space-y-1">
      {rows.map(({ playerName, status }) => {
        const copy = formatCrossDisciplineBusyBanner(playerName, status, {
          resultsLastUpdatedAt: competitionStatus.resultsLastUpdatedAt,
        })
        const profileUrl = players.find((player) => player.name === playerName)?.url
        const className =
          'mt-1.5 w-full rounded-md border border-loss-100 bg-loss-50 px-2 py-1 text-left transition hover:border-loss-200 hover:bg-loss-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-loss-200'
        const body = (
          <>
            <p className="text-[11px] font-semibold leading-tight text-loss-700">{copy.lead}</p>
            <p className="text-[10px] font-medium leading-tight text-loss-600/85">{copy.support}</p>
          </>
        )

        if (jump == null) {
          return (
            <div key={playerName} className={className} role="status">
              {body}
            </div>
          )
        }

        return (
          <button
            key={playerName}
            type="button"
            className={className}
            onClick={() => jump.onBusyPlayer(playerName, status.disciplineCode, profileUrl)}
            aria-label={`View ${playerName}'s ${status.disciplineCode} draw`}
          >
            {body}
          </button>
        )
      })}
    </div>
  )
}

function DisciplineIdentityLine({ players }: { players: DrawPlayer[] }) {
  return (
    <p className="mt-0.5 text-sm text-ink-600">
      {players.map((player, index) => (
        <span key={player.name}>
          {index > 0 ? <span className="text-ink-400"> & </span> : null}
          <DrawPlayerNameLink player={player} />
        </span>
      ))}
    </p>
  )
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

/** Live-feed status on the discipline title: green/pink chip, or a gold medal for champions. */
function DisciplineProgressMark({ status }: { status: DisciplineProgressStatus }) {
  if (status.tone === 'champion') {
    return (
      <span className="text-base leading-none" title="Champion" aria-label="Champion">
        🥇
      </span>
    )
  }

  const chipClass =
    status.tone === 'lost'
      ? 'bg-loss-100 text-loss-700'
      : 'bg-court-100 text-court-700'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${chipClass}`}
    >
      {status.label}
    </span>
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
      <div className="text-xs text-ink-500">{formatNoteRecordedSummary(note)}</div>
      {pairScopeLine != null && <p className="text-xs text-ink-500">{pairScopeLine}</p>}
    </div>
  )
}

type IntelPanelMode = 'notes' | 'games'

function DrawScoutIntelBlock({
  title,
  notes,
  noteScopeOpponentName,
  drawnCoOpponent,
  hidePairScopeLine = false,
  resultItems,
  previousGamesAriaName,
  panel,
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
  panel: IntelPanelMode
  viewingOwnDraw?: boolean
  disciplineCode?: string | null
}) {
  const showNotes = panel === 'notes' && notes.length > 0
  const showGames = panel === 'games' && resultItems.length > 0
  if (!showNotes && !showGames) return null

  const gamesEyebrow = viewingOwnDraw ? 'Previous games' : "Games you've played"

  return (
    <div className="border-t border-ink-100 pt-3 first:border-t-0 first:pt-0">
      {showGames ? (
        <div className="mb-0.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
            {gamesEyebrow}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-medium text-ink-800">{title}</p>
            {disciplineCode != null && <DisciplineChip code={disciplineCode} />}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-semibold text-ink-900">{title}</p>
          {disciplineCode != null && <DisciplineChip code={disciplineCode} />}
        </div>
      )}
      {showNotes && (
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
      {showGames && (
        <DrawScoutPreviousGames
          opponentName={previousGamesAriaName}
          items={resultItems}
          viewingOwnDraw={viewingOwnDraw}
          className="mt-2"
        />
      )}
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
  panel,
  viewingOwnDraw = true,
}: {
  opponentName: string
  coOpponentName: string | null
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  disciplineCode?: string | null
  panel: IntelPanelMode
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
      panel={panel}
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
  panel,
  viewingOwnDraw = true,
}: {
  matchup: DrawMatchup
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  panel: IntelPanelMode
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

  const hasPairBlock =
    (panel === 'notes' && pairNotes.length > 0) ||
    (panel === 'games' && pairResultItems.length > 0)
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
    if (panel === 'notes') return notes.length > 0
    return history.matches.length > 0
  })

  if (!hasPairBlock && individuals.length === 0) return null

  // Wrapper so `first:border-t-0` on intel blocks works even when tabs sit above as a sibling.
  return (
    <div>
      {hasPairBlock && opponentA != null && opponentB != null && (
        <DrawScoutIntelBlock
          title={pairTitle}
          notes={pairNotes}
          noteScopeOpponentName={opponentA.name}
          drawnCoOpponent={opponentB.name}
          hidePairScopeLine
          resultItems={pairResultItems}
          previousGamesAriaName={pairTitle}
          panel={panel}
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
            panel={panel}
            viewingOwnDraw={viewingOwnDraw}
          />
        )
      })}
    </div>
  )
}

function MatchupIntelTabs({
  active,
  onChange,
}: {
  active: IntelPanelMode
  onChange: (panel: IntelPanelMode) => void
}) {
  const tabs: { id: IntelPanelMode; label: string }[] = [
    { id: 'notes', label: 'Notes' },
    { id: 'games', label: 'Your games' },
  ]

  return (
    <div
      className="mb-3 flex gap-1 border-b border-ink-100"
      role="tablist"
      aria-label="Matchup intel"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`relative -mb-px px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
              selected
                ? tab.id === 'notes'
                  ? 'text-notes-amber-ink'
                  : 'text-brand-700'
                : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            {tab.label}
            {selected && (
              <span
                className={`absolute inset-x-1 bottom-0 h-0.5 rounded-full ${
                  tab.id === 'notes' ? 'bg-notes-amber' : 'bg-brand-600'
                }`}
                aria-hidden
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

function MatchupBlock({
  matchup,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  disciplineCode,
  viewingOwnDraw = true,
  competitionStatus,
  /** When false, flat cards only — no games teaser, accordion, or empty intel hint. */
  matchHistoryEnabled = true,
}: {
  matchup: DrawMatchup
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  disciplineCode: string
  viewingOwnDraw?: boolean
  competitionStatus?: DrawCompetitionStatus | null
  matchHistoryEnabled?: boolean
}) {
  if (isProbableNextMatchup(matchup)) {
    return (
      <ProbableNextMatchupBlock
        matchup={matchup}
        displayNotes={displayNotes}
        displayMatches={displayMatches}
        playerName={playerName}
        matchByKey={matchByKey}
        disciplineCode={disciplineCode}
        viewingOwnDraw={viewingOwnDraw}
        competitionStatus={competitionStatus}
        matchHistoryEnabled={matchHistoryEnabled}
      />
    )
  }

  return (
    <ScoutMatchupBlock
      matchup={matchup}
      displayNotes={displayNotes}
      displayMatches={displayMatches}
      playerName={playerName}
      matchByKey={matchByKey}
      disciplineCode={disciplineCode}
      viewingOwnDraw={viewingOwnDraw}
      competitionStatus={competitionStatus}
      matchHistoryEnabled={matchHistoryEnabled}
    />
  )
}

function ScoutMatchupBlock({
  matchup,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  disciplineCode,
  viewingOwnDraw = true,
  competitionStatus,
  matchHistoryEnabled = true,
}: {
  matchup: DrawMatchup
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  disciplineCode: string
  viewingOwnDraw?: boolean
  competitionStatus?: DrawCompetitionStatus | null
  matchHistoryEnabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<IntelPanelMode>('notes')
  // getDrawScoutPreviousMatches falls back to demo fixtures when the list is empty —
  // so ticket stages that hide history must hard-disable intel, not just pass [].
  const counts = useMemo(
    () =>
      matchHistoryEnabled
        ? getMatchupIntelCounts(matchup, displayNotes, displayMatches, playerName)
        : { noteCount: 0, gamesPlayed: 0 },
    [displayMatches, displayNotes, matchHistoryEnabled, matchup, playerName],
  )
  const teaser = matchHistoryEnabled
    ? formatMatchupIntelTeaser(counts.noteCount, counts.gamesPlayed, {
        viewingOwnDraw,
      })
    : null
  const showTabs = counts.noteCount > 0 && counts.gamesPlayed > 0
  const resolvedPanel: IntelPanelMode = showTabs
    ? panel
    : counts.noteCount > 0
      ? 'notes'
      : 'games'
  const statusBanner =
    matchup.result == null ? (
      <CrossDisciplineBusyBanners
        players={matchup.opponentSide}
        competitionStatus={competitionStatus}
      />
    ) : null

  if (teaser == null) {
    return (
      <DrawMatchupRow
        matchup={matchup}
        disciplineCode={disciplineCode}
        statusBanner={statusBanner}
      />
    )
  }

  return (
    <DrawMatchupRow
      matchup={matchup}
      disciplineCode={disciplineCode}
      statusBanner={statusBanner}
      expandable={{
        open,
        onToggle: () => {
          setOpen((value) => {
            const next = !value
            if (next) setPanel('notes')
            return next
          })
        },
        teaser,
      }}
      notes={
        <>
          {showTabs && <MatchupIntelTabs active={panel} onChange={setPanel} />}
          <MatchupNotes
            matchup={matchup}
            displayNotes={displayNotes}
            displayMatches={displayMatches}
            playerName={playerName}
            matchByKey={matchByKey}
            panel={resolvedPanel}
            viewingOwnDraw={viewingOwnDraw}
          />
        </>
      }
    />
  )
}

const PROBABLE_NEXT_INITIAL_VISIBLE = 2

function probableToLaterOpponent(
  probable: DrawProbableOpponent,
  disciplineCode: string,
  roundLabel: string,
): DrawScoutLaterOpponent {
  return {
    opponentSide: probable.opponentSide,
    disciplineCode,
    roundLabel,
    probability: probable.probability,
    pathStatus: probable.pathStatus,
  }
}

/** Promoted next-round slot while the bracket opponent is still unsettled. */
function ProbableNextMatchupBlock({
  matchup,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  disciplineCode,
  viewingOwnDraw = true,
  competitionStatus,
  matchHistoryEnabled = true,
}: {
  matchup: DrawMatchup
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  disciplineCode: string
  viewingOwnDraw?: boolean
  competitionStatus?: DrawCompetitionStatus | null
  matchHistoryEnabled?: boolean
}) {
  const [showAll, setShowAll] = useState(false)
  const disciplineStyle = getDisciplineStyle(disciplineCode)
  const probable = matchup.probableOpponents ?? []
  const visible = showAll ? probable : probable.slice(0, PROBABLE_NEXT_INITIAL_VISIBLE)
  const hiddenCount = probable.length - visible.length
  const showMoreButtonClass =
    'mt-2 w-fit rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'

  // Full-width matchup cards on a shared tinted ground — groups the section without
  // nesting cards inside another card shell. Round header (“Next · …”) lives above.
  // Path-until-decided lives on each probable row (pathStatus), not as a section lead-in.
  return (
    <div className={`rounded-xl border border-ink-100 ${disciplineStyle.rowBgClass} p-2`}>
      <p className="mb-1.5 px-0.5 text-xs font-medium text-ink-500">
        Most Likely Opponents
      </p>
      <div className="space-y-2">
        {visible.map((item) => {
          const asLater = probableToLaterOpponent(
            item,
            disciplineCode,
            matchup.roundLabel,
          )
          return (
            <LaterOpponentBlock
              key={laterOpponentKey(asLater)}
              opponent={asLater}
              displayNotes={displayNotes}
              displayMatches={displayMatches}
              playerName={playerName}
              matchByKey={matchByKey}
              disciplineCode={disciplineCode}
              viewingOwnDraw={viewingOwnDraw}
              variant="standalone"
              competitionStatus={competitionStatus}
              matchHistoryEnabled={matchHistoryEnabled}
            />
          )
        })}
      </div>
      {hiddenCount > 0 && !showAll && (
        <button type="button" onClick={() => setShowAll(true)} className={showMoreButtonClass}>
          Show more
        </button>
      )}
      {showAll && probable.length > PROBABLE_NEXT_INITIAL_VISIBLE && (
        <button type="button" onClick={() => setShowAll(false)} className={showMoreButtonClass}>
          Show less
        </button>
      )}
    </div>
  )
}

function RoundMatchupList({
  matchups,
  compact,
  disciplineCode,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  viewingOwnDraw,
  competitionStatus,
  matchHistoryEnabled,
}: {
  matchups: DrawMatchup[]
  compact: boolean
  disciplineCode: string
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  viewingOwnDraw?: boolean
  competitionStatus?: DrawCompetitionStatus | null
  matchHistoryEnabled?: boolean
}) {
  return (
    <div className={compact ? 'mt-1 space-y-1' : 'mt-1.5 space-y-2'}>
      {matchups.map((matchup) => (
        <MatchupBlock
          key={matchup.id}
          matchup={matchup}
          displayNotes={displayNotes}
          displayMatches={displayMatches}
          playerName={playerName}
          matchByKey={matchByKey}
          disciplineCode={disciplineCode}
          viewingOwnDraw={viewingOwnDraw}
          competitionStatus={competitionStatus}
          matchHistoryEnabled={matchHistoryEnabled}
        />
      ))}
    </div>
  )
}

function RoundGroupBlock({
  disciplineCode,
  roundLabel,
  matchups,
  sectionRole,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  viewingOwnDraw = true,
  competitionStatus,
  matchHistoryEnabled = true,
}: {
  disciplineCode: string
  roundLabel: string
  matchups: DrawMatchup[]
  sectionRole: DrawRoundSectionRole
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  viewingOwnDraw?: boolean
  competitionStatus?: DrawCompetitionStatus | null
  matchHistoryEnabled?: boolean
}) {
  const heading = formatDrawRoundSectionHeading(roundLabel, sectionRole)
  const isUpNext = sectionRole === 'up-next'
  const { played, next } = splitPlayedAndNextMatchups(matchups)
  const mixed = played.length > 0 && next.length > 0
  const listProps = {
    disciplineCode,
    displayNotes,
    displayMatches,
    playerName,
    matchByKey,
    viewingOwnDraw,
    competitionStatus,
    matchHistoryEnabled,
  }

  if (mixed) {
    return (
      <div className="mt-3 first:mt-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
          {formatDrawRoundSectionHeading(roundLabel, 'played').title}
        </p>
        <RoundMatchupList matchups={played} compact {...listProps} />
        <p className="mt-3 text-sm font-semibold tracking-tight text-ink-900">
          {formatDrawRoundSectionHeading(roundLabel, 'up-next').title}
        </p>
        <RoundMatchupList matchups={next} compact={false} {...listProps} />
      </div>
    )
  }

  return (
    <div className={`mt-3 first:mt-2 ${isUpNext ? 'mt-4 first:mt-3' : ''}`}>
      {isUpNext ? (
        <div className="mb-1.5">
          <p className="text-sm font-semibold tracking-tight text-ink-900">{heading.title}</p>
          {heading.subtitle != null ? (
            <p className="mt-0.5 text-xs font-medium text-ink-500">
              {disciplineCode}: {heading.subtitle}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
          {heading.title}
        </p>
      )}
      <RoundMatchupList
        matchups={matchups}
        compact={!isUpNext}
        {...listProps}
      />
    </div>
  )
}

function LaterOpponentBlock({
  opponent,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  disciplineCode,
  viewingOwnDraw = true,
  variant = 'embedded',
  competitionStatus,
  matchHistoryEnabled = true,
}: {
  opponent: DrawScoutLaterOpponent
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  disciplineCode: string
  viewingOwnDraw?: boolean
  /**
   * embedded = nested cards in “may also meet”
   * standalone = full-width individual cards
   * section = flat rows inside a shared section card (no nested chrome)
   */
  variant?: 'embedded' | 'standalone' | 'section'
  competitionStatus?: DrawCompetitionStatus | null
  matchHistoryEnabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<IntelPanelMode>('notes')
  const matchup = useMemo(() => laterOpponentToMatchup(opponent), [opponent])
  const counts = useMemo(
    () =>
      matchHistoryEnabled
        ? getLaterOpponentIntelCounts(opponent, displayNotes, displayMatches, playerName)
        : { noteCount: 0, gamesPlayed: 0 },
    [displayMatches, displayNotes, matchHistoryEnabled, opponent, playerName],
  )
  const teaser = matchHistoryEnabled
    ? formatMatchupIntelTeaser(counts.noteCount, counts.gamesPlayed, {
        viewingOwnDraw,
      })
    : null
  const showTabs = counts.noteCount > 0 && counts.gamesPlayed > 0
  const resolvedPanel: IntelPanelMode = showTabs
    ? panel
    : counts.noteCount > 0
      ? 'notes'
      : 'games'
  const disciplineStyle = getDisciplineStyle(disciplineCode)
  const cardShell = 'overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm'
  const probabilityLabel = formatLaterOpponentProbability(opponent.probability)
  const busyBanner = (
    <CrossDisciplineBusyBanners
      players={opponent.opponentSide}
      competitionStatus={competitionStatus}
    />
  )
  const pathStatusLine =
    opponent.pathStatus != null
      ? formatOpponentPathStatusLine(opponent.pathStatus, {
          resultsLastUpdatedAt: competitionStatus?.resultsLastUpdatedAt,
        })
      : null

  const body = (
    <>
      <div className="flex items-start gap-3">
        <span className="inline-flex shrink-0 items-center rounded-md bg-brand-50 px-2 py-1 text-xs font-bold tabular-nums text-brand-800">
          {probabilityLabel}
        </span>
        <DrawPairNames players={opponent.opponentSide} />
      </div>
      {pathStatusLine != null ? (
        <p className="mt-1 text-[10px] font-medium leading-tight text-ink-500">{pathStatusLine}</p>
      ) : null}
      {busyBanner}
    </>
  )

  const expanded = open && teaser != null && (
    <div className="space-y-2 border-t border-ink-100 bg-white px-3 py-3">
      {showTabs && <MatchupIntelTabs active={panel} onChange={setPanel} />}
      <MatchupNotes
        matchup={matchup}
        displayNotes={displayNotes}
        displayMatches={displayMatches}
        playerName={playerName}
        matchByKey={matchByKey}
        panel={resolvedPanel}
        viewingOwnDraw={viewingOwnDraw}
      />
    </div>
  )

  const toggleOpen = () => {
    setOpen((value) => {
      const next = !value
      if (next) setPanel('notes')
      return next
    })
  }

  const intelLayer =
    teaser != null ? (
      <>
        <DrawIntelToggle open={open} onToggle={toggleOpen} teaser={teaser} />
        {expanded}
      </>
    ) : null

  // Flat row inside a shared section — full width of the outer card, no nested shell.
  if (variant === 'section') {
    return (
      <div className="border-t border-ink-100 first:border-t-0">
        <div className="px-3 py-2.5">{body}</div>
        {intelLayer}
      </div>
    )
  }

  const card = (
    <div className={cardShell}>
      <div className={`rounded-r border-l-4 ${disciplineStyle.borderClass}`}>
        <div className="px-3 py-2.5">{body}</div>
        {intelLayer}
      </div>
    </div>
  )

  if (variant === 'standalone') return card

  return (
    <div className="border-t border-ink-100 py-2 first:border-t-0 first:pt-0">{card}</div>
  )
}

const LATER_OPPONENTS_INITIAL_VISIBLE = 2

function LaterOpponentRoundGroup({
  group,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  disciplineCode,
  viewingOwnDraw,
  matchHistoryEnabled = true,
  competitionStatus,
}: {
  group: LaterOpponentRoundGroup
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  disciplineCode: string
  viewingOwnDraw: boolean
  matchHistoryEnabled?: boolean
  competitionStatus?: DrawCompetitionStatus | null
}) {
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const visibleOpponents = showAll
    ? group.opponents
    : group.opponents.slice(0, LATER_OPPONENTS_INITIAL_VISIBLE)
  const hiddenCount = group.opponents.length - visibleOpponents.length

  return (
    <div className="mt-3 first:mt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-lg bg-ink-100 px-3 py-2 text-left transition hover:bg-ink-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        aria-expanded={open}
      >
        <h5 className="text-sm font-semibold text-ink-900">{group.roundLabel}</h5>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <>
          <div
            className={`mt-1 ${
              (hiddenCount > 0 && !showAll) ||
              (showAll && group.opponents.length > LATER_OPPONENTS_INITIAL_VISIBLE)
                ? '[&>div:last-child]:pb-0'
                : ''
            }`}
          >
            {visibleOpponents.map((opponent) => (
              <LaterOpponentBlock
                key={laterOpponentKey(opponent)}
                opponent={opponent}
                displayNotes={displayNotes}
                displayMatches={displayMatches}
                playerName={playerName}
                matchByKey={matchByKey}
                disciplineCode={disciplineCode}
                viewingOwnDraw={viewingOwnDraw}
                matchHistoryEnabled={matchHistoryEnabled}
                competitionStatus={competitionStatus}
              />
            ))}
          </div>
          {hiddenCount > 0 && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-1 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            >
              Show more
            </button>
          )}
          {showAll && group.opponents.length > LATER_OPPONENTS_INITIAL_VISIBLE && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="mt-1 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            >
              Show less
            </button>
          )}
        </>
      )}
    </div>
  )
}

function DisciplineLaterSection({
  laterOpponents,
  disciplineCode,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  viewingOwnDraw,
  viewedPlayerName,
  matchHistoryEnabled = true,
  competitionStatus,
}: {
  laterOpponents: DrawScoutLaterOpponent[]
  disciplineCode: string
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  viewingOwnDraw: boolean
  viewedPlayerName: string
  matchHistoryEnabled?: boolean
  competitionStatus?: DrawCompetitionStatus | null
}) {
  const [open, setOpen] = useState(false)
  const roundGroups = useMemo(
    () => groupLaterOpponentsByRound(laterOpponents),
    [laterOpponents],
  )

  if (roundGroups.length === 0) return null

  const firstName = viewedPlayerName.split(' ')[0] ?? viewedPlayerName
  const title = viewingOwnDraw ? 'You may also meet' : `${firstName} may also meet`
  const helper = viewingOwnDraw
    ? 'Possible knockout opponents in this event, most likely first.'
    : `Possible knockout opponents for ${firstName} in this event, most likely first.`

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-ink-800">{title}</span>
        <ChevronIcon open={open} />
      </button>
      <p className="mt-0.5 text-xs text-ink-500">{helper}</p>
      {open && (
        <div>
          {roundGroups.map((group) => (
            <LaterOpponentRoundGroup
              key={group.roundLabel}
              group={group}
              displayNotes={displayNotes}
              displayMatches={displayMatches}
              playerName={playerName}
              matchByKey={matchByKey}
              disciplineCode={disciplineCode}
              viewingOwnDraw={viewingOwnDraw}
              matchHistoryEnabled={matchHistoryEnabled}
              competitionStatus={competitionStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DisciplineBlock({
  group,
  laterOpponents,
  displayNotes,
  displayMatches,
  playerName,
  matchByKey,
  viewingOwnDraw = true,
  viewedPlayerName,
  competitionStatus,
  matchHistoryEnabled = true,
}: {
  group: DrawDisciplineGroup
  laterOpponents: DrawScoutLaterOpponent[]
  displayNotes: OpponentNote[]
  displayMatches: NormalizedMatch[]
  playerName: string
  matchByKey: Map<string, NormalizedMatch>
  viewingOwnDraw?: boolean
  viewedPlayerName: string
  competitionStatus?: DrawCompetitionStatus | null
  matchHistoryEnabled?: boolean
}) {
  const dotClass = DISCIPLINE_DOT[getDisciplineFamily(group.disciplineCode)]
  const roundGroups = useMemo(() => groupMatchupsByRound(group.matchups), [group.matchups])
  const roundRoles = useMemo(() => getDrawRoundSectionRoles(roundGroups), [roundGroups])
  const identityPlayers = useMemo(
    () => getDisciplinePairIdentityPlayers(group, viewedPlayerName),
    [group, viewedPlayerName],
  )
  const disciplineLaterOpponents = useMemo(
    () =>
      filterLaterOpponentsForDisciplineDraw(
        laterOpponents,
        group.disciplineCode,
        group.matchups,
      ),
    [group.disciplineCode, group.matchups, laterOpponents],
  )
  const progress = useMemo(
    () => getDisciplineProgressStatus(group, laterOpponents),
    [group, laterOpponents],
  )
  const showLater = shouldShowYouMayAlsoMeet(progress)

  return (
    <div
      id={drawCompanionDisciplineSectionId(group.disciplineCode)}
      className="border-t border-ink-200/80 pt-4 first:border-t-0 first:pt-0 scroll-mt-3"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
        <h4 className="text-sm font-bold text-ink-900">{group.disciplineLabel}</h4>
        <DisciplineProgressMark status={progress} />
      </div>
      {identityPlayers != null ? (
        <DisciplineIdentityLine players={identityPlayers} />
      ) : null}
      <div className="mt-1">
        {roundGroups.map((roundGroup) => (
          <RoundGroupBlock
            key={`${group.disciplineCode}-${roundGroup.roundLabel}`}
            disciplineCode={group.disciplineCode}
            roundLabel={roundGroup.roundLabel}
            matchups={roundGroup.matchups}
            sectionRole={roundRoles.get(roundGroup.roundLabel) ?? 'played'}
            displayNotes={displayNotes}
            displayMatches={displayMatches}
            playerName={playerName}
            matchByKey={matchByKey}
            viewingOwnDraw={viewingOwnDraw}
            competitionStatus={competitionStatus}
            matchHistoryEnabled={matchHistoryEnabled}
          />
        ))}
        {showLater ? (
          <DisciplineLaterSection
            laterOpponents={disciplineLaterOpponents}
            disciplineCode={group.disciplineCode}
            displayNotes={displayNotes}
            displayMatches={displayMatches}
            playerName={playerName}
            matchByKey={matchByKey}
            viewingOwnDraw={viewingOwnDraw}
            viewedPlayerName={viewedPlayerName}
            matchHistoryEnabled={matchHistoryEnabled}
            competitionStatus={competitionStatus}
          />
        ) : null}
      </div>
    </div>
  )
}

type PlayerOption = {
  name: string
  label: string
  isFavourite: boolean
  isYou: boolean
}

function buildPlayerOptions(competition: DrawScoutCompetition): PlayerOption[] {
  const you = competition.entrants.find((entrant) => entrant.isYou)
  const favourites = competition.entrants
    .filter((entrant) => entrant.isFavourite && entrant.name !== you?.name)
    .sort((a, b) => a.name.localeCompare(b.name))
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

function FavouriteStarIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg
      className={`shrink-0 text-favourite-star ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        stroke="var(--color-favourite-star-stroke)"
        strokeWidth="0.75"
        strokeLinejoin="round"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  )
}

function PlayerListOption({
  option,
  selected,
  onSelect,
}: {
  option: PlayerOption
  selected: boolean
  onSelect: (option: PlayerOption) => void
}) {
  return (
    <li role="presentation">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onSelect(option)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
          selected
            ? 'bg-brand-50 font-medium text-brand-800'
            : 'text-ink-800 hover:bg-ink-50'
        }`}
      >
        {option.isFavourite && !option.isYou ? <FavouriteStarIcon /> : null}
        <span className="min-w-0 truncate">{option.label}</span>
      </button>
    </li>
  )
}

function PlayerCombobox({
  id,
  competition,
  value,
  onChange,
  notesEnabled = true,
}: {
  id: string
  competition: DrawScoutCompetition
  value: string
  onChange: (name: string) => void
  /** When false (ticket screenshots), omit notes-oriented context copy. */
  notesEnabled?: boolean
}) {
  const listId = `${id}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const [listStyle, setListStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )

  const options = useMemo(() => buildPlayerOptions(competition), [competition])
  const selectedOption = options.find((option) => option.name === value) ?? null
  const filtered = options.filter((option) => matchPlayerOption(query, option))

  const viewingEntrant = competition.entrants.find((entrant) => entrant.name === value)

  const filteredFavourites = filtered.filter((option) => option.isFavourite && !option.isYou)
  const filteredYou = filtered.find((option) => option.isYou)
  const filteredRest = filtered.filter((option) => !option.isFavourite && !option.isYou)
  const showListSections = query.trim() === ''

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
                className="max-h-64 overflow-y-auto rounded-lg border border-ink-200 bg-white py-1 shadow-lg"
                style={{
                  position: 'fixed',
                  top: listStyle.top,
                  left: listStyle.left,
                  width: listStyle.width,
                  zIndex: 80,
                }}
              >
                {showListSections ? (
                  <>
                    {filteredYou != null && (
                      <PlayerListOption
                        option={filteredYou}
                        selected={value === filteredYou.name}
                        onSelect={selectOption}
                      />
                    )}
                    {filteredFavourites.length > 0 && (
                      <>
                        <li
                          role="presentation"
                          className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400"
                        >
                          <FavouriteStarIcon className="h-2.5 w-2.5" />
                          Favourites
                        </li>
                        {filteredFavourites.map((option) => (
                          <PlayerListOption
                            key={option.name}
                            option={option}
                            selected={value === option.name}
                            onSelect={selectOption}
                          />
                        ))}
                      </>
                    )}
                    {filteredRest.length > 0 && (
                      <>
                        <li
                          role="presentation"
                          className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400"
                        >
                          All players
                        </li>
                        {filteredRest.map((option) => (
                          <PlayerListOption
                            key={option.name}
                            option={option}
                            selected={value === option.name}
                            onSelect={selectOption}
                          />
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  filtered.map((option) => (
                    <PlayerListOption
                      key={option.name}
                      option={option}
                      selected={value === option.name}
                      onSelect={selectOption}
                    />
                  ))
                )}
              </ul>,
              document.body,
            )
          : null}
      </div>
      {value && viewingEntrant != null && !viewingEntrant.isYou && (
        <p className="mt-1.5 text-xs text-ink-600">
          {notesEnabled ? (
            <>
              Viewing <strong>{value}</strong>&rsquo;s draw — your notes on their opponents
            </>
          ) : (
            <>
              Viewing <strong>{value}</strong>&rsquo;s draw — prep for their opponents
            </>
          )}
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
  competitions,
  forcedVisible = false,
  initialCompetitionSlug = null,
  initialPlayerName = null,
  /** Gift / non-Premium preview: hide scouting notes (past games still show). */
  disableNotes = false,
  /**
   * Ticket screenshot mode (1–8). Gates features and reshapes fixture data.
   * Notes stay hidden on stages 1–7; stage 8 enables them (unless `disableNotes`).
   */
  buildStage = null,
}: Props & {
  forcedVisible?: boolean
  initialCompetitionSlug?: string | null
  initialPlayerName?: string | null
  disableNotes?: boolean
  buildStage?: DrawCompanionBuildStage | null
}) {
  const playerPickerId = useId()
  const deepLink = useMemo(() => readDrawScoutDeepLink(), [])
  const buildFeatures = buildStage != null ? getDrawCompanionBuildFeatures(buildStage) : null
  const hideNotes =
    disableNotes || (buildFeatures != null && !buildFeatures.showNotes)
  const resolvedCompetitions = useMemo(() => {
    const base = competitions ?? getDrawScoutPreviewCompetitions()
    if (buildStage == null) return base
    return base.map((comp) => applyDrawCompanionBuildStage(comp, buildStage))
  }, [buildStage, competitions])
  const activeCompetitions = useMemo(
    () => listActiveDrawScoutCompetitions(resolvedCompetitions),
    [resolvedCompetitions],
  )

  const autoShow = useMemo(
    () =>
      shouldAutoShowDrawScoutCard(resolvedCompetitions, {
        youName: playerName,
        deepLinkSlug: deepLink.drawSlug ?? initialCompetitionSlug,
      }),
    [resolvedCompetitions, deepLink.drawSlug, initialCompetitionSlug, playerName],
  )

  const showCard = forcedVisible || autoShow

  const [competitionSlug, setCompetitionSlug] = useState<string | null>(() =>
    getDefaultCompetitionSlug(activeCompetitions, {
      youName: playerName,
      deepLinkSlug: deepLink.drawSlug ?? initialCompetitionSlug,
    }),
  )

  const competition =
    activeCompetitions.find((comp) => comp.slug === competitionSlug) ?? null

  const [viewingPlayerName, setViewingPlayerName] = useState(() => {
    const initialComp =
      activeCompetitions.find((comp) => comp.slug === competitionSlug) ?? null
    if (!initialComp) return ''
    if (initialPlayerName) {
      const match = getEntrantForCompetition(initialComp, initialPlayerName)
      if (match) return match.name
    }
    if (deepLink.playerName) {
      const match = getEntrantForCompetition(initialComp, deepLink.playerName)
      if (match) return match.name
    }
    return getDefaultPlayerName(initialComp, playerName) ?? ''
  })

  useEffect(() => {
    if (!competition) return
    // Prefer an explicit initial/deep-link player only when they are entered;
    // otherwise default to "you" so the picker is never left blank.
    if (initialPlayerName) {
      const match = getEntrantForCompetition(competition, initialPlayerName)
      if (match) {
        setViewingPlayerName(match.name)
        return
      }
    }
    if (deepLink.playerName) {
      const match = getEntrantForCompetition(competition, deepLink.playerName)
      if (match) {
        setViewingPlayerName(match.name)
        return
      }
    }
    setViewingPlayerName(getDefaultPlayerName(competition, playerName) ?? '')
  }, [competition, deepLink.playerName, initialPlayerName, playerName])

  useEffect(() => {
    if (initialCompetitionSlug) {
      setCompetitionSlug(initialCompetitionSlug)
    }
  }, [initialCompetitionSlug])

  const displayNotes = useMemo(
    () => (hideNotes ? [] : mergeDrawScoutDisplayNotes(allNotes)),
    [allNotes, hideNotes],
  )
  const displayMatches = useMemo(() => {
    if (buildFeatures != null && !buildFeatures.showMatchHistory) return []
    return mergeDrawScoutDisplayMatches(allMatches)
  }, [allMatches, buildFeatures])

  const matchByKey = useMemo(() => {
    const map = new Map<string, NormalizedMatch>()
    for (const match of displayMatches) {
      map.set(recapMatchKey(match), match)
    }
    return map
  }, [displayMatches])

  const pendingDisciplineScrollRef = useRef<string | null>(null)

  const scrollToDiscipline = useCallback((disciplineCode: string) => {
    const el = document.getElementById(drawCompanionDisciplineSectionId(disciplineCode))
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useLayoutEffect(() => {
    const disciplineCode = pendingDisciplineScrollRef.current
    if (disciplineCode == null) return
    pendingDisciplineScrollRef.current = null
    scrollToDiscipline(disciplineCode)
  }, [viewingPlayerName, scrollToDiscipline])

  const onBusyPlayer = useCallback(
    (busyPlayerName: string, disciplineCode: string, profileUrl?: string) => {
      const jump = resolveDrawCompanionBusyJump(
        busyPlayerName,
        disciplineCode,
        competition,
        profileUrl,
      )
      if (jump.kind === 'companion') {
        if (viewingPlayerName === jump.playerName) {
          scrollToDiscipline(jump.disciplineCode)
        } else {
          pendingDisciplineScrollRef.current = jump.disciplineCode
          setViewingPlayerName(jump.playerName)
        }
        return
      }
      if (jump.kind === 'profile') {
        window.location.assign(jump.url)
      }
    },
    [competition, scrollToDiscipline, viewingPlayerName],
  )

  const jumpContext = useMemo(() => ({ onBusyPlayer }), [onBusyPlayer])

  if (!showCard || activeCompetitions.length === 0) return null

  const showDraw = buildFeatures == null || buildFeatures.showDraw
  const showPlayerPicker = buildFeatures == null || buildFeatures.showPlayerPicker
  const matchHistoryEnabled = buildFeatures == null || buildFeatures.showMatchHistory

  const entrant =
    competition && viewingPlayerName
      ? getEntrantForCompetition(competition, viewingPlayerName)
      : null

  const freshnessLine =
    showDraw && competition != null ? formatResultsLastUpdatedLine(competition) : null
  const competitionStatus: DrawCompetitionStatus | null =
    competition != null
      ? {
          resultsLastUpdatedAt: competition.resultsLastUpdatedAt,
          busyPlayersByName: competition.busyPlayersByName,
        }
      : null

  return (
    <DrawCompanionJumpContext.Provider value={jumpContext}>
    <section className="overflow-hidden rounded-2xl border border-brand-200/80 bg-gradient-to-b from-brand-50/50 to-white shadow-sm">
      <div className="border-b border-brand-100/80 px-4 py-3 sm:px-5">
        <h3 className="text-lg font-semibold text-ink-900">Draw companion</h3>

        {competition && showPlayerPicker && (
          <div className="mt-2">
            <PlayerCombobox
              id={playerPickerId}
              competition={competition}
              value={viewingPlayerName}
              onChange={setViewingPlayerName}
              notesEnabled={!hideNotes}
            />
          </div>
        )}
        {freshnessLine != null ? (
          <p className="mt-2 text-xs font-medium text-ink-500">{freshnessLine}</p>
        ) : null}
      </div>

      <div className="px-4 py-3 sm:px-5">
        {!showDraw ? (
          <p className="text-sm text-ink-600">
            Your draw appears here once Companion content is wired up.
          </p>
        ) : !entrant ? (
          <p className="text-sm text-ink-600">Choose a player to view their draw.</p>
        ) : (
          <div className="space-y-6">
            {entrant.disciplineGroups.map((group) => (
              <DisciplineBlock
                key={group.disciplineCode}
                group={group}
                laterOpponents={competition?.laterOpponentsByEntrant[entrant.name] ?? []}
                displayNotes={displayNotes}
                displayMatches={displayMatches}
                playerName={playerName}
                matchByKey={matchByKey}
                viewingOwnDraw={entrant.isYou === true}
                viewedPlayerName={viewingPlayerName}
                competitionStatus={competitionStatus}
                matchHistoryEnabled={matchHistoryEnabled}
              />
            ))}
          </div>
        )}
      </div>
    </section>
    </DrawCompanionJumpContext.Provider>
  )
}

export function useDrawScoutVisibility(competitions?: DrawScoutCompetition[]) {
  const deepLink = useMemo(() => readDrawScoutDeepLink(), [])
  const resolvedCompetitions = useMemo(
    () => competitions ?? getDrawScoutPreviewCompetitions(),
    [competitions],
  )
  const activeCount = listActiveDrawScoutCompetitions(resolvedCompetitions).length
  return {
    hasActiveCompetitions: activeCount > 0,
    deepLink,
  }
}
