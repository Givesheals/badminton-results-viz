/** Raw values from the Tournament Category column map to display labels. */
export function formatTournamentCategory(raw: string | number | boolean | null): {
  value: string
  label: string
} {
  const value = raw == null || String(raw).trim() === '' ? 'N/A' : String(raw).trim()
  const normalized = value.toUpperCase()

  if (normalized === 'N/A' || normalized === 'NA') {
    return { value, label: 'County' }
  }

  return { value, label: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() }
}
