export type DrawScoutDeepLink = {
  tab: 'notes' | null
  drawSlug: string | null
  playerName: string | null
}

export function readDrawScoutDeepLink(search = window.location.search): DrawScoutDeepLink {
  const params = new URLSearchParams(search)
  const tab = params.get('tab')
  return {
    tab: tab === 'notes' ? 'notes' : null,
    drawSlug: params.get('draw'),
    playerName: params.get('player'),
  }
}
