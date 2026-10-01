import { useEffect } from 'react'
import { AppShell } from '../layout/AppShell'
import {
  PREMIUM_TERMS_LAST_UPDATED,
  PREMIUM_TERMS_SECTIONS,
  PREMIUM_TERMS_TITLE,
} from './premiumTermsContent'

export function PremiumTermsPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${PREMIUM_TERMS_TITLE} - BadmInfo`
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <AppShell>
      <article className="mx-auto max-w-3xl pb-12">
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{PREMIUM_TERMS_TITLE}</h1>
        <p className="mt-2 text-sm text-ink-500">{PREMIUM_TERMS_LAST_UPDATED}</p>

        <div className="mt-8 space-y-8">
          {PREMIUM_TERMS_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-ink-900">{section.heading}</h2>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-ink-700">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </AppShell>
  )
}
