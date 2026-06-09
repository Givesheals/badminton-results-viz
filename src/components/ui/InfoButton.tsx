import { forwardRef, type ButtonHTMLAttributes } from 'react'

export type InfoButtonSize = 'md' | 'sm'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: InfoButtonSize
  expanded: boolean
  controlsId: string
}

const SIZE_CLASS: Record<InfoButtonSize, string> = {
  md: 'h-5 w-5',
  sm: 'h-4 w-4',
}

export const InfoButton = forwardRef<HTMLButtonElement, Props>(function InfoButton(
  { size = 'md', expanded, controlsId, className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={expanded}
      aria-controls={controlsId}
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-brand-600 transition hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${SIZE_CLASS[size]} ${className}`.trim()}
      {...props}
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-full w-full"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
})
