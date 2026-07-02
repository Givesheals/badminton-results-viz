export type CustomTagGroup = 'opponentStyles' | 'pairStyles' | 'selfFeel' | 'gameEvents'

export const CUSTOM_TAG_MAX_PER_GROUP = 6
export const CUSTOM_TAG_MAX_LENGTH = 24

const STORAGE_PREFIX = 'badminton-custom-note-tags:'

const EMPTY_REMEMBERED: Record<CustomTagGroup, string[]> = {
  opponentStyles: [],
  pairStyles: [],
  selfFeel: [],
  gameEvents: [],
}

export function rememberedCustomTagsStorageKey(playerName: string): string {
  return `${STORAGE_PREFIX}${playerName.trim().toLowerCase()}`
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
    return {
      opponentStyles: dedupeTags(parsed.opponentStyles ?? []).slice(0, CUSTOM_TAG_MAX_PER_GROUP),
      pairStyles: dedupeTags(parsed.pairStyles ?? []).slice(0, CUSTOM_TAG_MAX_PER_GROUP),
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
  const existing = current[group]
  const key = label.toLowerCase()
  if (existing.some((tag) => tag.toLowerCase() === key)) {
    return existing
  }
  if (existing.length >= CUSTOM_TAG_MAX_PER_GROUP) return null

  const next = { ...current, [group]: [...existing, label] }
  saveRememberedCustomTags(playerName, next)
  return next[group]
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
  const nextGroup = current[group].filter((tag) => tag.toLowerCase() !== label.toLowerCase())
  if (nextGroup.length === current[group].length) return current[group]

  const next = { ...current, [group]: nextGroup }
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
  const oldKey = oldLabel.toLowerCase()
  const newKey = normalizedNew.toLowerCase()

  if (!current[group].some((tag) => tag.toLowerCase() === oldKey)) return null
  if (
    current[group].some((tag) => tag.toLowerCase() === newKey && tag.toLowerCase() !== oldKey)
  ) {
    return null
  }

  const nextGroup = current[group].map((tag) =>
    tag.toLowerCase() === oldKey ? normalizedNew : tag,
  )
  const next = { ...current, [group]: dedupeTags(nextGroup) }
  saveRememberedCustomTags(playerName, next)
  return next[group]
}
