type Props = {
  className?: string
  /** Bright tournament-page yellow; default is the deeper gold used in pickers. */
  variant?: 'default' | 'page'
}

export function FavouriteStarIcon({ className = 'h-3 w-3', variant = 'default' }: Props) {
  const colorClass = variant === 'page' ? 'text-favourite-star-page' : 'text-favourite-star'

  return (
    <svg
      className={`shrink-0 ${colorClass} ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        stroke={variant === 'page' ? 'none' : 'var(--color-favourite-star-stroke)'}
        strokeWidth={variant === 'page' ? undefined : '0.75'}
        strokeLinejoin="round"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  )
}
