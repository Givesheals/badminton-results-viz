import { useEffect } from 'react'

const PURPLE = '#5C3992'
const HEADING = '#4B4B4B'
const DIVIDER = '#D2D2D2'
const CLOSE = '#808080'
const SUPPORT = '#F75A60'
const USERNAME = '#000000'

function KofiCupIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.15em] w-[1.15em] shrink-0"
      aria-hidden
    >
      <path
        d="M3.6 8.2h12.2c.4 0 .7.3.7.7v4.4c0 2.6-2.1 4.7-4.7 4.7H8.3c-2.6 0-4.7-2.1-4.7-4.7V8.9c0-.4.3-.7.7-.7Z"
        fill="#fff"
        stroke="#3a3a3a"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 9.4h1.4c1.5 0 2.6 1.2 2.6 2.6s-1.1 2.6-2.6 2.6h-1.4"
        fill="none"
        stroke="#3a3a3a"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path
        d="M11.2 10.55c.9-.85 2.35-.2 2.35 1.05 0 1.55-2.35 2.7-2.35 2.7S8.85 13.15 8.85 11.6c0-1.25 1.45-1.9 2.35-1.05Z"
        fill={SUPPORT}
      />
    </svg>
  )
}

function PeekTournamentList() {
  const rows = [
    'Cambridgeshire Senior Bronze',
    'Essex Senior Bronze',
    'Herts Junior Silver',
    'Suffolk Senior Copper',
    'Norfolk Masters Gold',
    'Beds Senior Bronze',
    'Kent Junior Silver',
    'Surrey Senior Gold',
  ]

  return (
    <div className="h-full bg-[#f4f5f8] pt-[2.4em] text-left">
      <div className="px-[0.7em] pb-[0.55em]">
        <div className="h-[0.7em] w-[4.8em] rounded-sm bg-[#c5c7ce]" />
        <div className="mt-[0.35em] h-[0.45em] w-[3.2em] rounded-sm bg-[#d5d7de]" />
      </div>
      {rows.map((name) => (
        <div key={name} className="border-t border-[#e2e4ea] px-[0.7em] py-[0.55em]">
          <div className="h-[0.55em] w-[88%] rounded-sm bg-[#c8cad1]" />
          <div className="mt-[0.28em] h-[0.38em] w-[52%] rounded-sm bg-[#d8dae0]" />
        </div>
      ))}
    </div>
  )
}

export function ProductionSideMenuPreview() {
  useEffect(() => {
    const id = 'roboto-production-side-menu'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;1,700&display=swap'
    document.head.appendChild(link)
  }, [])

  return (
    <div
      className="relative mx-auto w-full max-w-[375px] overflow-hidden rounded-[28px] border border-ink-200 bg-white shadow-[0_8px_24px_rgba(20,25,38,0.12)]"
      style={{
        aspectRatio: '375 / 812',
        containerType: 'inline-size',
        fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >

      <div className="absolute inset-0" aria-hidden data-testid="production-side-menu-backdrop">
        <div className="absolute inset-0 blur-[2px] scale-[1.03]">
          <PeekTournamentList />
        </div>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div
        data-testid="production-side-menu-panel"
        className="absolute inset-y-0 right-0 flex w-[71%] flex-col bg-white"
        style={{
          fontSize: '4.267cqw',
          boxShadow: '-6px 0 18px rgba(0,0,0,0.18)',
        }}
      >
        {/* Right-side drawer "handle" (two vertical lines) */}
        <div
          className="pointer-events-none absolute right-[0.25em] top-[48%] flex items-center gap-[0.35em]"
          aria-hidden
        >
          <span className="h-[1.45em] w-[0.12em] rounded-[0.06em] bg-[#D2D2D2]" />
          <span className="h-[1.45em] w-[0.12em] rounded-[0.06em] bg-[#D2D2D2]" />
        </div>

        <div className="flex shrink-0 items-center justify-between px-[1.05em] pt-[0.85em] pb-[0.35em]">
          <img
            src={`${import.meta.env.BASE_URL}badminfo-logo-production.png`}
            alt="BADMINFO"
            className="h-[1.7em] w-auto max-w-[78%] object-contain object-left"
          />
          <span
            className="flex h-[1.6em] w-[1.6em] items-center justify-center text-[1.4em] font-semibold leading-none"
            style={{ color: CLOSE }}
            aria-hidden
          >
            ✕
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-center px-[0.85em] pt-[0.55em] pb-[0.95em] text-center">
          <div
            className="flex h-[3.35em] w-[3.35em] items-center justify-center rounded-full text-[1.2em] font-bold text-white"
            style={{ backgroundColor: PURPLE }}
            aria-hidden
          >
            SP
          </div>
          <p
            className="mt-[0.45em] text-[0.82em] font-medium leading-none"
            style={{ color: USERNAME }}
          >
            Simon Parker: 1206628
          </p>
          <p
            className="mt-[0.7em] text-[1.22em] font-bold leading-none"
            style={{ color: PURPLE }}
          >
            Profile &amp; Results
          </p>
        </div>

        <div className="mx-[0.15em] h-px shrink-0" style={{ backgroundColor: DIVIDER }} />

        <div className="flex min-h-0 flex-1 flex-col justify-evenly py-[0.35em]">
          <p
            className="px-[0.75em] text-[1.22em] font-bold leading-none"
            style={{ color: HEADING }}
          >
            Your Account
          </p>
          <p
            className="px-[1.55em] text-[1.18em] font-bold leading-none"
            style={{ color: PURPLE }}
          >
            User Settings
          </p>
          <p
            className="px-[1.55em] text-[1.18em] font-bold leading-none"
            style={{ color: PURPLE }}
          >
            Favourites
          </p>
          <p
            className="px-[1.55em] text-[1.18em] font-bold leading-none"
            style={{ color: PURPLE }}
          >
            Notifications
          </p>
          <div className="px-[1.55em]">
            <p className="text-[1.18em] font-bold leading-none" style={{ color: PURPLE }}>
              Change Postcode
            </p>
            <p
              className="mt-[0.28em] text-[0.82em] font-normal leading-none"
              style={{ color: PURPLE }}
            >
              Current: CB2 9NF
            </p>
          </div>
        </div>

        <div className="mx-[0.15em] h-px shrink-0" style={{ backgroundColor: DIVIDER }} />

        <div className="flex shrink-0 flex-col gap-[0.85em] px-[0.75em] pt-[0.85em]">
          <p className="text-[1.22em] font-bold leading-none" style={{ color: HEADING }}>
            Admin
          </p>
          <p
            className="pl-[2.05em] pr-0 text-[1.18em] font-bold leading-none"
            style={{ color: PURPLE }}
          >
            Admin Area
          </p>
        </div>

        <div className="shrink-0 px-[0.75em] pb-[0.95em] pt-[0.9em]">
          <div
            className="flex h-[2.45em] w-full items-center justify-center gap-[0.4em] rounded-full text-[0.95em] font-bold text-white"
            style={{ backgroundColor: SUPPORT }}
          >
            <KofiCupIcon />
            Support Us
          </div>
        </div>
      </div>
    </div>
  )
}
