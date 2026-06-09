import * as XLSX from 'xlsx'
import type { ParsedDataset, SpreadsheetRow } from '../types/dataset'
import {
  findMatchHistorySheet,
  validateMatchHistoryDataset,
} from './matchHistory'

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'] as const

export function isAcceptedSpreadsheet(file: File): boolean {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

function cellToValue(cell: unknown): string | number | boolean | null {
  if (cell === undefined || cell === null || cell === '') return null
  if (typeof cell === 'string' || typeof cell === 'number' || typeof cell === 'boolean') {
    return cell
  }
  return String(cell)
}

function sheetToRows(sheet: XLSX.WorkSheet): { headers: string[]; rows: SpreadsheetRow[] } {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  }) as unknown[][]

  if (matrix.length === 0) {
    return { headers: [], rows: [] }
  }

  const headerRow = matrix[0] ?? []
  const headers = headerRow.map((h, i) => {
    const label = cellToValue(h)
    return label != null && String(label).trim() !== ''
      ? String(label).trim()
      : `Column ${i + 1}`
  })

  const rows: SpreadsheetRow[] = matrix.slice(1).map((row) => {
    const record: SpreadsheetRow = {}
    headers.forEach((header, index) => {
      record[header] = cellToValue(row[index])
    })
    return record
  })

  return { headers, rows: rows.filter((row) => Object.values(row).some((v) => v != null)) }
}

function pickSheet(workbook: XLSX.WorkBook): { sheetName: string; sheet: XLSX.WorkSheet } {
  const preferredName = findMatchHistorySheet(workbook.SheetNames)
  const sheetName = preferredName ?? workbook.SheetNames[0]

  if (!sheetName) {
    throw new Error('The file has no worksheets.')
  }

  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new Error('Could not read the worksheet.')
  }

  return { sheetName, sheet }
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedDataset> {
  if (!isAcceptedSpreadsheet(file)) {
    throw new Error('Please upload an Excel (.xlsx, .xls) or CSV file.')
  }

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const { sheetName, sheet } = pickSheet(workbook)
  const { headers, rows } = sheetToRows(sheet)

  validateMatchHistoryDataset(headers)

  if (rows.length === 0) {
    throw new Error('No match rows found below the header row.')
  }

  return {
    fileName: file.name,
    sheetName,
    headers,
    rows,
    importedAt: new Date().toISOString(),
    format: 'match-history',
  }
}
