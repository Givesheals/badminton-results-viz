import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  headerRight?: ReactNode
  minimal?: boolean
}

export function AppShell({ children, headerRight, minimal = false }: Props) {
  return (
    <div className="min-h-screen bg-white">
      {!minimal && (
        <header className="border-b border-ink-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <img
                src={`${import.meta.env.BASE_URL}badminfo-icon.png`}
                alt=""
                className="h-9 w-9 object-contain"
              />
              <span className="text-lg font-bold italic text-brand-600 sm:text-xl">
                BADMINFO
              </span>
            </div>
            {headerRight}
          </div>
        </header>
      )}
      <main className={`mx-auto max-w-6xl px-4 sm:px-6 ${minimal ? 'py-4' : 'py-5 sm:py-6'}`}>
        {children}
      </main>
    </div>
  )
}
