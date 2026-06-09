import type { ReactNode } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-brand-200/70 bg-brand-50/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-lg text-white shadow-sm ring-1 ring-brand-300/50"
              aria-hidden
            >
              🏸
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                Prototype
              </p>
              <h1 className="text-lg font-semibold text-ink-900 sm:text-xl">
                Badminton Results
              </h1>
            </div>
          </div>
          <p className="hidden text-sm text-ink-700 sm:block">
            Upload your sheet · Explore your stats
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
