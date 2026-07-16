/**
 * Dummy payloads for the Notifications email preview.
 *
 * These types intentionally mirror a flat, loop-friendly shape so that a real
 * implementation can map them almost 1:1 onto SendGrid dynamic-template
 * (Handlebars) contexts. Nothing here talks to a backend or to SendGrid - the
 * preview page renders these objects exactly as an inbox would render the sent
 * email.
 *
 * When wired for real:
 *  - Email 1 ("capture notes") needs only match data the server already has.
 *  - Email 2 ("draw out") needs the draw structure plus notesOpponentCount for
 *    the CTA teaser. Full notes live in-app (see docs/draw-scout-spec.md).
 */

import type { DrawDisciplineGroup } from './drawTypes'
import { DRAW_SCOUT_PREVIEW_SLUG, drawScoutPreviewCompetitions } from './drawScoutPreviewData'

export type { DrawDisciplineGroup, DrawMatchup, DrawPlayer } from './drawTypes'

const PLAYER_ID = '91e9ff09-0fe3-4ac2-b281-8609219900d6'
const PLAYER_PROFILE_URL = `https://badminfo.com/player/${PLAYER_ID}`

export type NotificationPreviewKind = 'captureNotes' | 'drawOut'

// ---------------------------------------------------------------------------
// Email 1 - "Capture your notes" (post-competition digest)
// ---------------------------------------------------------------------------

export type CaptureNoteMatch = {
  id: string
  /** Discipline code used for the coloured dot / accent (e.g. 'XD', 'OD'). */
  disciplineCode: string
  disciplineLabel: string
  roundLabel: string
  outcome: 'win' | 'loss'
  outcomeLabel: string
  scoreSummary: string
  playerSide: string
  opponentSide: string
  /** Deep link into the player's own match history, note modal pre-opened. */
  addNotesUrl: string
}

export type CaptureNotesEmailData = {
  recipientFirstName: string
  competitionName: string
  competitionUrl: string
  matches: CaptureNoteMatch[]
  notificationSettingsUrl: string
  unsubscribeUrl: string
}

// ---------------------------------------------------------------------------
// Email 2 - "Your draw is out"
// ---------------------------------------------------------------------------

export type DrawOutEmailData = {
  recipientFirstName: string
  competitionName: string
  competitionUrl: string
  competitionSlug: string
  favouritesCount: number
  /** Count of distinct opponents in this draw the user has personal notes on. */
  notesOpponentCount: number
  drawNotesUrl: string
  disciplineGroups: DrawDisciplineGroup[]
  notificationSettingsUrl: string
  unsubscribeUrl: string
}

// ---------------------------------------------------------------------------
// Dummy content (reuses the attached BadmInfo emails for realism)
// ---------------------------------------------------------------------------

const NOTIFICATION_SETTINGS_URL = 'https://badminfo.com/settings/notifications'
const UNSUBSCRIBE_URL = 'https://badminfo.com/settings/notifications/unsubscribe'

export const captureNotesPreview: CaptureNotesEmailData = {
  recipientFirstName: 'Simon',
  competitionName: 'Cambridgeshire Senior Bronze July 2026',
  competitionUrl: 'https://badminfo.com/competition/cambridgeshire-senior-bronze-july-2026',
  notificationSettingsUrl: NOTIFICATION_SETTINGS_URL,
  unsubscribeUrl: UNSUBSCRIBE_URL,
  matches: [
    {
      id: 'm1',
      disciplineCode: 'XD',
      disciplineLabel: 'Mixed doubles',
      roundLabel: 'Group A',
      outcome: 'win',
      outcomeLabel: 'Won',
      scoreSummary: '21-15, 21-18',
      playerSide: 'Simon Parker & Sara Moore',
      opponentSide: 'Murray Wright & Corinna Wong',
      addNotesUrl: `${PLAYER_PROFILE_URL}?tab=results&note=m1`,
    },
    {
      id: 'm2',
      disciplineCode: 'XD',
      disciplineLabel: 'Mixed doubles',
      roundLabel: 'Group A',
      outcome: 'loss',
      outcomeLabel: 'Lost',
      scoreSummary: '18-21, 21-19, 17-21',
      playerSide: 'Simon Parker & Sara Moore',
      opponentSide: 'Dan Martyres & Alisha Johnson',
      addNotesUrl: `${PLAYER_PROFILE_URL}?tab=results&note=m2`,
    },
    {
      id: 'm3',
      disciplineCode: 'OD',
      disciplineLabel: 'Open doubles',
      roundLabel: 'Semi-final',
      outcome: 'loss',
      outcomeLabel: 'Lost',
      scoreSummary: '19-21, 21-17, 18-21',
      playerSide: 'Martin Crossley & Simon Parker',
      opponentSide: 'Daniel Hughes & Morgan Taylor',
      addNotesUrl: `${PLAYER_PROFILE_URL}?tab=results&note=m3`,
    },
  ],
}

const previewCompetition = drawScoutPreviewCompetitions[0]!
const previewEntrant = previewCompetition.entrants[0]!

export const drawOutPreview: DrawOutEmailData = {
  recipientFirstName: 'Simon',
  competitionName: previewCompetition.name,
  competitionUrl: previewCompetition.competitionUrl,
  competitionSlug: DRAW_SCOUT_PREVIEW_SLUG,
  favouritesCount: 9,
  notesOpponentCount: 4,
  drawNotesUrl: `${PLAYER_PROFILE_URL}?tab=notes&draw=${DRAW_SCOUT_PREVIEW_SLUG}`,
  notificationSettingsUrl: NOTIFICATION_SETTINGS_URL,
  unsubscribeUrl: UNSUBSCRIBE_URL,
  disciplineGroups: previewEntrant.disciplineGroups,
}
