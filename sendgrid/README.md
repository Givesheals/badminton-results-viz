# SendGrid email templates

Ready-to-paste **Dynamic Template** HTML for the two notes notifications, plus
sample test data so you can preview them in SendGrid straight away.

| Email | Template | Test data |
|-------|----------|-----------|
| Capture your notes (post-competition) | [`capture-notes.html`](capture-notes.html) | [`capture-notes.test-data.json`](capture-notes.test-data.json) |
| Your draw is out (enhanced with notes) | [`draw-out.html`](draw-out.html) | [`draw-out.test-data.json`](draw-out.test-data.json) |

These mirror the in-app previews (top-right account menu → **Notifications**). The
markup uses email-safe inline styles and table layout, and the placeholders use
Handlebars (`{{...}}`, `{{#each}}`, `{{#if}}`) so they drop into SendGrid's dynamic
template engine.

## Preview in SendGrid

1. **Email API → Dynamic Templates → Create a Dynamic Template**, then **Add Version**.
2. Choose **Code Editor** (blank template).
3. Paste the contents of the relevant `.html` file into the editor.
4. Open the **Test Data** tab (top right of the editor) and paste the matching
   `.test-data.json`.
5. The preview pane renders the email with the sample content.

## Notes for wiring it up for real

- The header uses a text wordmark so it renders with no setup. To use the real
  logo, host `public/badminfo-logo.png` and swap the wordmark for the commented
  `<img src="{{logoUrl}}" ...>` (pass `logoUrl` in the data).
- The JSON shapes match the typed payloads in
  `src/lib/notificationPreviewData.ts` — a couple of presentation-only fields are
  added for the template (`disciplineColor`, `dotColor`, `isWin`,
  `disciplineChip.color`) so the template stays free of colour-mapping logic.
- **Capture your notes** needs only match data the server already has.
- **Your draw is out** additionally needs the user's notes. Today notes live in
  the browser (localStorage); populating `disciplineGroups[].matchups[].notes`
  and `laterNotes` requires syncing notes server-side first.
- The discipline chip on a draw note is intended to appear **only when the note's
  discipline differs from the matchup** (e.g. a men's-doubles note shown against a
  mixed matchup) — omit `disciplineChip` when they match.
