import { getDisciplineFamily, getDisciplineStyle } from '../../lib/disciplineStyle'
import type {
  DrawDisciplineGroup,
  DrawMatchup,
  DrawNoteLine,
  DrawOutEmailData,
  DrawPlayer,
} from '../../lib/notificationPreviewData'
import {
  EmailFooter,
  EmailFrame,
  EmailGhostButton,
  EmailHeader,
  EmailLink,
  EmailSectionHeading,
} from './EmailChrome'

const DISCIPLINE_DOT: Record<string, string> = {
  mixed: 'bg-discipline-mixed',
  doubles: 'bg-discipline-doubles',
  singles: 'bg-discipline-singles',
  unknown: 'bg-ink-300',
}

/** Shared column template so the matchup rows and note rows line up. */
const DRAW_GRID = 'grid grid-cols-[5rem_1fr_1fr] items-start gap-x-3 gap-y-1.5'

function TagChip({ label }: { label: string }) {
  return (
    <span className="mr-1 inline-block rounded-full border border-brand-500 bg-white px-1.5 py-0.5 text-xs font-medium text-brand-700">
      {label}
    </span>
  )
}

function DisciplineChip({ code }: { code: string }) {
  const style = getDisciplineStyle(code)
  return (
    <span
      className={`mr-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${style.chipClass}`}
    >
      {style.chipLabel}
    </span>
  )
}

/**
 * One saved note rendered as two grid cells: the player (aligned under the
 * round label column) and the note content spanning the two team columns.
 */
function NoteRowCells({ note, spanTeams }: { note: DrawNoteLine; spanTeams?: boolean }) {
  const meta = [note.facingLabel, note.competition, note.date].filter(Boolean).join(' \u00b7 ')
  return (
    <>
      <p className="col-start-1 text-xs font-semibold text-ink-800">{note.opponentName}</p>
      <div className={`text-sm leading-snug ${spanTeams ? 'col-span-2' : ''}`.trim()}>
        {note.disciplineChip && <DisciplineChip code={note.disciplineChip} />}
        {note.tags.map((tag) => (
          <TagChip key={tag} label={tag} />
        ))}
        <span className="text-ink-700">{note.body}</span>
        {note.pairingCaveat && <span className="text-ink-400"> ({note.pairingCaveat})</span>}
        <span className="mt-0.5 block text-xs text-ink-400">{meta}</span>
      </div>
    </>
  )
}

function TeamSide({ players }: { players: DrawPlayer[] }) {
  return (
    <div className="space-y-0.5">
      {players.map((p, index) => (
        <div key={p.name} className="text-sm leading-snug text-ink-900">
          {p.seedLabel && <span className="mr-1 font-semibold text-ink-500">{p.seedLabel}</span>}
          <EmailLink href={p.url}>{p.name}</EmailLink>
          {index < players.length - 1 && <span className="text-ink-400"> &</span>}
        </div>
      ))}
    </div>
  )
}

function MatchupBlock({ label, matchup }: { label: string; matchup: DrawMatchup }) {
  return (
    <div className={`${DRAW_GRID} border-t border-ink-100 py-3 first:border-t-0`}>
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <TeamSide players={matchup.yourSide} />
      <TeamSide players={matchup.opponentSide} />
      {matchup.notes.map((note, index) => (
        <NoteRowCells key={`${note.opponentName}-${index}`} note={note} spanTeams />
      ))}
    </div>
  )
}

function DisciplineBlock({ group }: { group: DrawDisciplineGroup }) {
  const dotClass = DISCIPLINE_DOT[getDisciplineFamily(group.disciplineCode)]
  return (
    <div className="mt-6 first:mt-0">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden />
        <h3 className="text-sm font-bold text-ink-900">{group.disciplineLabel}</h3>
      </div>
      <div className="mt-1">
        {group.matchups.map((matchup) => (
          <MatchupBlock
            key={matchup.id}
            label={`${group.disciplineCode}: ${matchup.roundLabel}`}
            matchup={matchup}
          />
        ))}
      </div>
    </div>
  )
}

function LaterNotes({
  notes,
  seeAllUrl,
}: {
  notes: DrawNoteLine[]
  seeAllUrl: string
}) {
  if (notes.length === 0) return null
  return (
    <div className="mt-8 rounded-xl bg-ink-50 px-5 py-4">
      <h3 className="text-sm font-semibold text-ink-700">You may also meet</h3>
      <p className="mb-3 mt-0.5 text-xs text-ink-500">
        Entered this draw but not in your group - you could face them in the knockouts.
      </p>
      <div className="grid grid-cols-[5rem_1fr] items-start gap-x-3 gap-y-2">
        {notes.map((note, index) => (
          <NoteRowCells key={`${note.opponentName}-${index}`} note={note} />
        ))}
      </div>
      <div className="mt-3">
        <EmailGhostButton href={seeAllUrl}>See all draw notes →</EmailGhostButton>
      </div>
    </div>
  )
}

export function DrawOutEmail({ data }: { data: DrawOutEmailData }) {
  return (
    <EmailFrame>
      <EmailHeader />
      <div className="px-6 pb-6">
        <p className="text-sm text-ink-700">Hi {data.recipientFirstName},</p>
        <p className="mt-4 text-sm text-ink-700">
          The draw for{' '}
          <EmailLink href={data.competitionUrl}>{data.competitionName}</EmailLink> is now out. You
          and {data.favouritesCount} of your favourites have entered this tournament.
        </p>

        <div className="mt-6">
          <EmailSectionHeading>Your draw preview</EmailSectionHeading>
          {data.disciplineGroups.map((group) => (
            <DisciplineBlock key={group.disciplineCode} group={group} />
          ))}
        </div>

        <LaterNotes notes={data.laterNotes} seeAllUrl={data.seeAllDrawNotesUrl} />
      </div>

      <EmailFooter
        unsubscribeUrl={data.unsubscribeUrl}
        optOut={
          <>
            Not interested in this draw? Disable draw notifications in{' '}
            <EmailLink href={data.notificationSettingsUrl}>notification settings</EmailLink>.
          </>
        }
      />
    </EmailFrame>
  )
}
