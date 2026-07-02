/** Subjective scouting tags for individual opponents. */
export const OPPONENT_STYLE_TAGS = [
  'front_court',
  'rear_court_attacker',
  'all_rounder',
  'flat_pace',
  'defensive_counter',
] as const

export type OpponentStyleTag = (typeof OPPONENT_STYLE_TAGS)[number]

export const OPPONENT_STYLE_LABELS: Record<OpponentStyleTag, string> = {
  front_court: 'Front-court player',
  rear_court_attacker: 'Rear-court attacker',
  all_rounder: 'All-rounder',
  flat_pace: 'Flat-pace specialist',
  defensive_counter: 'Defensive / counter-attacker',
}

export const OPPONENT_STYLE_HINTS: Record<OpponentStyleTag, string> = {
  front_court: 'Lives at the net; intercepts, pushes pace',
  rear_court_attacker: 'Smashes and lifts from the back',
  all_rounder: 'Comfortable front and back',
  flat_pace: 'Drives, fast exchanges, less lift',
  defensive_counter: 'Retrieves, turns defence into attack',
}

/** Pair-level scouting tags when target is the pair (doubles). */
export const PAIR_STYLE_TAGS = [
  'aggressive_front_back',
  'flat_fast',
  'defensive_retrieving',
  'unbalanced',
  'unfamiliar_partnership',
] as const

export type PairStyleTag = (typeof PAIR_STYLE_TAGS)[number]

export const PAIR_STYLE_LABELS: Record<PairStyleTag, string> = {
  aggressive_front_back: 'Aggressive front-back pair',
  flat_fast: 'Flat, fast pair',
  defensive_retrieving: 'Defensive / retrieving pair',
  unbalanced: 'Unbalanced (one carries)',
  unfamiliar_partnership: 'Unfamiliar partnership',
}

/** How the player felt in this match (match journal). */
export const SELF_FEEL_TAGS = ['tired', 'sharp', 'nervous'] as const

export type SelfFeelTag = (typeof SELF_FEEL_TAGS)[number]

export const SELF_FEEL_LABELS: Record<SelfFeelTag, string> = {
  tired: 'I was tired',
  sharp: 'I felt sharp',
  nervous: 'I was nervous',
}

/** Partner context in this match (match journal, doubles). */
export const PARTNER_CONTEXT_TAGS = ['partner_injured'] as const

export type PartnerContextTag = (typeof PARTNER_CONTEXT_TAGS)[number]

export const PARTNER_CONTEXT_LABELS: Record<PartnerContextTag, string> = {
  partner_injured: 'Partner injured',
}

/** Match flow / score narrative (match journal). */
export const MATCH_FLOW_TAGS = ['comeback_us', 'lost_lead'] as const

export type MatchFlowTag = (typeof MATCH_FLOW_TAGS)[number]

export const MATCH_FLOW_LABELS: Record<MatchFlowTag, string> = {
  comeback_us: 'We came back',
  lost_lead: 'We lost a lead',
}

/** @deprecated Legacy gameContext tag codes — migrated on read. */
const LEGACY_GAME_CONTEXT_TO_SELF_FEEL: Partial<Record<string, SelfFeelTag>> = {
  tired: 'tired',
  sharp: 'sharp',
  nervous: 'nervous',
}

const LEGACY_GAME_CONTEXT_TO_PARTNER: Partial<Record<string, PartnerContextTag>> = {
  partner_injured: 'partner_injured',
}

const LEGACY_GAME_CONTEXT_TO_MATCH_FLOW: Partial<Record<string, MatchFlowTag>> = {
  comeback: 'comeback_us',
  comeback_us: 'comeback_us',
  lost_lead: 'lost_lead',
}

export type NoteTags = {
  opponentStyles?: OpponentStyleTag[]
  pairStyles?: PairStyleTag[]
  selfFeel?: SelfFeelTag[]
  partnerContext?: PartnerContextTag[]
  matchFlow?: MatchFlowTag[]
  customOpponentStyles?: string[]
  customPairStyles?: string[]
  customSelfFeel?: string[]
  customGameEvents?: string[]
  /** @deprecated Migrated to selfFeel / partnerContext / matchFlow on read. */
  gameContext?: string[]
}

import { normalizeCustomTagList } from './customNoteTags'

