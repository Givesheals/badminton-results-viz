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
 *  - Email 2 ("draw out") additionally needs the user's notes, which today live
 *    in localStorage (see docs/opponent-notes-spec.md). Populating the note
 *    badges/caveats below requires syncing notes server-side first.
 */

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
// Email 2 - "Your draw is out" (enhanced with notes)
// ---------------------------------------------------------------------------

/**
 * A single player as they appear in the draw preview. Kept structured (rather
 * than a joined "A & B" string) so names render as links.
 */
export type DrawPlayer = {
  name: string
  url: string
  /** Seeding prefix shown before the name, e.g. '[1]'. */
  seedLabel?: string
}

/**
 * A single saved note, served in full beneath the matchup it relates to. We
 * show the actual note back to the player rather than hiding it behind a count.
 */
export type DrawNoteLine = {
  opponentName: string
  tags: string[]
  /** The actual note text. */
  body: string
  /** Competition the note was captured at, if we have it. */
  competition?: string
  /** Display date of the note, e.g. '14 Sep 2025'. */
  date: string
  /**
   * Discipline code the note was captured in (e.g. 'MD', 'XD'). Rendered as a
   * chip ONLY when it differs from the matchup's discipline, so the reader sees
   * the note may be about a different format.
   */
  disciplineChip?: string
  /**
   * Set when the note was about a *pair* and the pairing they've now been drawn
   * with differs. Names the original partner so the reader knows it may not
   * fully apply.
   */
  pairingCaveat?: string
  /**
   * Only used in the "you may also meet" list: where/when you might face them,
   * e.g. 'Open Doubles \u00b7 Quarter-finals'.
   */
  facingLabel?: string
}

export type DrawMatchup = {
  id: string
  roundLabel: string
  yourSide: DrawPlayer[]
  opponentSide: DrawPlayer[]
  /** Notes for opponents in this matchup, shown as compact lines beneath it. */
  notes: DrawNoteLine[]
}

export type DrawDisciplineGroup = {
  disciplineCode: string
  disciplineLabel: string
  matchups: DrawMatchup[]
}

export type DrawOutEmailData = {
  recipientFirstName: string
  competitionName: string
  competitionUrl: string
  favouritesCount: number
  /** The draw itself, with notes served inline beneath each matchup. */
  disciplineGroups: DrawDisciplineGroup[]
  /** Players you have notes on who entered but aren't in your group. */
  laterNotes: DrawNoteLine[]
  seeAllDrawNotesUrl: string
  notificationSettingsUrl: string
  unsubscribeUrl: string
}

// ---------------------------------------------------------------------------
// Dummy content (reuses the attached BadmInfo emails for realism)
// ---------------------------------------------------------------------------

const NOTIFICATION_SETTINGS_URL = 'https://badminfo.com/settings/notifications'
const UNSUBSCRIBE_URL = 'https://badminfo.com/settings/notifications/unsubscribe'

function player(name: string, extra: { seedLabel?: string } = {}): DrawPlayer {
  return {
    name,
    url: `https://badminfo.com/player?name=${encodeURIComponent(name)}`,
    ...extra,
  }
}

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

export const drawOutPreview: DrawOutEmailData = {
  recipientFirstName: 'Simon',
  competitionName: 'Cambridgeshire Senior Bronze July 2026',
  competitionUrl: 'https://badminfo.com/competition/cambridgeshire-senior-bronze-july-2026',
  favouritesCount: 9,
  notificationSettingsUrl: NOTIFICATION_SETTINGS_URL,
  unsubscribeUrl: UNSUBSCRIBE_URL,
  seeAllDrawNotesUrl: `${PLAYER_PROFILE_URL}?tab=notes&draw=cambridgeshire-senior-bronze-july-2026`,
  disciplineGroups: [
    {
      disciplineCode: 'XD',
      disciplineLabel: 'Mixed Doubles',
      matchups: [
        {
          id: 'd1',
          roundLabel: 'Group A',
          yourSide: [player('Simon Parker'), player('Sara Moore')],
          opponentSide: [player('Murray Wright'), player('Corinna Wong')],
          notes: [
            {
              opponentName: 'Murray Wright',
              tags: ['Aggressive', 'Strong at the net'],
              body: 'Loves to intercept at the net - keep lifts tight and deep. Struggles when pushed to his rear forehand corner.',
              competition: 'Norfolk Restricted 2025',
              date: '14 Sep 2025',
              // Note captured in men's doubles; this matchup is mixed.
              disciplineChip: 'MD',
            },
          ],
        },
        {
          id: 'd2',
          roundLabel: 'Group A',
          yourSide: [player('Simon Parker'), player('Sara Moore')],
          opponentSide: [player('Dan Martyres', { seedLabel: '[1]' }), player('Alisha Johnson')],
          notes: [
            {
              opponentName: 'Dan Martyres',
              tags: ['Fast, flat attack'],
              body: 'Big flat game, rushes you early. Slow to the net though - drops off the serve caused problems.',
              competition: 'Suffolk Bronze 2026',
              date: '2 Feb 2026',
              // Original note was about the pair Dan + Jane, not Dan + Alisha.
              pairingCaveat: 'noted with Jane Smith',
            },
          ],
        },
      ],
    },
    {
      disciplineCode: 'OD',
      disciplineLabel: 'Open Doubles',
      matchups: [
        {
          id: 'd3',
          roundLabel: 'Group G',
          yourSide: [player('Martin Crossley'), player('Simon Parker')],
          opponentSide: [player('Simon Gilhooly'), player('Paul Andrew Mayfield')],
          notes: [],
        },
        {
          id: 'd4',
          roundLabel: 'Group G',
          yourSide: [player('Martin Crossley'), player('Simon Parker')],
          opponentSide: [player('Daniel Hughes'), player('Morgan Taylor')],
          notes: [
            {
              opponentName: 'Daniel Hughes',
              tags: ['Big smash', 'Slow around the court'],
              body: 'Huge smash but predictable - defend cross-court and he tires. Weak backhand under pressure.',
              competition: 'Cambridgeshire Bronze 2025',
              date: '9 Nov 2025',
            },
            {
              opponentName: 'Daniel Hughes',
              tags: [],
              body: 'Serves short almost every time - stand in and attack it.',
              competition: 'Cambridgeshire Bronze 2025',
              date: '9 Nov 2025',
            },
          ],
        },
      ],
    },
  ],
  laterNotes: [
    {
      opponentName: 'Ben Carter',
      tags: ['Deceptive', 'Weak backhand clear'],
      body: 'Great deception at the net, sells the dummy. Backhand clear is short - attack it early.',
      competition: 'Essex Bronze 2026',
      date: '18 Jan 2026',
      facingLabel: 'Open Doubles \u00b7 Quarter-finals',
    },
    {
      opponentName: 'Tom Fielding',
      tags: ['Defensive'],
      body: 'Very patient defender, happy to rally all day. Force the pace and bring him to the net.',
      date: '3 Mar 2026',
      facingLabel: 'Mixed Doubles \u00b7 Semi-finals',
    },
  ],
}
