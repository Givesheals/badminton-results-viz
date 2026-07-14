import { useEffect, useRef } from 'react'
import { useOpponentNotesContext } from '../../../context/OpponentNotesContext'
import { computeTournamentRecaps } from '../../../lib/tournamentRecap'
import { pickShowcaseRecapIndex } from '../../../lib/showcaseRecapPick'
import { usePremiumShowcase } from './PremiumShowcaseContext'

const SHOWCASE_NOTE_SEEDS = [
  {
    body: 'Flat mid-court exchanges — wait for the soft push.',
    customOpponentStyles: ['Flat-pace specialist'],
  },
  {
    body: 'Attack the forehand corner early in rallies.',
    customOpponentStyles: ['Weak forehand defence'],
  },
  {
    body: 'Loves the wide serve. Stand a half-step back on receive.',
    customOpponentStyles: ['Flat-pace specialist', 'Weak forehand defence'],
  },
] as const

/**
 * Seeds a few tagged scouting notes on the showcase's richest weekend
 * before recording begins, so note icons are visible from the first frame.
 */
export function ShowcaseRecapNotesBootstrap({ onReady }: { onReady?: () => void }) {
  const data = usePremiumShowcase()
  const { upsertNote, hasNotesForMatch } = useOpponentNotesContext()
  const doneRef = useRef(false)

  useEffect(() => {
    if (!data || doneRef.current) return

    const recaps = computeTournamentRecaps(data.allMatches).recaps
    const index = pickShowcaseRecapIndex(recaps)
    const recap = recaps[index]
    if (!recap) {
      doneRef.current = true
      onReady?.()
      return
    }

    let seedIndex = 0
    for (const discipline of recap.disciplines) {
      for (const match of discipline.matches) {
        if (seedIndex >= SHOWCASE_NOTE_SEEDS.length) break
        if (!hasNotesForMatch(match.noteContext.matchKey)) {
          const seed = SHOWCASE_NOTE_SEEDS[seedIndex]!
          const target =
            match.noteContext.opponentNames.length === 1
              ? ({ kind: 'opponent' as const, name: match.noteContext.opponentNames[0]! })
              : ({ kind: 'pair' as const })

          upsertNote(match.noteContext, seed.body, target, [], {
            customOpponentStyles: [...seed.customOpponentStyles],
          })
        }
        seedIndex += 1
      }
      if (seedIndex >= SHOWCASE_NOTE_SEEDS.length) break
    }

    doneRef.current = true
    // Let React apply note state before we signal ready to the recorder.
    requestAnimationFrame(() => onReady?.())
  }, [data, hasNotesForMatch, upsertNote, onReady])

  return null
}
