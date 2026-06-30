/** First + last token initials for avatar badges (e.g. "Simon Parker" → "SP"). */
export function getPlayerInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'

  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase()
  }

  const first = parts[0]!.charAt(0)
  const last = parts[parts.length - 1]!.charAt(0)
  return `${first}${last}`.toUpperCase()
}
