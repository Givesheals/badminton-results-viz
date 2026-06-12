import { useMemo } from 'react'
import type { NormalizedMatch } from '../../types/matchHistory'
import { seasonJourneyInfo } from '../../content/sectionInfo'
import { computeStatsFromMatches } from '../../lib/computeStats'
import { getSeasonForReferenceDate } from '../../lib/season'
import { computeSeasonJourney } from '../../lib/seasonJourney'
import { useSeasonClaims } from '../../hooks/useSeasonClaims'
import { useShareCapture } from '../../hooks/useShareCapture'
import { SHARE_ACCOLADE_LIMIT } from '../../lib/shareLimits'
import { SectionHeading } from '../ui/SectionHeading'
import { ShareButton } from '../ui/ShareButton'
import { SeasonQuarterBadges } from './SeasonQuarterBadges'
import { SeasonRatingChart } from './SeasonRatingChart'
import { SeasonStoryStrip } from './SeasonStoryStrip'
import { SeasonTrophyCabinet } from './SeasonTrophyCabinet'

type Props = {
  allMatches: NormalizedMatch[]
}

const SEASON_CARD_CLASS =
  'overflow-hidden rounded-2xl card-frame bg-white p-6 shadow-sm'

export function SeasonJourneySection({ allMatches }: Props) {
  const playerName = useMemo(
    () => computeStatsFromMatches(allMatches).playerName,
    [allMatches],
  )

  const seasonId = useMemo(() => getSeasonForReferenceDate(), [])

  const { claimedKeys, claimQuarter } = useSeasonClaims(playerName, seasonId)

  const journey = useMemo(
    () => computeSeasonJourney(allMatches, new Date(), claimedKeys),
    [allMatches, claimedKeys],
  )

  const hasSeasonActivity = journey.matchCount > 0

  const {
    shareRef: accoladesShareRef,
    share: shareAccolades,
    sharing: sharingAccolades,
    status: accoladesShareStatus,
  } = useShareCapture({
    filename: 'badminton-season-accolades.png',
    title: "This season's accolades",
  })
  const {
    shareRef: ratingsShareRef,
    share: shareRatings,
    sharing: sharingRatings,
    status: ratingsShareStatus,
  } = useShareCapture({
    filename: 'badminton-season-ratings.png',
    title: 'Ratings through the season',
  })

  return (
    <div className="space-y-6">
      <header>
        <SectionHeading info={seasonJourneyInfo} infoLabel="About season journey">
          <h3 className="text-lg font-semibold text-ink-900">{journey.title}</h3>
        </SectionHeading>
        <p className="mt-1 text-sm text-ink-600">{journey.rangeSubtitle}</p>

        {journey.headline && (
          <p className="mt-3 text-sm font-medium text-brand-700">{journey.headline}</p>
        )}

        {!hasSeasonActivity && (
          <p className="mt-3 text-sm text-ink-700">
            Your season board is ready — play and re-upload your sheet to watch it fill in.
          </p>
        )}
      </header>

      <section className={SEASON_CARD_CLASS}>
        <h4 className="text-sm font-medium text-ink-800">Performance</h4>
        <p className="mt-0.5 text-xs text-ink-500">Quarterly presence</p>
        <div className="mt-4">
          <SeasonQuarterBadges
            quarters={journey.quarters}
            onClaim={(key) => claimQuarter(key)}
          />
        </div>
        <div className="mt-8">
          <SeasonStoryStrip weekends={journey.weekends} />
        </div>
      </section>

      <section className={SEASON_CARD_CLASS}>
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-ink-800">Ratings through the season</h4>
          <ShareButton
            onClick={() => void shareRatings()}
            status={ratingsShareStatus}
            disabled={!journey.ratingSeries.some((s) => s.points.length > 0)}
          />
        </div>
        <div
          ref={ratingsShareRef}
          data-share-root
          className="mt-4 rounded-xl bg-white p-3"
        >
          <SeasonRatingChart
            series={journey.ratingSeries}
            seasonStartMs={journey.seasonStartMs}
            seasonEndMs={journey.seasonEndMs}
            shareMode={sharingRatings}
          />
        </div>
      </section>

      <section className={SEASON_CARD_CLASS}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-800">This season&apos;s accolades</p>
          <ShareButton
            onClick={() => void shareAccolades()}
            status={accoladesShareStatus}
            disabled={
              journey.accolades.totalPodiumCount === 0 &&
              journey.accolades.personalBests.length === 0
            }
          />
        </div>
        <div ref={accoladesShareRef} data-share-root className="mt-4">
          <SeasonTrophyCabinet
            accolades={journey.accolades}
            maxItems={sharingAccolades ? SHARE_ACCOLADE_LIMIT : undefined}
          />
        </div>
      </section>
    </div>
  )
}

