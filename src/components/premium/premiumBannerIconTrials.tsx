import type { ReactNode } from 'react'

const SHUTTLE = `${import.meta.env.BASE_URL}badminfo-shuttle-white.png`

const METAL = 'linear-gradient(165deg, #e2c56a 0%, #c9a227 46%, #8f7014 100%)'

/** Version 1. Gone by 16px. The shuttle starts about 17px from the top-left. */
const SHINE_TOP_LEFT =
  'linear-gradient(135deg, rgba(255,255,255,.78) 0px, rgba(255,255,255,.42) 8px, rgba(255,255,255,.14) 13px, transparent 16px)'

/**
 * Version 6's bottom-right shine. It starts at 32px, which is where the
 * shuttle's bottom-right tip sits, so the white meets the icon.
 */
const SHINE_BOTTOM_RIGHT_CLOSE =
  'linear-gradient(135deg, transparent 32px, rgba(255,255,255,.4) 38px, rgba(255,255,255,.8) 45px)'

/**
 * Same corner, pulled back. The shuttle tip is at about 32px along this
 * diagonal, so the white now starts at 35px and is gone before the icon.
 */
const SHINE_BOTTOM_RIGHT =
  'linear-gradient(135deg, transparent 35px, rgba(255,255,255,.32) 40px, rgba(255,255,255,.72) 45px)'

function GoldTile({ sheen }: { sheen: string[] }) {
  return (
    <span
      className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-[7px]"
      style={{ background: [...sheen, METAL].join(', ') }}
    >
      <img src={SHUTTLE} alt="" className="relative h-full w-full" />
    </span>
  )
}

export const BANNER_ICON_TRIALS: { n: number; name: string; icon: ReactNode }[] = [
  {
    n: 1,
    name: 'Combined',
    icon: <GoldTile sheen={[SHINE_TOP_LEFT, SHINE_BOTTOM_RIGHT]} />,
  },
  {
    n: 2,
    name: 'Top-left only',
    icon: <GoldTile sheen={[SHINE_TOP_LEFT]} />,
  },
  {
    n: 3,
    name: 'Both corners, previous',
    icon: <GoldTile sheen={[SHINE_TOP_LEFT, SHINE_BOTTOM_RIGHT_CLOSE]} />,
  },
]
