import type { ShareCaptureStatus } from '../../hooks/useShareCapture'
import type { InfoButtonSize } from './InfoButton'

type Props = {
  onClick: () => void
  disabled?: boolean
  status?: ShareCaptureStatus
  size?: InfoButtonSize
  className?: string
}

const SIZE_CLASS: Record<InfoButtonSize, string> = {
  md: 'h-5 w-5',
  sm: 'h-4 w-4',
}

function statusLabel(status: ShareCaptureStatus): string | null {
  switch (status) {
    case 'preparing':
      return 'Saving…'
    case 'shared':
      return 'Shared!'
    case 'downloaded':
      return 'Saved!'
    case 'error':
      return 'Failed'
    default:
      return null
  }
}

export function ShareButton({
  onClick,
  disabled = false,
  status = 'idle',
  size = 'md',
  className = '',
}: Props) {
  const feedback = statusLabel(status)
  const busy = status === 'preparing'

  return (
    <span className="inline-flex items-center gap-1" data-share-exclude>
      {feedback ? (
        <span className="text-[10px] font-medium text-brand-700" aria-live="polite">
          {feedback}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || busy}
        aria-label="Share"
        title="Share"
        className={`inline-flex shrink-0 items-center justify-center rounded-full text-brand-600 transition hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-50 ${SIZE_CLASS[size]} ${className}`.trim()}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-full w-full"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z"
          />
        </svg>
      </button>
    </span>
  )
}
