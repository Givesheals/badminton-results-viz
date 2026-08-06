export type CustomTagGroup = 'opponentStyles' | 'pairStyles' | 'selfFeel' | 'gameEvents'

/** Canonical library group for scouting (opponent + pair use the same chip list). */
export const SCOUTING_TAG_LIBRARY_GROUP: CustomTagGroup = 'opponentStyles'

export function isScoutingTagGroup(group: CustomTagGroup): boolean {
  return group === 'opponentStyles' || group === 'pairStyles'
}

export const CUSTOM_TAG_MAX_PER_GROUP = 6
export const CUSTOM_TAG_MAX_LENGTH = 24

/** Seed chips for scouting (About them). Missing starters are filled in for every player. */
export const SCOUTING_STARTER_CHIPS = [
  'Flat-pace specialist',
  'Smash at forehand',
  'Lefty',
] as const

const STORAGE_PREFIX = 'badminton-custom-note-tags:'
const SCOUTING_SEED_FLAG_PREFIX = 'badminton-scouting-chips-seeded:'

const EMPTY_REMEMBERED: Record<CustomTagGroup, string[]> = {
  opponentStyles: [],
  pairStyles: [],
  selfFeel: [],
  gameEvents: [],
}

export function rememberedCustomTagsStorageKey(playerName: string): string {
  return `${STORAGE_PREFIX}${playerName.trim().toLowerCase()}`
}

export function scoutingChipsSeededStorageKey(playerName: string): string {
  return `${SCOUTING_SEED_FLAG_PREFIX}${playerName.trim().toLowerCase()}`
}

const LEGACY_STARTER_RENAMES: Record<string, string> = {
  'weak forehand defence': 'Smash at forehand',
}

function renameLegacyStarters(existing: string[]): string[] {
  return existing.map((tag) => {
    const renamed = LEGACY_STARTER_RENAMES[tag.toLowerCase()]
    return renamed ?? tag
  })
}

function mergeScoutingStarters(existing: string[]): string[] {
  const merged = renameLegacyStarters(existing)
  for (const starter of SCOUTING_STARTER_CHIPS) {
    if (merged.some((tag) => tag.toLowerCase() === starter.toLowerCase())) continue
    if (merged.length >= CUSTOM_TAG_MAX_PER_GROUP) break
    merged.push(starter)
  }
  return merged
}

function withUnifiedScoutingLibrary(
  tags: Record<CustomTagGroup, string[]>,
  scoutingTags: string[],
): Record<CustomTagGroup, string[]> {
  return {
    ...tags,
    opponentStyles: scoutingTags,
    pairStyles: scoutingTags,
  }
}

/**
 * Ensures the shared scouting chip library includes any missing starters.
 * Opponent and pair always share the same list (pairStyles is kept in sync for storage).
 */
export function ensureScoutingChipLibrary(
  playerName: string | null,
): Record<CustomTagGroup, string[]> {
  if (playerName == null || typeof window === 'undefined') {
    const starters = [...SCOUTING_STARTER_CHIPS]
    return withUnifiedScoutingLibrary(EMPTY_REMEMBERED, starters)
  }

  const current = loadRememberedCustomTags(playerName)
  const unified = mergeScoutingStarters(
    dedupeTags([...current.opponentStyles, ...current.pairStyles]),
  ).slice(0, CUSTOM_TAG_MAX_PER_GROUP)

  const next = withUnifiedScoutingLibrary(current, unified)
  const changed =
    unified.length !== current.opponentStyles.length ||
    unified.length !== current.pairStyles.length ||
    unified.some((tag, index) => tag !== current.opponentStyles[index]) ||
    unified.some((tag, index) => tag !== current.pairStyles[index])

  if (changed) {
    saveRememberedCustomTags(playerName, next)
  }
  window.localStorage.setItem(scoutingChipsSeededStorageKey(playerName), '1')
  return next
}

export function normalizeCustomTagLabel(input: string): string | null {
  const trimmed = input.trim().replace(/\s+/g, ' ')
  if (trimmed === '') return null
  if (trimmed.length > CUSTOM_TAG_MAX_LENGTH) return null
  return trimmed
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const tag of tags) {
    const normalized = normalizeCustomTagLabel(tag)
    if (normalized == null) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }
  return result
}

