# SendGrid email templates

Ready-to-paste **Dynamic Template** HTML for the two notes notifications, plus
sample test data so you can preview them in SendGrid straight away.

| Email | Template | Test data | Subject line |
|-------|----------|-----------|--------------|
| Capture your notes (post-competition) | [`capture-notes.html`](capture-notes.html) | [`capture-notes.test-data.json`](capture-notes.test-data.json) | `How did you get on? Capture your notes` |
| Your draw is out (enhanced with notes) | [`draw-out.html`](draw-out.html) | [`draw-out.test-data.json`](draw-out.test-data.json) | `{{competitionName}} draw out!` |

Set the subject in the version's **Settings** panel in SendGrid (it is also noted in an HTML comment at the top of each template).

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

## Dark mode

Both templates support dark-mode inboxes:

- A `prefers-color-scheme: dark` stylesheet in the `<head>` swaps to dark
  surfaces, light text, a lighter/more-visible purple, and readable win/loss
  colours. Inline styles remain the light-mode defaults; the dark rules win via
  `!important` in clients that honour the media query (Apple Mail, iOS Mail,
  Outlook for macOS, etc.). `color-scheme` / `supported-color-schemes` meta tags
  are set so clients know both modes are handled.
- Gmail ignores `<style>` media queries and applies its own inversion, so the
  colours are chosen to read well either way.
- The header logo ships as **two variants** - the purple
  `public/badminfo-logo.png` for light mode and a white
  `public/badminfo-logo-white.png` for dark mode - swapped by the dark media
  query (both embedded as transparent PNGs, no backing plate). Clients that
  honour the media query (Apple Mail, iOS Mail, etc.) show the crisp white logo
  on dark; Gmail ignores it and falls back to the purple logo. Regenerate both
  with `python3 _make_logo.py` if the source logo changes.
- On mobile, `capture-notes.html` collapses each "Add notes" button to the app's
  add-notes icon (the same `FileCirclePlusIcon` used in the events section).
  Email clients can't be trusted to render inline SVG, so the icon is embedded as
  a PNG with light and dark variants (swapped by the dark media query). Regenerate
  with `node _make_icon.mjs` if the icon changes.

## Notes for wiring it up for real

- The header logo is embedded as a base64 data URI so the template previews with
  no setup. For production sends, host `public/badminfo-logo-email.png` (the
  glow-backed version) and replace the `data:image/png;base64,...` `src` with the
  hosted URL (some clients, e.g. Gmail, do not render data-URI images).
- The JSON shapes match the typed payloads in
  `src/lib/notificationPreviewData.ts` - a couple of presentation-only fields are
  added for the template (`disciplineColor`, `dotColor`, `isWin`,
  `disciplineChip.color`) so the template stays free of colour-mapping logic.
- **Capture your notes** needs only match data the server already has.
- **Your draw is out** additionally needs the user's notes. Today notes live in
  the browser (localStorage); populating `disciplineGroups[].matchups[].notes`
  and `laterNotes` requires syncing notes server-side first.
- The discipline chip on a draw note is intended to appear **only when the note's
  discipline differs from the matchup** (e.g. a men's-doubles note shown against a
  mixed matchup) - omit `disciplineChip` when they match.
