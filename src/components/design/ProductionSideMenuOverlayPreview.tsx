import { useEffect, type ReactNode } from 'react'

const PURPLE = '#5C3992'
const ICON = 'rgb(122, 77, 154)'
const HEADING = '#3D3D3D'
const DIVIDER = '#E0E0E0'
const CLOSE = '#808080'
const SUPPORT = '#F75A60'

const FA = {
  flagCheckered: {
    viewBox: '0 0 448 512',
    d: 'M32 0C49.7 0 64 14.3 64 32V48l69-17.2c38.1-9.5 78.3-5.1 113.5 12.5c46.3 23.2 100.8 23.2 147.1 0l9.6-4.8C423.8 28.1 448 43.1 448 66.1V345.8c0 13.3-8.3 25.3-20.8 30l-34.7 13c-46.2 17.3-97.6 14.6-141.7-7.4c-37.9-19-81.3-23.7-122.5-13.4L64 384v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V400 334 64 32C0 14.3 14.3 0 32 0zM64 187.1l64-13.9v65.5L64 252.6V318l48.8-12.2c5.1-1.3 10.1-2.4 15.2-3.3V238.7l38.9-8.4c8.3-1.8 16.7-2.5 25.1-2.1l0-64c13.6 .4 27.2 2.6 40.4 6.4l23.6 6.9v66.7l-41.7-12.3c-7.3-2.1-14.8-3.4-22.3-3.8v71.4c21.8 1.9 43.3 6.7 64 14.4V244.2l22.7 6.7c13.5 4 27.3 6.4 41.3 7.4V194c-7.8-.8-15.6-2.3-23.2-4.5l-40.8-12v-62c-13-3.8-25.8-8.8-38.2-15c-8.2-4.1-16.9-7-25.8-8.8v72.4c-13-.4-26 .8-38.7 3.6L128 173.2V98L64 114v73.1zM320 335.7c16.8 1.5 33.9-.7 50-6.8l14-5.2V251.9l-7.9 1.8c-18.4 4.3-37.3 5.7-56.1 4.5v77.4zm64-149.4V115.4c-20.9 6.1-42.4 9.1-64 9.1V194c13.9 1.4 28 .5 41.7-2.6l22.3-5.2z',
  },
  noteSticky: {
    viewBox: '0 0 448 512',
    d: 'M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H288V368c0-26.5 21.5-48 48-48H448V96c0-35.3-28.7-64-64-64H64zM448 352H402.7 336c-8.8 0-16 7.2-16 16v66.7V480l32-32 64-64 32-32z',
  },
  users: {
    viewBox: '0 0 640 512',
    d: 'M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0H21.3C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7h42.7C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3H405.3zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352H378.7C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z',
  },
  chartSimple: {
    viewBox: '0 0 448 512',
    d: 'M160 80c0-26.5 21.5-48 48-48h32c26.5 0 48 21.5 48 48V432c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V80zM0 272c0-26.5 21.5-48 48-48H80c26.5 0 48 21.5 48 48V432c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V272zM368 96h32c26.5 0 48 21.5 48 48V432c0 26.5-21.5 48-48 48H368c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48z',
  },
  creditCard: {
    viewBox: '0 0 576 512',
    d: 'M64 32C28.7 32 0 60.7 0 96v32H576V96c0-35.3-28.7-64-64-64H64zM576 224H0V416c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V224zM112 352h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16zm112 16c0-8.8 7.2-16 16-16H368c8.8 0 16 7.2 16 16s-7.2 16-16 16H240c-8.8 0-16-7.2-16-16z',
  },
  gear: {
    viewBox: '0 0 512 512',
    d: 'M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z',
  },
  star: {
    viewBox: '0 0 576 512',
    d: 'M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z',
  },
  bell: {
    viewBox: '0 0 448 512',
    d: 'M224 0c-17.7 0-32 14.3-32 32V51.2C119 66 64 130.6 64 208v18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416H416c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z',
  },
  locationDot: {
    viewBox: '0 0 384 512',
    d: 'M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z',
  },
  shieldHalved: {
    viewBox: '0 0 512 512',
    d: 'M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8V444.8C394 378 431.1 230.1 432 141.4L256 66.8l0 0z',
  },
} as const

