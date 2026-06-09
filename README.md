# Badminton Results Viz

Local prototype for uploading badminton match results (Excel or CSV) and exploring charts. Built for user testing before a full product.

**Privacy:** This is a client-only app. When you upload a spreadsheet, parsing happens entirely in your browser — match data is never sent to a server.

## Hosted preview (no install)

Open the live preview in any browser:

**https://badminton-results-viz.vercel.app**

Share this URL only with people you invite. The site is unlisted (not indexed by search engines).

## Local setup

### Prerequisites (Windows)

- [Node.js LTS](https://nodejs.org/) (v20 or v22) — includes npm
- [Git for Windows](https://git-scm.com/download/win)
- Any terminal works: PowerShell, Command Prompt, or Git Bash

### Prerequisites (macOS)

- [Node.js LTS](https://nodejs.org/) — includes npm
- Git (included with Xcode Command Line Tools, or install from [git-scm.com](https://git-scm.com))

### Clone and run

```bash
git clone https://github.com/SimParEle/badminton-results-viz.git
cd badminton-results-viz
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Using the app

- Click **Load sample data** for a demo without a real export
- Or drag-and-drop / file picker for `.xlsx`, `.xls`, `.csv` Match History exports
- Data stays in your browser; nothing is uploaded to a server

Uploads expect the standard **Match History** export with columns like `Competition Name`, `Date`, `Discipline`, game scores, etc. Wins and losses are calculated from the game scores (no separate Result column).

## What works today

- Drag-and-drop or file picker for spreadsheets
- **Load sample data** button for demos
- Summary stats, player profile, season journey, tournament recap, partner chemistry, and more
- Data table preview of imported rows

## Scripts

| Command           | Description              |
|-------------------|--------------------------|
| `npm run dev`     | Local dev server         |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
| `npm test`        | Run unit tests           |
| `npm run lint`    | Run ESLint               |

## Troubleshooting (Windows)

- **`npm` is not recognized:** Restart the terminal after installing Node, or reinstall Node with "Add to PATH" checked
- **Port 5173 is busy:** Vite picks the next available port — use the URL shown in the terminal
- **Corporate firewall:** Local dev uses localhost only; the hosted preview URL needs normal HTTPS access

## Project layout

```
src/
  components/     UI: upload, dashboard, charts, table
  context/        Shared dataset state
  data/           Built-in sample dataset
  hooks/          Chart data derived from rows
  lib/            Spreadsheet parsing and stats
  types/          TypeScript types
public/samples/   Example CSV you can upload
```

## Contributing

This is a private prototype. If you have access to the repo, open a pull request or push to a branch for review.
