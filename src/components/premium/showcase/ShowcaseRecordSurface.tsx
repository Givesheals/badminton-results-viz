import { useEffect, useState, type ReactNode } from 'react'
import { PremiumNotesCaptureDemo } from '../PremiumNotesCaptureDemo'
import { PremiumShowcaseProvider, usePremiumShowcase } from './PremiumShowcaseContext'
import {
  PeopleShowcaseSlide,
  PlayerSummaryShowcaseSlide,
  RecapShowcaseSlide,
} from './PremiumShowcaseSlides'

export const SHOWCASE_RECORD_SLIDE_IDS = ['notes', 'recap', 'summary', 'people'] as const
export type ShowcaseRecordSlideId = (typeof SHOWCASE_RECORD_SLIDE_IDS)[number]

type Props = {
  slideId: ShowcaseRecordSlideId
}

export function isShowcaseRecordSlideId(value: string | null): value is ShowcaseRecordSlideId {
  return SHOWCASE_RECORD_SLIDE_IDS.includes(value as ShowcaseRecordSlideId)
}

declare global {
  interface Window {
    __startShowcaseRecord?: () => void
  }
}

function markDataReady() {
  const root = document.querySelector('[data-showcase-record-ready]')
  if (root instanceof HTMLElement) {
    root.dataset.showcaseRecordReady = 'true'
  }
}

function RecordGate({
  children,
  waitForData,
}: {
  children: (active: boolean) => ReactNode
  waitForData: boolean
}) {
  const data = usePremiumShowcase()
  const [active, setActive] = useState(false)

  useEffect(() => {
    window.__startShowcaseRecord = () => setActive(true)
    return () => {
      delete window.__startShowcaseRecord
    }
  }, [])

  useEffect(() => {
    if (!waitForData || data) markDataReady()
  }, [waitForData, data])

  if (waitForData && !data) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50/60 to-white">
        <p className="text-sm text-ink-500">Loading preview…</p>
      </div>
    )
  }

  return children(active)
}

/**
 * Full-bleed surface used only by the Playwright recording script.
 * Animations stay paused until `window.__startShowcaseRecord()` runs, so
 * captured clips do not include dataset loading time.
 */
export function ShowcaseRecordSurface({ slideId }: Props) {
  const needsDataset = slideId !== 'notes'

  const renderSlide = (active: boolean) => {
    if (slideId === 'notes') return <PremiumNotesCaptureDemo active={active} />
    if (slideId === 'recap') return <RecapShowcaseSlide active={active} />
    if (slideId === 'summary') return <PlayerSummaryShowcaseSlide active={active} />
    return <PeopleShowcaseSlide active={active} />
  }

  const body = needsDataset ? (
    <PremiumShowcaseProvider>
      <RecordGate waitForData>{renderSlide}</RecordGate>
    </PremiumShowcaseProvider>
  ) : (
    <RecordGate waitForData={false}>{renderSlide}</RecordGate>
  )

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-white"
      data-showcase-record-ready="pending"
      data-showcase-record-slide={slideId}
    >
      <div className="h-full w-full" data-showcase-record-frame>
        {body}
      </div>
    </div>
  )
}
