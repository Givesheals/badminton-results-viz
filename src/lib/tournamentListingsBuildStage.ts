/** Ticket build-out stages for the tournament listings page. */
export const TOURNAMENT_LISTINGS_BUILD_STAGES = [1, '2a', '2b', 3] as const
export type TournamentListingsBuildStage = (typeof TOURNAMENT_LISTINGS_BUILD_STAGES)[number]

export type ListingAgeFamily = 'junior' | 'senior' | 'masters'

export const TOURNAMENT_LISTINGS_BUILD_STAGE_META: Record<
  TournamentListingsBuildStage,
  { shortLabel: string; summary: string }
> = {
  1: {
    shortLabel: 'As now',
    summary: 'Tournament titles as written',
  },
  '2a': {
    shortLabel: 'On title',
    summary: 'Age chips sit at the end of the tournament name',
  },
  '2b': {
    shortLabel: 'Under type',
    summary: 'Age chips sit under the type badge',
  },
  3: {
    shortLabel: 'Cards',
    summary: 'Level badge on the left, age under the title',
  },
}

const FAMILY_CHIP: Record<ListingAgeFamily, string> = {
  junior: 'Junior',
  senior: 'Senior',
  masters: 'Masters',
}

const FAMILY_WORD: Record<string, RegExp> = {
  Junior: /\bjuniors?\b/gi,
  Senior: /\bseniors?\b/gi,
  Masters: /\bmasters?\b/gi,
}

/** Stage 2: show the tournament's age bands, and take those words out of the title. */
export function listingTitleWithAgeChips(
  name: string,
  family: ListingAgeFamily,
  ageIds: string[],
): { text: string; chips: string[] } {
  const chips = ageIds.length > 0 ? ageIds : [FAMILY_CHIP[family]]
  let text = name
  for (const chip of chips) {
    const familyWord = FAMILY_WORD[chip]
    if (familyWord) {
      text = text.replace(familyWord, ' ')
      continue
    }
    const band = chip.match(/^([UO])(\d{1,2})$/i)
    if (!band) continue
    const digits = band[2]
    const letter = band[1]
    const spoken = letter.toUpperCase() === 'O' ? 'over' : 'under'
    text = text.replace(new RegExp(`\\b${letter}${digits}\\b|\\b${spoken}\\s+${digits}\\b`, 'gi'), ' ')
  }
  return {
    text: text
      .replace(/\(\s*\)/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim(),
    chips,
  }
}
