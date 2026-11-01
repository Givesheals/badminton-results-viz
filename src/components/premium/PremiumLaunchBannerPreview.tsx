const PREMIUM_ICON = `${import.meta.env.BASE_URL}badminfo-premium-icon.svg`

const NAV_GROUPS = [
  ['Seniors', 'Juniors', 'Masters', 'Para', 'Grades', 'Ratings'],
  ['Senior County'],
  ['Shires'],
  ['Contact Us'],
] as const

function BannerRow() {
  return (
    <div className="flex items-center gap-2.5 bg-[#e0c9f3] px-3 py-2.5 sm:px-4">
      <img src={PREMIUM_ICON} alt="" className="h-8 w-8 shrink-0" />
      <span className="min-w-0 flex-1 text-[15px] leading-snug">
        <span className="font-semibold">BadmInfo Premium is now live!</span> Get a tactical head start.{' '}
        <span className="text-[#593196] underline">Learn more.</span>
      </span>
      <span className="shrink-0 px-1 text-xl leading-none text-[#5c5c5c]" aria-hidden>
        ×
      </span>
    </div>
  )
}

/**
 * Chosen premium icon, in the banner and at a large size.
 * Open with ?preview=premium-banner
 */
export function PremiumLaunchBannerPreview() {
  return (
    <div className="min-h-screen bg-[#f3eef8] text-[#222]">
      <header className="bg-[#f3eef8]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px]"
            aria-label="Menu"
          >
            <span className="block h-[2.5px] w-6 rounded-full bg-[#5b2d91]" />
            <span className="block h-[2.5px] w-6 rounded-full bg-[#5b2d91]" />
            <span className="block h-[2.5px] w-6 rounded-full bg-[#5b2d91]" />
          </button>

          <nav className="hidden min-w-0 items-center gap-3 text-[15px] lg:flex" aria-label="Main">
            {NAV_GROUPS.map((group, index) => (
              <div
                key={group[0]}
                className={`flex items-center gap-3 ${index > 0 ? 'border-l border-[#d9d0e4] pl-3' : ''}`}
              >
                {group.map((item) => (
                  <span key={item} className={item === 'Seniors' ? 'font-bold' : 'font-medium'}>
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            <input
              type="search"
              placeholder="Search"
              aria-label="Search"
              className="h-9 w-full min-w-0 max-w-[220px] rounded-sm border border-[#e4dced] bg-white px-3 text-sm outline-none placeholder:text-[#9a94a3] sm:w-52"
            />
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6d28a0] text-white"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z" />
              </svg>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:px-4">
        <p className="text-sm text-[#4a3d5c]">
          The chosen icon. Same artwork in the banner and at a large size.
        </p>
        <BannerRow />
        <img src={PREMIUM_ICON} alt="BadmInfo Premium icon" className="h-80 w-80" />
      </main>
    </div>
  )
}
