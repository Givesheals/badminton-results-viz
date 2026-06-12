import type { ReactNode } from 'react'
import { InfoPopover } from './InfoPopover'
import type { InfoButtonSize } from './InfoButton'

type Props = {
  children: ReactNode
  info?: ReactNode
  infoLabel: string
  size?: 'section' | 'panel'
  className?: string
  actions?: ReactNode
}

const ICON_SIZE: Record<'section' | 'panel', InfoButtonSize> = {
  section: 'md',
  panel: 'sm',
}

/** Title row with optional info popover to the right of the title. */
export function SectionHeading({
  children,
  info,
  infoLabel,
  size = 'section',
  className = '',
  actions,
}: Props) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${className}`.trim()}
    >
      {children}
      {info != null ? (
        <InfoPopover label={infoLabel} size={ICON_SIZE[size]}>
          {info}
        </InfoPopover>
      ) : null}
      {actions}
    </div>
  )
}
