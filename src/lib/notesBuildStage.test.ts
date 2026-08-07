import { describe, expect, it } from 'vitest'
import {
  fullNotesBuildFeatures,
  getNotesBuildFeatures,
  NOTES_BUILD_STAGES,
} from './notesBuildStage'

describe('notesBuildStage', () => {
  it('lists Notes-tab ticket stages (skips 9, 12, 13)', () => {
    expect(NOTES_BUILD_STAGES).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 10, 11])
  })

  it('gates features by ticket number', () => {
    expect(getNotesBuildFeatures(1).showAddNote).toBe(false)
    expect(getNotesBuildFeatures(1).showNotesList).toBe(false)

    expect(getNotesBuildFeatures(2).showAddNote).toBe(true)
    expect(getNotesBuildFeatures(2).showNotesList).toBe(false)
    expect(getNotesBuildFeatures(2).showTagsInModal).toBe(false)

    expect(getNotesBuildFeatures(3).showNotesList).toBe(true)
    expect(getNotesBuildFeatures(3).showEdit).toBe(false)

    expect(getNotesBuildFeatures(4).showEdit).toBe(true)
    expect(getNotesBuildFeatures(4).showTagsInModal).toBe(false)

    expect(getNotesBuildFeatures(5).showTagsInModal).toBe(true)
    expect(getNotesBuildFeatures(5).showTagsOnNotes).toBe(false)

    expect(getNotesBuildFeatures(6).showTagsOnNotes).toBe(true)
    expect(getNotesBuildFeatures(6).showYourTags).toBe(false)

    expect(getNotesBuildFeatures(7).showYourTags).toBe(true)
    expect(getNotesBuildFeatures(7).showCreateTagInModal).toBe(false)

    expect(getNotesBuildFeatures(8).showCreateTagInModal).toBe(true)
    expect(getNotesBuildFeatures(8).showMatchResult).toBe(false)

    expect(getNotesBuildFeatures(10).showMatchResult).toBe(true)
    expect(getNotesBuildFeatures(10).showPairScope).toBe(false)

    expect(getNotesBuildFeatures(11).showPairScope).toBe(true)
  })

  it('full features match stage 11', () => {
    expect(fullNotesBuildFeatures()).toEqual(getNotesBuildFeatures(11))
  })
})
