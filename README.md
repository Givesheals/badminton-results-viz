# Badminton Results Viz

Prototype for uploading badminton match results (Excel or CSV) and exploring charts. Built for user testing before a full product.

**Privacy:** This is a client-only app. When you upload a spreadsheet, parsing happens entirely in your browser — match data is never sent to a server. The app only works with the specific Match History export format, so casual visitors cannot do much without your data.

## Live preview (no install)

Open in any browser:

**https://givesheals.github.io/badminton-results-viz/**

The repo is public but unlisted — share the link only with people you invite. The site uses `noindex` so search engines should not index it.

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
git clone https://github.com/Givesheals/badminton-results-viz.git
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
- Summary stats, player profile, season journey, tournament recap, partner chemistry, category milestones, and more
- Data table preview of imported rows
- Shareable PNG captures for several dashboard sections

## Tech stack

| Area | Choice |
|------|--------|
| UI | React 19, TypeScript, Tailwind CSS 4, Vite |
| Charts | Recharts |
| Spreadsheet parsing | SheetJS (`xlsx`) |
| Share images | `html-to-image` |

Chart usage is documented in [docs/charts.md](docs/charts.md).

## Documentation

Product and engineering specs live in [`docs/`](docs/):

| Doc | Topic |
|-----|--------|
| [charts.md](docs/charts.md) | Recharts usage, summary pie layout |
| [tournament-recap-spec.md](docs/tournament-recap-spec.md) | Weekend recap cards, partner/date display rules |
| [tournament-progression-spec.md](docs/tournament-progression-spec.md) | Stage ladder, podium, milestones |
| [category-milestone-claims-spec.md](docs/category-milestone-claims-spec.md) | Claim flow and localStorage |
| [partner-chemistry-spec.md](docs/partner-chemistry-spec.md) | Partner chemistry chart |
| [partner-highlights-spec.md](docs/partner-highlights-spec.md) | Partner highlights |
| [opponent-matchups-spec.md](docs/opponent-matchups-spec.md) | Nemeses and favourite opponents |
| [player-type-spec.md](docs/player-type-spec.md) | Player profile axes |
| [rating-win-chance-table.md](docs/rating-win-chance-table.md) | Rating vs win chance reference |

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
- **Corporate firewall:** Local dev uses localhost only; the live preview URL needs normal HTTPS access

## Project layout

```
docs/             Product and engineering specs (see table above)
src/
  components/     UI: upload, dashboard, charts, table
  content/        In-app help copy for dashboard sections
  context/        Shared dataset and navigation state
  data/           Built-in sample dataset
  hooks/          Chart data, filters, milestone claims
  lib/            Spreadsheet parsing, stats, recap logic
  types/          TypeScript types
public/samples/   Example CSV you can upload
```

## Sharing with others

Anyone with the GitHub Pages link can open the app. They need a Match History export in the expected format to see real data — otherwise they can only use **Load sample data**.

To contribute code, fork the repo or ask to be added as a collaborator.