function normalizeTagList<T extends string>(allowed: readonly T[], values?: T[]): T[] {
  if (values == null || values.length === 0) return []
  const valueSet = new Set(values)
  return allowed.filter((value) => valueSet.has(value))
}

function migrateLegacyGameContext(tags: NoteTags): NoteTags {
  if (tags.gameContext == null || tags.gameContext.length === 0) return tags
  const selfFeel = [...(tags.selfFeel ?? [])]
  const partnerContext = [...(tags.partnerContext ?? [])]
  const matchFlow = [...(tags.matchFlow ?? [])]
  for (const legacy of tags.gameContext) {
    const self = LEGACY_GAME_CONTEXT_TO_SELF_FEEL[legacy]
    if (self != null && !selfFeel.includes(self)) selfFeel.push(self)
    const partner = LEGACY_GAME_CONTEXT_TO_PARTNER[legacy]
    if (partner != null && !partnerContext.includes(partner)) partnerContext.push(partner)
    const flow = LEGACY_GAME_CONTEXT_TO_MATCH_FLOW[legacy]
    if (flow != null && !matchFlow.includes(flow)) matchFlow.push(flow)
  }
  const { gameContext: _removed, ...rest } = tags
  return {
    ...rest,
    ...(selfFeel.length > 0 ? { selfFeel: normalizeTagList(SELF_FEEL_TAGS, selfFeel) } : {}),
    ...(partnerContext.length > 0
      ? { partnerContext: normalizeTagList(PARTNER_CONTEXT_TAGS, partnerContext) }
      : {}),
    ...(matchFlow.length > 0 ? { matchFlow: normalizeTagList(MATCH_FLOW_TAGS, matchFlow) } : {}),
  }
}

export function normalizeNoteTags(tags?: NoteTags): NoteTags | undefined {
  if (tags == null) return undefined
  const migrated = migrateLegacyGameContext(tags)
  const opponentStyles = normalizeTagList(OPPONENT_STYLE_TAGS, migrated.opponentStyles)
  const pairStyles = normalizeTagList(PAIR_STYLE_TAGS, migrated.pairStyles)
  const selfFeel = normalizeTagList(SELF_FEEL_TAGS, migrated.selfFeel)
  const partnerContext = normalizeTagList(PARTNER_CONTEXT_TAGS, migrated.partnerContext)
  const matchFlow = normalizeTagList(MATCH_FLOW_TAGS, migrated.matchFlow)
  const customOpponentStyles = normalizeCustomTagList(migrated.customOpponentStyles)
  const customPairStyles = normalizeCustomTagList(migrated.customPairStyles)
  const customSelfFeel = normalizeCustomTagList(migrated.customSelfFeel)
  const customGameEvents = normalizeCustomTagList(migrated.customGameEvents)
  if (
    opponentStyles.length === 0 &&
    pairStyles.length === 0 &&
    selfFeel.length === 0 &&
    partnerContext.length === 0 &&
    matchFlow.length === 0 &&
    customOpponentStyles.length === 0 &&
    customPairStyles.length === 0 &&
    customSelfFeel.length === 0 &&
    customGameEvents.length === 0
  ) {
    return undefined
  }
  return {
    ...(opponentStyles.length > 0 ? { opponentStyles } : {}),
    ...(pairStyles.length > 0 ? { pairStyles } : {}),
    ...(selfFeel.length > 0 ? { selfFeel } : {}),
    ...(partnerContext.length > 0 ? { partnerContext } : {}),
    ...(matchFlow.length > 0 ? { matchFlow } : {}),
    ...(customOpponentStyles.length > 0 ? { customOpponentStyles } : {}),
    ...(customPairStyles.length > 0 ? { customPairStyles } : {}),
    ...(customSelfFeel.length > 0 ? { customSelfFeel } : {}),
    ...(customGameEvents.length > 0 ? { customGameEvents } : {}),
  }
}

export function noteHasTagContent(tags?: NoteTags): boolean {
  return normalizeNoteTags(tags) != null
}

export function noteHasJournalTagContent(tags?: NoteTags): boolean {
  const normalized = normalizeNoteTags(tags)
  if (normalized == null) return false
  return (
    (normalized.selfFeel?.length ?? 0) > 0 ||
    (normalized.partnerContext?.length ?? 0) > 0 ||
    (normalized.matchFlow?.length ?? 0) > 0 ||
    (normalized.customSelfFeel?.length ?? 0) > 0 ||
    (normalized.customGameEvents?.length ?? 0) > 0
  )
}

