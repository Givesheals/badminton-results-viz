import { getDisciplineFamily } from '../../lib/disciplineStyle'
import type {
  DrawDisciplineGroup,
  DrawMatchup,
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

import { DRAW_MATCHUP_GRID } from '../notes/DrawMatchupRow'

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
    <div className={`${DRAW_MATCHUP_GRID} border-t border-ink-100 py-3 first:border-t-0`}>
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <TeamSide players={matchup.yourSide} />
      <TeamSide players={matchup.opponentSide} />
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

function DrawNotesCta({ data }: { data: DrawOutEmailData }) {
  if (data.notesOpponentCount <= 0) return null
  const label =
    data.notesOpponentCount === 1
      ? 'You have personal notes on 1 opponent in this draw.'
      : `You have personal notes on ${data.notesOpponentCount} opponents in this draw.`
  return (
    <div className="mt-8">
      <p className="text-sm text-ink-700">{label}</p>
      <div className="mt-3">
        <EmailGhostButton href={data.drawNotesUrl}>View draw notes →</EmailGhostButton>
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

        <DrawNotesCta data={data} />
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
