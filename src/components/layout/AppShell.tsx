import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  headerRight?: ReactNode
  minimal?: boolean
}

export function AppShell({ children, headerRight, minimal = false }: Props) {
  return (
    <div className="min-h-screen">
      {!minimal && (
        <header className="border-b border-brand-200/70 bg-brand-50/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}badminfo-icon.png`}
                alt="Badminfo"
                className="h-10 w-10 object-contain"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                  Prototype
                </p>
                <h1 className="text-lg font-semibold text-ink-900 sm:text-xl">
                  Badminton Results
                </h1>
              </div>
            </div>
            {headerRight ?? (
              <p className="hidden text-sm text-ink-700 sm:block">
                Upload your sheet · Explore your stats
              </p>
            )}
          </div>
        </header>
      )}
      <main className={`mx-auto max-w-6xl px-4 sm:px-6 ${minimal ? 'py-4' : 'py-8'}`}>
        {children}
      </main>
    </div>
  )
}