function FaIcon({ icon }: { icon: (typeof FA)[keyof typeof FA] }) {
  return (
    <svg
      viewBox={icon.viewBox}
      aria-hidden
      style={{ width: '0.95em', height: '0.95em', flexShrink: 0, fill: ICON }}
    >
      <path d={icon.d} />
    </svg>
  )
}

function KofiCupIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: '1.05em', height: '1.05em', flexShrink: 0 }}
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

function Divider() {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        background: DIVIDER,
        margin: '0.4em 0.75em',
        flexShrink: 0,
      }}
    />
  )
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: '0.1em 0.9em 0.28em',
        fontSize: '0.88em',
        fontWeight: 600,
        color: HEADING,
      }}
    >
      {children}
    </div>
  )
}

function MenuRow({
  icon,
  label,
}: {
  icon: (typeof FA)[keyof typeof FA]
  label: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65em',
        padding: '0.32em 0.9em',
        color: PURPLE,
        fontSize: '0.88em',
        fontWeight: 500,
        lineHeight: 1.15,
      }}
    >
      <FaIcon icon={icon} />
      <span>{label}</span>
    </div>
  )
}

export function ProductionSideMenuOverlayPreview() {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // New reference is 475x1024 with the drawer starting around x=165.
  const REF_W = 475
  const REF_H = 1024
  const TARGET_W = 375
  const scale = TARGET_W / REF_W
  const PANEL_LEFT = 165
  const PANEL_W = REF_W - PANEL_LEFT

  return (
    <div
      className="relative w-[375px] overflow-hidden"
      style={{ aspectRatio: `${REF_W} / ${REF_H}` }}
    >
      <div
        style={{
          width: REF_W,
          height: REF_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
          fontFamily: "'Roboto', sans-serif",
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}production-side-menu.png`}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          draggable={false}
        />

        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: PANEL_LEFT,
            width: PANEL_W,
            height: REF_H,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            fontSize: 24,
            boxShadow: '-6px 0 18px rgba(0,0,0,0.18)',
          }}
        >
          {/* Header: logo + close */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.95em 1.7em 0.55em 0.7em',
              flexShrink: 0,
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}badminfo-logo-production.png`}
              alt=""
              draggable={false}
              style={{
                width: '72%',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: '0.5em',
                top: '0.75em',
                fontSize: '0.9em',
                lineHeight: 1,
                fontWeight: 400,
                color: CLOSE,
              }}
            >
              ✕
            </span>
          </div>

          <Divider />

          {/* Profile block */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.4em 0.7em 0.25em',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '2.2em',
                height: '2.2em',
                borderRadius: 999,
                background: PURPLE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 600,
                fontSize: '1em',
              }}
            >
              SP
            </div>
            <div
              style={{
                marginTop: '0.4em',
                fontSize: '0.68em',
                fontWeight: 500,
                color: '#222',
              }}
            >
              Simon Parker: 1206628
            </div>
            <div
              style={{
                marginTop: '0.28em',
                fontSize: '0.95em',
                fontWeight: 500,
                color: PURPLE,
              }}
            >
              Profile &amp; Results
            </div>
          </div>

          <Divider />

          {/* Player Lab */}
          <SectionHeading>Player Lab</SectionHeading>
          <MenuRow icon={FA.flagCheckered} label="Tournament Recaps" />
          <MenuRow icon={FA.noteSticky} label="Notes" />
          <MenuRow icon={FA.users} label="People" />
          <MenuRow icon={FA.chartSimple} label="Your Stats" />

          <Divider />

          {/* Personal Settings */}
          <SectionHeading>Personal Settings</SectionHeading>
          <MenuRow icon={FA.creditCard} label="Subscription & Billing" />
          <MenuRow icon={FA.gear} label="User Settings" />
          <MenuRow icon={FA.star} label="Favourites" />
          <MenuRow icon={FA.bell} label="Notifications" />
          <MenuRow icon={FA.locationDot} label="Set Post Code" />

          <Divider />

          {/* Admin */}
          <SectionHeading>Admin</SectionHeading>
          <MenuRow icon={FA.shieldHalved} label="Admin Area" />

          {/* Support CTA */}
          <div
            style={{
              marginTop: 'auto',
              padding: '0.7em 0.85em 0.95em',
              display: 'flex',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '88%',
                height: '2.15em',
                background: SUPPORT,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.88em',
                gap: '0.45em',
              }}
            >
              <KofiCupIcon />
              <span>Support Us</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
