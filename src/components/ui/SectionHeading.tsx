import type { ReactNode } from 'react'
import { InfoPopover } from './InfoPopover'
import type { InfoButtonSize } from './InfoButton'

type Props = {
  children: ReactNode
  info?: ReactNode
  /** Title shown in the information modal - the card or section heading. */
  infoTitle?: string
  /** Accessible name for the information button. Defaults to "About {infoTitle}". */
  infoLabel?: string
  size?: 'section' | 'panel'
  className?: string
  actions?: ReactNode
}

const ICON_SIZE: Record<'section' | 'panel', InfoButtonSize> = {
  section: 'md',
  panel: 'sm',
}

/** Title row with optional information modal to the right of the title. */
export function SectionHeading({
  children,
  info,
  infoTitle,
  infoLabel,
  size = 'section',
  className = '',
  actions,
}: Props) {
  const buttonLabel =
    infoLabel ?? (infoTitle != null ? `About ${infoTitle}` : undefined)

  return (
    <div
      className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${className}`.trim()}
    >
      {children}
      {info != null && infoTitle != null && buttonLabel != null ? (
        <InfoPopover title={infoTitle} label={buttonLabel} size={ICON_SIZE[size]}>
          {info}
        </InfoPopover>
      ) : null}
      {actions}
    </div>
  )
}
