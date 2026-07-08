import { getDisciplineFamily } from '../../lib/disciplineStyle'
import type { CaptureNoteMatch, CaptureNotesEmailData } from '../../lib/notificationPreviewData'
import { FileCirclePlusIcon } from '../notes/OpponentNoteIcons'
import {
  EmailButton,
  EmailFooter,
  EmailFrame,
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

function MatchCard({ match }: { match: CaptureNoteMatch }) {
  const dotClass = DISCIPLINE_DOT[getDisciplineFamily(match.disciplineCode)]
  const outcomeClass = match.outcome === 'win' ? 'text-gain-700' : 'text-loss-700'

  return (
    <div className="flex items-center justify-between gap-3 border-t border-ink-100 py-4 first:border-t-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
          <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden />
          <span>{match.disciplineLabel}</span>
          <span className="text-ink-300" aria-hidden>
            ·
          </span>
          <span className="italic">{match.roundLabel}</span>
        </div>

        <p className="mt-1.5 text-sm text-ink-600">{match.playerSide}</p>
        <p className="text-sm text-ink-700">
          <span className="text-ink-400">vs</span>{' '}
          <span className="font-semibold text-ink-900">{match.opponentSide}</span>
        </p>

        <p className="mt-2 text-xs text-ink-500">
          <span className={`font-semibold ${outcomeClass}`}>{match.outcomeLabel}</span>
          {' · '}
          {match.scoreSummary}
        </p>
      </div>

      <EmailButton href={match.addNotesUrl} className="shrink-0">
        <FileCirclePlusIcon className="mr-1.5 h-3.5 w-3.5" />
        Add notes
      </EmailButton>
    </div>
  )
}

export function CaptureNotesEmail({ data }: { data: CaptureNotesEmailData }) {
  return (
    <EmailFrame>
      <EmailHeader />
      <div className="px-6 pb-6">
        <p className="text-sm text-ink-700">Hi {data.recipientFirstName},</p>
        <p className="mt-4 text-sm text-ink-700">
          While{' '}
          <EmailLink href={data.competitionUrl}>{data.competitionName}</EmailLink> is still
          fresh, jot down a few notes on your opponents — and give yourself the tactical edge
          next time you're drawn against them.
        </p>

        <div className="mt-6">
          <EmailSectionHeading>Your matches</EmailSectionHeading>
          <div>
            {data.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      </div>

      <EmailFooter
        unsubscribeUrl={data.unsubscribeUrl}
        signOff="Hope you had some good games!"
        optOut={
          <>
            You can turn these notifications on or off in{' '}
            <EmailLink href={data.notificationSettingsUrl}>notification settings</EmailLink>.
          </>
        }
      />
    </EmailFrame>
  )
}
