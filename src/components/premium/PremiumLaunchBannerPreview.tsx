const PREMIUM_ICON = `${import.meta.env.BASE_URL}badminfo-premium-figma.png`

const NAV_GROUPS = [
  ['Seniors', 'Juniors', 'Masters', 'Para', 'Grades', 'Ratings'],
  ['Senior County'],
  ['Shires'],
  ['Contact Us'],
] as const

/**
 * Premium launch banner in the production notice slot.
 * Open with ?preview=premium-banner, or from the account menu.
 */
export function PremiumLaunchBannerPreview() {
  return (
    <div className="min-h-screen bg-white text-[#222]">
      <header className="bg-[#efe6f6]">
        <div className="mx-auto flex max-w-[720px] items-center gap-3 px-3 py-2.5">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px]"
            aria-label="Menu"
          >
            <span className="block h-[2.5px] w-6 rounded-full bg-[#5b2d91]" />
            <span className="block h-[2.5px] w-6 rounded-full bg-[#5b2d91]" />
            <span className="block h-[2.5px] w-6 rounded-full bg-[#5b2d91]" />
          </button>

          <nav className="hidden min-w-0 items-center gap-3 text-[15px] sm:flex" aria-label="Main">
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
              className="h-9 w-full min-w-0 max-w-[220px] rounded-sm border border-transparent bg-white px-3 text-sm outline-none placeholder:text-[#9a94a3]"
            />
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6d28a0] text-sm font-bold text-white"
              aria-hidden
            >
              SP
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] space-y-3 px-2.5 py-3">
        <div className="flex items-center gap-1.5 bg-[#F4D99A] px-2.5 py-3">
          <img src={PREMIUM_ICON} alt="" className="h-8 w-8 shrink-0" />
          <p className="@container min-w-0 flex-1 text-[15px] leading-snug">
            {/* Break after the headline once the second sentence fits. Below that, drop "now" so it still fits on two lines. */}
            <span className="font-semibold">
              BadmInfo Premium is <span className="hidden @min-[250px]:inline">now </span>live!
            </span>
            <span className="@min-[250px]:hidden"> </span>
            <br className="hidden @min-[250px]:block" />
            Get a tactical head start.{' '}
            <span className="text-[#593196] underline">Learn more.</span>
          </p>
          <span className="shrink-0 text-xl leading-none text-[#5c5c5c]" aria-hidden>
            ×
          </span>
        </div>

        <div className="flex items-start gap-3 bg-[#CDEAFB] px-4 py-3 text-[15px] leading-snug">
          <div className="min-w-0 flex-1">
            <p>
              <span className="font-semibold">You are not logged in</span>, though your BE number is set.
            </p>
            <p className="mt-2">
              <span className="text-[#1a4f86] underline">Log in</span> to access favourites and notifications.
            </p>
          </div>
          <span className="shrink-0 px-1 text-xl leading-none text-[#5c5c5c]" aria-hidden>
            ×
          </span>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#e4e2e8] bg-white shadow-sm">
          <div className="bg-[#f2f0f6] px-4 py-4">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#343a40]">
              Senior Tournaments
            </h1>
          </div>
        </section>
      </div>
    </div>
  )
}
