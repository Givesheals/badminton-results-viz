import { useEffect } from 'react'

const PURPLE = '#5C3992'
const DIVIDER = '#D2D2D2'
const CLOSE = '#808080'
const SUPPORT = '#F75A60'

function KofiCupIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: '1.15em', height: '1.15em', flexShrink: 0 }}
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

export function ProductionSideMenuOverlayPreview() {
  // Load Roboto (used in production) so font rendering matches
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // Reference screenshot is 672x1024. We render at that coordinate space,
  // then uniformly scale the whole canvas down to TARGET_W.
  const REF_W = 672
  const REF_H = 1024
  const TARGET_W = 375
  const scale = TARGET_W / REF_W

  // All coordinates below are in the original 672x1024 reference space.
  // The outer scale() transform maps them to ~375px width automatically.

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
        {/* Reference blurred backdrop */}
        <img
          src={`${import.meta.env.BASE_URL}production-side-menu.png`}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
          draggable={false}
        />

        {/* White drawer panel — covers the reference menu so we can overlay editable elements */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 209,
            width: 438,
            height: 1024,
            background: '#fff',
          }}
        >
          {/* ── Header row: logo + close X ── */}
          <img
            src={`${import.meta.env.BASE_URL}badminfo-logo-production.png`}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: 28,
              top: 53,
              width: 301,
              height: 50,
              objectFit: 'contain',
            }}
          />
          {/* Close icon — measured in ref at x=566..587, drawer-local x=357..378 */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: 357,
              top: 56,
              fontSize: 28,
              lineHeight: '28px',
              fontWeight: 400,
              color: CLOSE,
            }}
          >
            ✕
          </span>

          {/* ── Avatar circle ── */}
          {/* ref: x=379..441 (w=63), y=130..191 (h=62). Drawer-local: left=170, top=130 */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 170,
              top: 130,
              width: 63,
              height: 62,
              borderRadius: 999,
              background: PURPLE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
              // fontSize chosen so cap height fills ~40% of the 62px circle
              fontSize: 35,
            }}
          >
            SP
          </div>

          {/* ── Username ── */}
          {/* ref y=208..230 (h=22px body text) */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 208,
              left: 0,
              width: 438,
              textAlign: 'center',
              color: '#000',
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            Simon Parker: 1206628
          </div>

          {/* ── Profile &amp; Results (bold purple heading) ── */}
          {/* ref: purple pixels y=264..289 (center~277), x=283..538 */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 250,
              left: 0,
              width: 438,
              textAlign: 'center',
              color: PURPLE,
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.15,
            }}
          >
            Profile &amp; Results
          </div>

          {/* ── Divider ── */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 338,
              left: 24,
              width: 390,
              height: 1,
              background: DIVIDER,
            }}
          />

          {/* ── Your Account section heading ── */}
          {/* ref: y=375..402, x=234..429 (dark grey bold) */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 365,
              left: 24,
              width: 300,
              fontSize: 38,
              fontWeight: 600,
              color: '#4B4B4B',
            }}
          >
            Your Account
          </div>

          {/* ── Menu links ── */}
          {/* production uses text-base font-medium (500) for all links */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 435,
              left: 48,
              width: 300,
              color: PURPLE,
              fontSize: 38,
              fontWeight: 500,
            }}
          >
            User Settings
          </div>

          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 512,
              left: 48,
              width: 300,
              color: PURPLE,
              fontSize: 38,
              fontWeight: 500,
            }}
          >
            Favourites
          </div>

          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 589,
              left: 48,
              width: 300,
              color: PURPLE,
              fontSize: 38,
              fontWeight: 500,
            }}
          >
            Notifications
          </div>

          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 665,
              left: 48,
              width: 350,
              color: PURPLE,
              fontSize: 38,
              fontWeight: 500,
            }}
          >
            Change Postcode
            <div
              style={{
                marginTop: 6,
                fontSize: 22,
                fontWeight: 500,
                color: PURPLE,
              }}
            >
              Current: CB2 9NF
            </div>
          </div>

          {/* ── Second divider ── */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 791,
              left: 24,
              width: 390,
              height: 1,
              background: DIVIDER,
            }}
          />

          {/* ── Admin section heading ── */}
          {/* ref: y=825..855 */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 820,
              left: 24,
              width: 200,
              fontSize: 38,
              fontWeight: 600,
              color: '#4B4B4B',
            }}
          >
            Admin
          </div>

          {/* ── Admin Area link ── */}
          {/* ref: y=902..930 */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 896,
              left: 64,
              width: 260,
              color: PURPLE,
              fontSize: 38,
              fontWeight: 500,
            }}
          >
            Admin Area
          </div>

          {/* ── Support Us button ── */}
          {/* ref: x=254..565 (w=311), y=953..1020 (h=67). Drawer-local: left=45 */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 953,
              left: 45,
              width: 311,
              height: 67,
              background: SUPPORT,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 26,
              gap: 12,
            }}
          >
            <KofiCupIcon />
            <span>Support Us</span>
          </div>
        </div>
      </div>
    </div>
  )
}
