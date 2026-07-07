/**
 * Parses the showcase Match History export and writes public/premium-showcase/dataset.json.
 * Run: npm run showcase:prepare
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const SOURCE_CANDIDATES = [
  process.env.SHOWCASE_XLSX,
  path.join(root, 'marketing', 'simon-parker-data-age.xlsx'),
  path.join(process.env.HOME ?? '', 'Downloads', 'Simon Parker Data Age.xlsx'),
].filter(Boolean)

const OUT_DIR = path.join(root, 'public', 'premium-showcase')
const OUT_FILE = path.join(OUT_DIR, 'dataset.json')

const REQUIRED_HEADERS = [
  'Competition Name',
  'Date',
  'Discipline',
  'Player Game 1 Score',
  'Opponent Game 1 Score',
]

function cellToValue(cell) {
  if (cell === undefined || cell === null || cell === '') return null
  if (typeof cell === 'string' || typeof cell === 'number' || typeof cell === 'boolean') {
    return cell
  }
  return String(cell)
}

function sheetToRows(sheet) {
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
  })

  if (matrix.length === 0) return { headers: [], rows: [] }

  const headerRow = matrix[0] ?? []
  const headers = headerRow.map((h, i) => {
    const label = cellToValue(h)
    return label != null && String(label).trim() !== '' ? String(label).trim() : `Column ${i + 1}`
  })

  const rows = matrix.slice(1).map((row) => {
    const record = {}
    headers.forEach((header, index) => {
      record[header] = cellToValue(row[index])
    })
    return record
  })

  return {
    headers,
    rows: rows.filter((row) => Object.values(row).some((v) => v != null)),
  }
}

function findMatchHistorySheet(sheetNames) {
  const exact = sheetNames.find((name) => name.trim().toLowerCase() === 'match history')
  return exact ?? sheetNames[0]
}

function resolveSource() {
  for (const candidate of SOURCE_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate
  }
  throw new Error(
    `Showcase spreadsheet not found. Copy your export to marketing/simon-parker-data-age.xlsx or set SHOWCASE_XLSX.`,
  )
}

const source = resolveSource()
const buffer = fs.readFileSync(source)
const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
const sheetName = findMatchHistorySheet(workbook.SheetNames)
const sheet = workbook.Sheets[sheetName]
if (!sheet) throw new Error('Could not read worksheet.')

const { headers, rows } = sheetToRows(sheet)
const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
if (missing.length > 0) {
  throw new Error(`Missing required columns: ${missing.join(', ')}`)
}
if (rows.length === 0) throw new Error('No data rows found.')

const dataset = {
  fileName: path.basename(source),
  sheetName,
  headers,
  rows,
  importedAt: new Date().toISOString(),
  format: 'match-history',
}

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(dataset))
console.log(`Wrote ${rows.length} rows to ${OUT_FILE}`)
