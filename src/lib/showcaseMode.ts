import {
  isShowcaseRecordSlideId,
  type ShowcaseRecordSlideId,
} from '../components/premium/showcase/ShowcaseRecordSurface'

export function isShowcaseMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('showcase')
}

export function getShowcaseRecordSlideId(): ShowcaseRecordSlideId | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('showcase-record')
  return isShowcaseRecordSlideId(value) ? value : null
}
