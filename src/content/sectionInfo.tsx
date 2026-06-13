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
      you are winning matches you were expected to lose.
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
        Wins where you were the underdog — ranked by how much higher-rated the opposition was,
        with your pre-match win chance from the official rating-difference table.
      </p>
      {excludeStrengthDuplicates ? (
        <p>
          Matches already in your top {limit} strongest beaten are skipped so the two lists do
          not repeat the same match.
        </p>
      ) : (
        <p>
          Matches can appear in both lists, including those already shown in your strongest
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

export const categoryMilestonesInfo = (
  <div className={infoBlockClass}>
    <p>
      Your best-ever finish at each tournament level and age combination, across all disciplines.
      By default we show your two most relevant age bands, with Senior prioritised when you
      have played at that level.
    </p>
    <p>
      Tap <strong>Show earlier age groups</strong> to reveal younger age bands from further back
      in your career. Within each age, rows are ordered Copper, Bronze, Silver, Gold, and Other.
      Use the filters to narrow by discipline family or time period.
    </p>
    <p>
      County events and tournaments without recognizable group or knockout rounds are excluded.
      Only competitive matches count — walkovers and no-match rows are left out.
    </p>
    <p>
      Milestones are cumulative: reaching runner-up also ticks off group wins, quarter-final,
      and semi-final for that category — including when you skip a round (e.g. box straight to
      semi-final). Tap a green tick to see when you first reached that stage — competition,
      date, and partner.
    </p>
    <p>
      In knockout-only events you must win a match to credit quarter-finals or deeper. A lone
      quarter-final loss counts as a group exit. Round-robin-only winners (3+ teams, all group
      matches won) count as Winner.
    </p>
  </div>
)

export const tournamentProgressionInfo = (
  <div className={infoBlockClass}>
    <p>
      One entry per competition and discipline. Typical depth is the median finish at your
      most-played tournament level and age — so a harder Gold run does not pull down your Bronze
      average.
    </p>
    <p>
      Finish distribution covers every classified tournament in your current filter.
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
    <p>
      Knockout-only draws require a win to reach that round; a single quarter-final loss without
      a group phase stays at group depth. After a box or round-robin phase, reaching semi-finals
      or finals counts even when quarter-finals were not played.
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
      Your badminton season runs from 1 October to 30 September. This board fills in as you
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
    <p>
      This season&apos;s accolades lead with podium finishes — winners, runner-up, and 3rd place
      (semi-final exits with at least one competitive win, or bronze finals after a real win
      earlier in the event). Small round robins and walkover-only paths do not award 3rd place.
      Personal bests list deeper non-podium runs that beat your prior best at that tournament
      level, age group, and discipline. First-time and repeat titles use the same age grouping.
      Tournament level chips show the event grade, not the medal position.
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
      Only competitive wins and losses count. Walkovers and no-match rows are excluded.
      Only wins where they were rated higher than you at the time count toward this list.
    </p>
  </div>
)
