import type { AxisKey, PlayerCode, PlayerProfile, ProfileComparison } from './playerProfile'
import { compareProfiles as compareProfilesBase } from './playerProfile'

export type ArchetypeContent = {
  code: PlayerCode
  name: string
  tagline: string
  celebration: string
  contextBullets: string[]
  improvementTips: string[]
}

export const ARCHETYPES: Record<PlayerCode, ArchetypeContent> = {
  FCLR: {
    code: 'FCLR',
    name: 'The Ice Closer',
    tagline: 'You close out tight matches and rarely slip when you should win.',
    celebration: 'When it gets tight, you tend to find a way.',
    contextBullets: [
      'Your **Best wins** section shows the upsets; your overall record shows you bank the favourites too.',
      '**Tournament progression** reflects how deep you usually go once you’re in the draw.',
      'Partners see you as someone who doesn’t panic in the third game.',
    ],
    improvementTips: [
      'Keep doing what you do in game three — it’s a real edge.',
      'If you want a stretch goal, hunt one more upset per season against a higher-rated pair.',
    ],
  },
  FCLW: {
    code: 'FCLW',
    name: 'The Firecracker',
    tagline: 'Brilliant in the clutch, with results that can swing from week to week.',
    celebration: 'You’re at your best when the crowd could go either way.',
    contextBullets: [
      '**Results over time** may show spikes — that’s the Firecracker pattern.',
      '**Nemeses & favourite opponents** can explain some of the wilder weekends.',
      'When you’re on, you’re very on.',
    ],
    improvementTips: [
      'Pick one favourite match per event to treat as must-win — that stabilises the record.',
      'After a big win, note what you did in game three and repeat it deliberately.',
    ],
  },
  FCOR: {
    code: 'FCOR',
    name: 'The Executioner',
    tagline: 'You finish strong, beat up when it counts, and stay calm when ahead.',
    celebration: 'You punish favourites and don’t need drama to get the job done.',
    contextBullets: [
      '**Best wins** is your highlight reel; many may be upsets.',
      'You’re less about nail-biters and more about controlled scorelines.',
      '**Partner chemistry** shows who helps you execute the game plan.',
    ],
    improvementTips: [
      'Lean into 2–0 wins when you’re favourite — save energy for later rounds.',
      'Identify one opponent tier where you’re still below 50% and target them in training blocks.',
    ],
  },
  FCOW: {
    code: 'FCOW',
    name: 'The Showstopper',
    tagline: 'Big moments and big upsets — unpredictable but exciting to watch.',
    celebration: 'People remember your weekends.',
    contextBullets: [
      '**Best wins** and recap-style tight matches tell your story.',
      'Favourites don’t always know which version of you turns up.',
      '**Results over time** is worth watching for hot and cold patches.',
    ],
    improvementTips: [
      'Convert one more favourite match per month — that’s the fastest route to a steadier ranking.',
      'Before events, write down a simple game-one plan so you don’t rely on comebacks every time.',
    ],
  },
  FHLR: {
    code: 'FHLR',
    name: 'The Bulldog',
    tagline: 'You grind out wins you should get and battle hard when it’s close.',
    celebration: 'Reliable and fierce — a tough draw.',
    contextBullets: [
      'You may not chase the flashiest upsets, but you win the matches you’re supposed to.',
      '**Tournament progression** shows steady depth rather than one-off miracles.',
      'Third games are still a strength even if game one is where you set the tone.',
    ],
    improvementTips: [
      'Pick one higher-rated favourite opponent per quarter — watch them play when you’re at the same event and plan around what you see.',
      'When you’re favourite, aim for 2–0 scorelines to save legs for later rounds.',
    ],
  },
  FHLW: {
    code: 'FHLW',
    name: 'The Rollercoaster',
    tagline: 'Strong finisher with dramatic highs and lows.',
    celebration: 'No two weekends need to feel the same.',
    contextBullets: [
      '**Results over time** is the place to spot runs of form.',
      'You finish matches well even when the tournament started chaotically.',
      'Partners and opponents both know you can pop up anywhere.',
    ],
    improvementTips: [
      'Track favourite-match conversion for a month — small gains there flatten the rollercoaster.',
      'After losses as favourite, review game one only; patterns often show up early.',
    ],
  },
  FHOR: {
    code: 'FHOR',
    name: 'The Metronome',
    tagline: 'Dependable when you’re the favourite; you wear opponents down.',
    celebration: 'Consistency is your superpower.',
    contextBullets: [
      '**All-time summary** and **Results over time** should look reassuringly steady.',
      'You may not need three games — you close in two when ahead.',
      '**Tournament progression** rewards this style over a season.',
    ],
    improvementTips: [
      'Add one targeted upset goal per season to grow without losing reliability.',
      'In tight matches, rehearse one clutch pattern (serve receive, third-shot) before the event.',
    ],
  },
  FHOW: {
    code: 'FHOW',
    name: 'The Spark',
    tagline: 'Flashes of brilliance without a steady floor — yet.',
    celebration: 'When it clicks, you look unstoppable.',
    contextBullets: [
      '**Best wins** may be stellar while **All-time summary** win % wobbles.',
      'You finish well in individual matches even if weekends vary.',
      '**Tournament partners** can show who brings out your best.',
    ],
    improvementTips: [
      'Treat favourite matches as non-negotiable — that’s the biggest lever.',
      'Build a pre-match routine for game one so good days aren’t accidental.',
    ],
  },
  GCLR: {
    code: 'GCLR',
    name: 'The Iron Marathoner',
    tagline: 'Long battles, giant-killer upsets, and a steady floor.',
    celebration: 'You outlast people — in matches and over a season.',
    contextBullets: [
      'Game one may be a slog; your record still holds up.',
      '**Best wins** likely features real upsets.',
      'You’re dangerous in **three-game** scorelines.',
    ],
    improvementTips: [
      'Invest in faster game-one starts so you spend less energy catching up.',
      'Keep banking favourites — that’s what makes the upsets meaningful.',
    ],
  },
  GCLW: {
    code: 'GCLW',
    name: 'The Giant Killer',
    tagline: 'Classic underdog who thrives when it’s tight.',
    celebration: 'You raise your level when the rating sheet says you shouldn’t.',
    contextBullets: [
      '**Best wins** and **Nemeses & favourite opponents** are your home turf.',
      'Close matches are where you’re most alive.',
      'The overall record may swing — the upsets are real.',
    ],
    improvementTips: [
      'Win one more favourite match per event — giants still need a stable base.',
      'Study game-one patterns in losses; a slightly stronger opener reduces must-win game threes.',
    ],
  },
  GCOR: {
    code: 'GCOR',
    name: 'The Tactician',
    tagline: 'Patient grinder who picks off favourites without needing chaos.',
    celebration: 'You think your way through matches.',
    contextBullets: [
      'Upsets show up in **Best wins**; scorelines may still look controlled.',
      'You’re not reliant on buzzer-beaters every week.',
      '**Partner chemistry** matters — you execute plans with the right pair.',
    ],
    improvementTips: [
      'Sharpen game-one intensity — your best work often comes after you’re warmed up.',
      'Pick one favourite you’ve lost twice and watch them play at the next competition — note how they win cheap points.',
    ],
  },
  GCOW: {
    code: 'GCOW',
    name: 'The Maverick',
    tagline: 'Upsets and chaos without a predictable pattern.',
    celebration: 'You keep draws interesting.',
    contextBullets: [
      'Any section of the page could feature you on a given weekend.',
      '**Results over time** tells the story of hot runs.',
      'Opponents can’t assume anything from the rating gap alone.',
    ],
    improvementTips: [
      'Stabilise favourite conversion first — mavericks still need a floor.',
      'Choose one discipline and one partner for a full season to see if patterns clarify.',
    ],
  },
  GHLR: {
    code: 'GHLR',
    name: 'The Rock',
    tagline: 'Consistent, composed, wins the matches you’re supposed to.',
    celebration: 'People want you in their pool because you’re steady.',
    contextBullets: [
      '**All-time summary** and **Tournament progression** should align with “dependable”.',
      'You may not headline **Best wins** every month — and that’s OK.',
      'Draws treat you as the favourite for a reason.',
    ],
    improvementTips: [
      'If you want more growth, schedule one upset target per quarter.',
      'In rare tight matches, practise one high-pressure receive pattern.',
    ],
  },
  GHLW: {
    code: 'GHLW',
    name: 'The Joker',
    tagline: 'You can’t script it — form varies wildly.',
    celebration: 'You’re never boring on a tournament sheet.',
    contextBullets: [
      '**Results over time** is essential for spotting runs.',
      'When you beat a favourite, check **Best wins** — it was earned.',
      'Partners may see very different versions of you.',
    ],
    improvementTips: [
      'Log favourite W/L for six weeks — one metric, big payoff.',
      'Simplify game one: one serve, one receive pattern, repeat.',
    ],
  },
  GHOR: {
    code: 'GHOR',
    name: 'The Anchor',
    tagline: 'Composed, reliable, doesn’t chase highlight-reel upsets.',
    celebration: 'Teams know what they’re getting from you.',
    contextBullets: [
      '**Partner chemistry** and **Tournament partners** may be where you shine brightest.',
      'You win efficiently when ahead — fewer three-game epics.',
      'Rankings move slowly but fairly for Anchors.',
    ],
    improvementTips: [
      'Add a single upset goal if you want to climb faster without losing your identity.',
      'Review one close loss per month — small clutch tweaks add up.',
    ],
  },
  GHOW: {
    code: 'GHOW',
    name: 'The Wild Card',
    tagline: 'Results swing more than your rating suggests — highs and lows in the same season.',
    celebration: 'You’re the player everyone checks the sheet for.',
    contextBullets: [
      '**Results over time** and **All-time summary** may tell different stories.',
      '**Best wins** can be spectacular; so can surprise losses when you’re favourite.',
      'Draws don’t know which version of you they’re getting.',
    ],
    improvementTips: [
      'Focus on favourite matches for one season — that’s the stabiliser.',
      'After good weekends, write down game-one tactics while they’re fresh.',
    ],
  },
}

