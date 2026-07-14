import { describe, expect, it, beforeEach } from 'vitest'
import {
  CUSTOM_TAG_MAX_LENGTH,
  CUSTOM_TAG_MAX_PER_GROUP,
  ensureScoutingChipLibrary,
  loadRememberedCustomTags,
  normalizeCustomTagLabel,
  parseRememberedCustomTags,
  removeRememberedCustomTag,
  renameRememberedCustomTag,
  rememberCustomTag,
  SCOUTING_STARTER_CHIPS,
  scoutingChipsSeededStorageKey,
} from './customNoteTags'

function installLocalStorageMock() {
  const store = new Map<string, string>()
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage },
    configurable: true,
  })
}

describe('customNoteTags', () => {
  beforeEach(() => {
    installLocalStorageMock()
    window.localStorage.clear()
  })

  it('normalizes custom tag labels', () => {
    expect(normalizeCustomTagLabel('  Slow start  ')).toBe('Slow start')
    expect(normalizeCustomTagLabel('')).toBeNull()
    expect(normalizeCustomTagLabel('x'.repeat(CUSTOM_TAG_MAX_LENGTH + 1))).toBeNull()
  })

  it('parses remembered tags with limits', () => {
    const parsed = parseRememberedCustomTags(
      JSON.stringify({
        opponentStyles: ['A', 'a', 'B', 'C', 'D', 'E', 'F'],
      }),
    )
    expect(parsed.opponentStyles).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
  })

  it('remembers custom tags per player and group', () => {
    expect(rememberCustomTag('Alex', 'gameEvents', 'Long day')).toEqual(['Long day'])
    expect(loadRememberedCustomTags('Alex').gameEvents).toEqual(['Long day'])
    expect(rememberCustomTag('Alex', 'gameEvents', 'long day')).toEqual(['Long day'])
  })

  it('removes and renames remembered custom tags', () => {
    rememberCustomTag('Alex', 'selfFeel', 'On form')
    expect(removeRememberedCustomTag('Alex', 'selfFeel', 'On form')).toEqual([])
    rememberCustomTag('Alex', 'selfFeel', 'On form')
    expect(renameRememberedCustomTag('Alex', 'selfFeel', 'On form', 'In form')).toEqual([
      'In form',
    ])
  })

  it('returns null when the remembered tag limit is reached', () => {
    for (let i = 0; i < CUSTOM_TAG_MAX_PER_GROUP; i++) {
      expect(rememberCustomTag('Alex', 'selfFeel', `Tag ${i}`)).not.toBeNull()
    }
    expect(rememberCustomTag('Alex', 'selfFeel', 'One too many')).toBeNull()
  })

  it('seeds scouting starter chips once per player', () => {
    const first = ensureScoutingChipLibrary('Alex')
    expect(first.opponentStyles).toEqual([...SCOUTING_STARTER_CHIPS])
    expect(first.pairStyles).toEqual([...SCOUTING_STARTER_CHIPS])
    expect(window.localStorage.getItem(scoutingChipsSeededStorageKey('Alex'))).toBe('1')

    removeRememberedCustomTag('Alex', 'opponentStyles', SCOUTING_STARTER_CHIPS[0])
    const afterDelete = ensureScoutingChipLibrary('Alex')
    expect(afterDelete.opponentStyles).toEqual([SCOUTING_STARTER_CHIPS[1]])
  })

  it('returns in-memory starters when player name is missing', () => {
    const tags = ensureScoutingChipLibrary(null)
    expect(tags.opponentStyles).toEqual([...SCOUTING_STARTER_CHIPS])
    expect(tags.pairStyles).toEqual([...SCOUTING_STARTER_CHIPS])
  })
})
