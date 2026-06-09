import type { RecapInsight } from '../../../lib/tournamentRecap'
import { RecapFactCard } from './RecapFactCard'

type Props = {
  emojiInsights: RecapInsight[]
  otherEventInsights: RecapInsight[]
}

export function RecapEmojiInsightSection({
  emojiInsights,
  otherEventInsights,
}: Props) {
  if (emojiInsights.length === 0 && otherEventInsights.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {emojiInsights.length > 0 && (
        <>
          <h4 className="text-sm font-medium text-ink-900">Event highlights</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {emojiInsights.map((insight, index) => (
              <RecapFactCard
                key={`${insight.kind}-${index}`}
                insight={insight}
              />
            ))}
          </div>
        </>
      )}
      {otherEventInsights.length > 0 && (
        <div className="space-y-2">
          {otherEventInsights.map((insight, index) => (
            <RecapFactCard
              key={`${insight.kind}-${index}`}
              insight={insight}
            />
          ))}
        </div>
      )}
    </div>
  )
}