const AXIS_TIP_TEMPLATES: Record<
  AxisKey,
  { high: string; low: string }
> = {
  F: {
    high: 'Your third-game win rate is a weapon — protect it with smart energy in earlier rounds.',
    low: 'Work on game-one intensity; you often grind back, but earlier leads save energy.',
  },
  U: {
    high: 'Keep hunting upsets, but don’t skip the favourites — that’s how Crushers climb.',
    low: 'Pick one higher-rated opponent per event and watch them play during the competition — small upset gains add up.',
  },
  C: {
    high: 'In tight matches, stick to one rehearsed pattern under pressure — you already have the temperament.',
    low: 'Practise one clutch scenario (receive at 20–20) so tight matches feel familiar.',
  },
  S: {
    high: 'Your favourite conversion is strong — protect it when tired on day two of an event.',
    low: 'When you’re favourite on paper, treat it as must-win — that’s your biggest ranking lever.',
  },
}

export function getArchetype(code: PlayerCode): ArchetypeContent {
  return ARCHETYPES[code]
}

export function getArchetypeName(code: PlayerCode): string {
  return ARCHETYPES[code].name
}

export function getImprovementTips(profile: PlayerProfile): string[] {
  if (!profile.code) return []

  const archetype = getArchetype(profile.code)
  const weakest = [...profile.axes].sort((a, b) => a.score - b.score)[0]
  const axisTip = weakest ? AXIS_TIP_TEMPLATES[weakest.key][weakest.pole] : null

  const tips = [...archetype.improvementTips]
  if (axisTip && !tips.includes(axisTip)) {
    tips.unshift(axisTip)
  }

  return tips.slice(0, 2)
}

export function compareProfiles(
  allTime: PlayerProfile,
  recent: PlayerProfile,
): ProfileComparison {
  return compareProfilesBase(allTime, recent, getArchetypeName)
}
