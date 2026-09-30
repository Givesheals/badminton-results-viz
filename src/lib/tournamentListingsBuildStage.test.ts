import { describe, expect, it } from 'vitest'
import { listingTitleWithAgeChips } from './tournamentListingsBuildStage'

describe('listingTitleWithAgeChips', () => {
  it('moves a written age band to a chip at the end', () => {
    expect(listingTitleWithAgeChips('Dorset Under 13 Restricted 2026', 'junior', ['U13'])).toEqual({
      text: 'Dorset Restricted 2026',
      chips: ['U13'],
    })
  })

  it('moves abbreviated bands, including lowercase ones', () => {
    expect(listingTitleWithAgeChips('Wiltshire U19 Silver October 2026', 'junior', ['U19'])).toEqual({
      text: 'Wiltshire Silver October 2026',
      chips: ['U19'],
    })
    expect(listingTitleWithAgeChips('SBA u17 Bronze October', 'junior', ['U17'])).toEqual({
      text: 'SBA Bronze October',
      chips: ['U17'],
    })
  })

  it('replaces Senior with a chip, including when the title does not say it', () => {
    expect(listingTitleWithAgeChips('Dorset Senior Restricted 2026', 'senior', [])).toEqual({
      text: 'Dorset Restricted 2026',
      chips: ['Senior'],
    })
    expect(listingTitleWithAgeChips('Cambridgeshire Restricted 2026', 'senior', [])).toEqual({
      text: 'Cambridgeshire Restricted 2026',
      chips: ['Senior'],
    })
  })

  it('does the same for Junior and Masters', () => {
    expect(listingTitleWithAgeChips('Guernsey Junior Restricted 2026', 'junior', [])).toEqual({
      text: 'Guernsey Restricted 2026',
      chips: ['Junior'],
    })
    expect(listingTitleWithAgeChips('Kent Masters Gold 2026', 'masters', [])).toEqual({
      text: 'Kent Gold 2026',
      chips: ['Masters'],
    })
    expect(listingTitleWithAgeChips('31st Cumbria Masters Silver', 'masters', [])).toEqual({
      text: '31st Cumbria Silver',
      chips: ['Masters'],
    })
  })

  it('shows every band on the tournament, not only words in the title', () => {
    expect(
      listingTitleWithAgeChips('Guernsey Restricted 2026', 'junior', ['U11', 'U13', 'U15', 'U17', 'U19']),
    ).toEqual({
      text: 'Guernsey Restricted 2026',
      chips: ['U11', 'U13', 'U15', 'U17', 'U19'],
    })
  })
})
