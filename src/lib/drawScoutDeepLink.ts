export type DrawScoutDeepLink = {
  /** Events tab hosts Draw Scout. Legacy `?tab=notes&draw=` still opens Events. */
  tab: 'latest-event' | null
  drawSlug: string | null
  playerName: string | null
}

export function readDrawScoutDeepLink(search = window.location.search): DrawScoutDeepLink {
  const params = new URLSearchParams(search)
  const drawSlug = params.get('draw')
  const tab = params.get('tab')
  const opensEventsForDraw =
    drawSlug != null || tab === 'latest-event'

  return {
    tab: opensEventsForDraw ? 'latest-event' : null,
    drawSlug,
    playerName: params.get('player'),
  }
}