export function parseRememberedCustomTags(raw: string | null): Record<CustomTagGroup, string[]> {
  if (raw == null || raw.trim() === '') return { ...EMPTY_REMEMBERED }
  try {
    const parsed = JSON.parse(raw) as Partial<Record<CustomTagGroup, string[]>>
    // Prefer opponentStyles when both exist; merge for any divergent legacy stores.
    const scouting = dedupeTags([
      ...(parsed.opponentStyles ?? []),
      ...(parsed.pairStyles ?? []),
    ]).slice(0, CUSTOM_TAG_MAX_PER_GROUP)
    return {
      opponentStyles: scouting,
      pairStyles: scouting,
      selfFeel: dedupeTags(parsed.selfFeel ?? []).slice(0, CUSTOM_TAG_MAX_PER_GROUP),
      gameEvents: dedupeTags(parsed.gameEvents ?? []).slice(0, CUSTOM_TAG_MAX_PER_GROUP),
    }
  } catch {
    return { ...EMPTY_REMEMBERED }
  }
}

export function loadRememberedCustomTags(
  playerName: string | null,
): Record<CustomTagGroup, string[]> {
  if (playerName == null || typeof window === 'undefined') return { ...EMPTY_REMEMBERED }
  return parseRememberedCustomTags(
    window.localStorage.getItem(rememberedCustomTagsStorageKey(playerName)),
  )
}

export function serializeRememberedCustomTags(
  tags: Record<CustomTagGroup, string[]>,
): string {
  return JSON.stringify(tags)
}

/** Remember a custom tag for future quick-add. Returns updated list or null if at limit. */
export function rememberCustomTag(
  playerName: string | null,
  group: CustomTagGroup,
  input: string,
): string[] | null {
  const label = normalizeCustomTagLabel(input)
  if (label == null || playerName == null || typeof window === 'undefined') return null

  const current = loadRememberedCustomTags(playerName)
  const existing = isScoutingTagGroup(group) ? current.opponentStyles : current[group]
  const key = label.toLowerCase()
  if (existing.some((tag) => tag.toLowerCase() === key)) {
    return existing
  }
  if (existing.length >= CUSTOM_TAG_MAX_PER_GROUP) return null

  const nextGroup = [...existing, label]
  const next = isScoutingTagGroup(group)
    ? withUnifiedScoutingLibrary(current, nextGroup)
    : { ...current, [group]: nextGroup }
  saveRememberedCustomTags(playerName, next)
  return nextGroup
}

export function normalizeCustomTagList(values?: string[]): string[] {
  if (values == null || values.length === 0) return []
  return dedupeTags(values)
}

function saveRememberedCustomTags(
  playerName: string,
  tags: Record<CustomTagGroup, string[]>,
): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    rememberedCustomTagsStorageKey(playerName),
    serializeRememberedCustomTags(tags),
  )
}

/** Remove a custom tag from the quick-add list. */
export function removeRememberedCustomTag(
  playerName: string | null,
  group: CustomTagGroup,
  label: string,
): string[] | null {
  if (playerName == null || typeof window === 'undefined') return null

  const current = loadRememberedCustomTags(playerName)
  const existing = isScoutingTagGroup(group) ? current.opponentStyles : current[group]
  const nextGroup = existing.filter((tag) => tag.toLowerCase() !== label.toLowerCase())
  if (nextGroup.length === existing.length) return existing

  const next = isScoutingTagGroup(group)
    ? withUnifiedScoutingLibrary(current, nextGroup)
    : { ...current, [group]: nextGroup }
  saveRememberedCustomTags(playerName, next)
  return nextGroup
}

/** Rename a custom tag in the quick-add list. */
export function renameRememberedCustomTag(
  playerName: string | null,
  group: CustomTagGroup,
  oldLabel: string,
  newLabel: string,
): string[] | null {
  const normalizedNew = normalizeCustomTagLabel(newLabel)
  if (normalizedNew == null || playerName == null || typeof window === 'undefined') return null

  const current = loadRememberedCustomTags(playerName)
  const existing = isScoutingTagGroup(group) ? current.opponentStyles : current[group]
  const oldKey = oldLabel.toLowerCase()
  const newKey = normalizedNew.toLowerCase()

  if (!existing.some((tag) => tag.toLowerCase() === oldKey)) return null
  if (existing.some((tag) => tag.toLowerCase() === newKey && tag.toLowerCase() !== oldKey)) {
    return null
  }

  const nextGroup = dedupeTags(
    existing.map((tag) => (tag.toLowerCase() === oldKey ? normalizedNew : tag)),
  )
  const next = isScoutingTagGroup(group)
    ? withUnifiedScoutingLibrary(current, nextGroup)
    : { ...current, [group]: nextGroup }
  saveRememberedCustomTags(playerName, next)
  return nextGroup
}
