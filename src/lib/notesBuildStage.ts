/** Ticket build-out stages for screenshotting Notes tab (1 = shell … 11 = pair scope). */
export const NOTES_BUILD_STAGES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11] as const
export type NotesBuildStage = (typeof NOTES_BUILD_STAGES)[number]

export type NotesBuildFeatures = {
  /** Stage ≥ 2 — Add new note button + picker/compose modal */
  showAddNote: boolean
  /** Stage ≥ 3 — Search + opponent accordions listing notes */
  showNotesList: boolean
  /** Stage ≥ 4 — Edit icon, edit modal delete, last-edited date */
  showEdit: boolean
  /** Stage ≥ 5 — Tag chips + quick-add in add/edit modal */
  showTagsInModal: boolean
  /** Stage ≥ 6 — Tag chips on note rows in the list */
  showTagsOnNotes: boolean
  /** Stage ≥ 7 — Your note tags card under Notes */
  showYourTags: boolean
  /** Stage ≥ 8 — “Add a tag” create-during-compose in modal */
  showCreateTagInModal: boolean
  /** Stage ≥ 10 — View match result accordion on match-linked notes */
  showMatchResult: boolean
  /** Stage ≥ 11 — “About the pair” / pair scope line on notes */
  showPairScope: boolean
}

export const NOTES_BUILD_STAGE_META: Record<
  NotesBuildStage,
  { shortLabel: string; summary: string }
> = {
  1: {
    shortLabel: 'Shell',
    summary: 'Notes card shell — title, subtitle, empty state',
  },
  2: {
    shortLabel: 'Capture',
    summary: 'Add new note + opponent picker / text compose (no tags)',
  },
  3: {
    shortLabel: 'List',
    summary: 'Search + opponent accordions with recorded notes',
  },
  4: {
    shortLabel: 'Edit',
    summary: 'Edit icon, edit modal with delete, last-edited date',
  },
  5: {
    shortLabel: 'Modal tags',
    summary: 'Tag chips + quick-add in add/edit modal',
  },
  6: {
    shortLabel: 'List tags',
    summary: 'Tag chips displayed on note rows',
  },
  7: {
    shortLabel: 'Your tags',
    summary: 'Your note tags card under Notes',
  },
  8: {
    shortLabel: 'Create tag',
    summary: 'Add a tag while composing a note',
  },
  10: {
    shortLabel: 'Match result',
    summary: 'View match result accordion on match-linked notes',
  },
  11: {
    shortLabel: 'Pair scope',
    summary: 'About the pair labelling on notes',
  },
}

/** Full Notes-tab feature set (stage 11 / no progressive gating). */
export function fullNotesBuildFeatures(): NotesBuildFeatures {
  return getNotesBuildFeatures(11)
}

export function getNotesBuildFeatures(stage: NotesBuildStage): NotesBuildFeatures {
  return {
    showAddNote: stage >= 2,
    showNotesList: stage >= 3,
    showEdit: stage >= 4,
    showTagsInModal: stage >= 5,
    showTagsOnNotes: stage >= 6,
    showYourTags: stage >= 7,
    showCreateTagInModal: stage >= 8,
    showMatchResult: stage >= 10,
    showPairScope: stage >= 11,
  }
}