export function noteHasContent(body: string, tags?: NoteTags): boolean {
  return body.trim() !== '' || noteHasTagContent(tags)
}

export function scoutingTagsForTarget(
  tags: NoteTags | undefined,
  target: { kind: 'pair' } | { kind: 'opponent'; name: string },
): NoteTags | undefined {
  if (tags == null) return undefined
  if (target.kind === 'pair') {
    const pairStyles = normalizeTagList(PAIR_STYLE_TAGS, tags.pairStyles)
    const customPairStyles = normalizeCustomTagList(tags.customPairStyles)
    if (pairStyles.length === 0 && customPairStyles.length === 0) return undefined
    return {
      ...(pairStyles.length > 0 ? { pairStyles } : {}),
      ...(customPairStyles.length > 0 ? { customPairStyles } : {}),
    }
  }
  const opponentStyles = normalizeTagList(OPPONENT_STYLE_TAGS, tags.opponentStyles)
  const customOpponentStyles = normalizeCustomTagList(tags.customOpponentStyles)
  if (opponentStyles.length === 0 && customOpponentStyles.length === 0) return undefined
  return {
    ...(opponentStyles.length > 0 ? { opponentStyles } : {}),
    ...(customOpponentStyles.length > 0 ? { customOpponentStyles } : {}),
  }
}

export function journalTagsFromNote(tags?: NoteTags): {
  selfFeel: SelfFeelTag[]
  partnerContext: PartnerContextTag[]
  matchFlow: MatchFlowTag[]
  customSelfFeel: string[]
  customGameEvents: string[]
} {
  const normalized = normalizeNoteTags(tags)
  return {
    selfFeel: normalizeTagList(SELF_FEEL_TAGS, normalized?.selfFeel),
    partnerContext: normalizeTagList(PARTNER_CONTEXT_TAGS, normalized?.partnerContext),
    matchFlow: normalizeTagList(MATCH_FLOW_TAGS, normalized?.matchFlow),
    customSelfFeel: normalizeCustomTagList(normalized?.customSelfFeel),
    customGameEvents: normalizeCustomTagList(normalized?.customGameEvents),
  }
}

export function formatNoteTagsForDisplay(tags?: NoteTags): string[] {
  return [
    ...formatScoutingTagsForDisplay(tags),
    ...formatJournalTagsForDisplay(tags),
  ]
}

export function formatScoutingTagsForDisplay(tags?: NoteTags): string[] {
  const normalized = normalizeNoteTags(tags)
  if (normalized == null) return []
  const labels: string[] = []
  for (const tag of normalized.opponentStyles ?? []) {
    labels.push(OPPONENT_STYLE_LABELS[tag])
  }
  for (const tag of normalized.pairStyles ?? []) {
    labels.push(PAIR_STYLE_LABELS[tag])
  }
  for (const tag of normalized.customOpponentStyles ?? []) {
    labels.push(tag)
  }
  for (const tag of normalized.customPairStyles ?? []) {
    labels.push(tag)
  }
  return labels
}

export function formatSelfFeelTagsForDisplay(tags?: NoteTags): string[] {
  const normalized = normalizeNoteTags(tags)
  if (normalized == null) return []
  const labels: string[] = []
  for (const tag of normalized.selfFeel ?? []) {
    labels.push(SELF_FEEL_LABELS[tag])
  }
  for (const tag of normalized.customSelfFeel ?? []) {
    labels.push(tag)
  }
  return labels
}

export function formatGameEventTagsForDisplay(tags?: NoteTags): string[] {
  const normalized = normalizeNoteTags(tags)
  if (normalized == null) return []
  const labels: string[] = []
  for (const tag of normalized.matchFlow ?? []) {
    labels.push(MATCH_FLOW_LABELS[tag])
  }
  for (const tag of normalized.partnerContext ?? []) {
    labels.push(PARTNER_CONTEXT_LABELS[tag])
  }
  for (const tag of normalized.customGameEvents ?? []) {
    labels.push(tag)
  }
  return labels
}

export function formatJournalTagsForDisplay(tags?: NoteTags): string[] {
  return [...formatSelfFeelTagsForDisplay(tags), ...formatGameEventTagsForDisplay(tags)]
}
