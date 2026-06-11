import type { ReactNode } from 'react'

const infoBlockClass = 'space-y-2'

export const partnerHighlightsInfo = (
  <div className={infoBlockClass}>
    <p>
      How far you go together with each partner in tournaments, ranked by event volume and
      how deep you usually run.
    </p>
    <p>
      County events and events without knockout or group rounds in the data are not included.
      Walkover finals can count toward how far you went if you were awarded the win.
    </p>
  </div>
)

export const partnerChemistryInfo = (
  <div className={infoBlockClass}>
    <p>
      Actual win rate with each partner vs what match ratings predicted. Higher scores mean
      you are winning games you were expected to lose.
    </p>
    <p>
      Only competitive wins and losses with a partner count. Walkovers and &ldquo;no match&rdquo;
      rows are excluded. Any discipline with a partner name is included (doubles and mixed).
    </p>
    <p>For how far you go together in events, see Tournament partners above.</p>
  </div>
)

export const strongestBeatenInfo = (
  <div className={infoBlockClass}>
    <p>
      Your rated wins ranked by opponent strength — the average of opponent ratings in doubles.
    </p>
    <p>
      Walkovers, retirements, no-match rows, and wins without played game scores are excluded.
      Unrated wins do not appear here.
    </p>
  </div>
)

export function biggestUpsetsInfo(
  limit: number,
  excludeStrengthDuplicates: boolean,
): ReactNode {
  return (
    <div className={infoBlockClass}>
      <p>
        Rated wins where you were the bigger underdog, ranked by rating gap and shown with your
        pre-match win chance from the official rating-difference table.
      </p>
      {excludeStrengthDuplicates ? (
        <p>
          Matches already in your top {limit} strongest beaten are skipped so the two lists do
          not repeat the same game.
        </p>
      ) : (
        <p>
          Games can appear in both lists, including matches already shown in your strongest
          beaten highlights.
        </p>
      )}
      <p>
        Same exclusions as strongest beaten: no walkovers, retirements, or unrated wins without
        played scores.
      </p>
    </div>
  )
}

export const tournamentProgressionInfo = (
  <div className={infoBlockClass}>
    <p>
      One entry per competition and discipline. Your best finish is the deepest round reached;
      typical finish is the median across events.
    </p>
    <p>
      County events and tournaments without recognizable group or knockout rounds are excluded.
      Only competitive matches count — walkovers and no-match rows are left out.
    </p>
    <p>
      If you leave in the group phase, we distinguish exiting in group stages from exiting after
      at least one group match win. Early knockout rounds are grouped with quarter-finals on the
      depth bar.
    </p>
  </div>
)

export const nemesesInfo = (
  <div className={infoBlockClass}>
    <p>
      Opponents you have lost to more than you have beaten, ranked by a score that favours
      frequent losses and close rating gaps when there are enough rivals.
    </p>
    <p>
      Only competitive wins and losses count. Walkovers and no-match rows are excluded.
      Retirements with normal scores may still count unless marked non-competitive in your data.
    </p>
  </div>
)

export const seasonJourneyInfo = (
  <div className={infoBlockClass}>
    <p>
      Your badminton season runs from 1 September to 31 August. This board fills in as you
      upload match history — ratings extend across the full season timeline, and quarter tiles
      track how many distinct tournaments you played in each season quarter.
    </p>
    <p>
      Play at least four tournaments in a quarter, then tap <strong>Claim</strong> to mark that
      quarter on your board. Only competitive matches count; walkovers and no-match rows are
      excluded.
    </p>
    <p>
      Tap a dot on the season weekends strip to see results and how far you went at that event.
    </p>
  </div>
)

export const favouriteOpponentsInfo = (
  <div className={infoBlockClass}>
    <p>
      Higher-rated opponents you have beaten repeatedly. Adjust the minimum wins to widen or
      narrow the list.
    </p>
    <p>
      Only competitive wins and losses count. Walkovers and no-match rows are excluded. A scalp
      win requires you to be rated lower than that opponent at the time.
    </p>
  </div>
)
