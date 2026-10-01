export type LegalPageId = 'premium-terms'

const LEGAL_PAGE_IDS: LegalPageId[] = ['premium-terms']

/** Returns the legal page requested in the URL (?page=premium-terms), if any. */
export function getLegalPageId(): LegalPageId | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('page')
  return LEGAL_PAGE_IDS.find((id) => id === value) ?? null
}

/** Live BadmInfo Privacy Policy (hosted outside this prototype). Update here if the address changes. */
export const PRIVACY_POLICY_URL = 'https://badminfo.com/privacy'

/** Link to a legal page that works on both local dev and the GitHub Pages deployment. */
export function legalPageHref(id: LegalPageId): string {
  return `${import.meta.env.BASE_URL}?page=${id}`
}
