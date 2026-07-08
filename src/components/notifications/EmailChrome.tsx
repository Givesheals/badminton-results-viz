import type { AnchorHTMLAttributes, ReactNode } from 'react'

/**
 * Shared building blocks styled to match the live BadmInfo transactional
 * emails: purple rocket wordmark header, white body with hairline section
 * dividers, and the "Good Luck! / Badminfo Team" sign-off footer.
 *
 * Links render as real anchors but never navigate — this is a static preview
 * of what the recipient's inbox would show.
 */

export function EmailHeader() {
  return (
    <div className="px-6 pt-8 pb-6">
      <img
        src={`${import.meta.env.BASE_URL}badminfo-logo.png`}
        alt="Badminfo"
        className="h-8 w-auto"
      />
    </div>
  )
}

type EmailLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }

/** Inline text link. Prevents navigation so previewing never leaves the app. */
export function EmailLink({ children, className = '', ...rest }: EmailLinkProps) {
  return (
    <a
      {...rest}
      onClick={(event) => event.preventDefault()}
      className={`text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-700 ${className}`.trim()}
    >
      {children}
    </a>
  )
}

/** Soft pill CTA (e.g. "Add notes"). Also inert in the preview. */
export function EmailButton({ children, className = '', ...rest }: EmailLinkProps) {
  return (
    <a
      {...rest}
      onClick={(event) => event.preventDefault()}
      className={`inline-flex items-center justify-center rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 no-underline transition hover:bg-brand-100 ${className}`.trim()}
    >
      {children}
    </a>
  )
}

/** Secondary outline CTA (e.g. "See notes"). */
export function EmailGhostButton({ children, className = '', ...rest }: EmailLinkProps) {
  return (
    <a
      {...rest}
      onClick={(event) => event.preventDefault()}
      className={`inline-flex items-center justify-center gap-1 text-sm font-semibold text-brand-600 no-underline hover:text-brand-700 ${className}`.trim()}
    >
      {children}
    </a>
  )
}

export function EmailSectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-lg font-bold text-ink-900">{children}</h2>
}

type EmailFooterProps = {
  /** Line shown above the sign-off, e.g. the "not interested?" opt-out copy. */
  optOut: ReactNode
  /** Sign-off line above "Badminfo Team". Defaults to the pre-match "Good Luck!". */
  signOff?: string
  unsubscribeUrl: string
}

export function EmailFooter({
  optOut,
  signOff = 'Good Luck!',
  unsubscribeUrl,
}: EmailFooterProps) {
  return (
    <div className="px-6 pb-8">
      <div className="mb-5 h-px bg-ink-100" />
      <p className="text-sm text-ink-700">{optOut}</p>
      <p className="mt-5 text-sm text-ink-700">
        {signOff}
        <br />
        <span className="font-semibold">Badminfo</span> Team
      </p>
      <p className="mt-5 text-xs text-ink-400">
        To unsubscribe from all notifications,{' '}
        <EmailLink href={unsubscribeUrl} className="text-ink-400 decoration-ink-300">
          click here
        </EmailLink>
        .
      </p>
    </div>
  )
}

/** Envelope that frames a single email like a message in an inbox. */
export function EmailFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[600px] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
      {children}
    </div>
  )
}
