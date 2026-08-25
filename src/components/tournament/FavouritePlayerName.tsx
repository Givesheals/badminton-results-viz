import { FavouriteStarIcon } from '../notes/FavouriteStarIcon'

type Props = {
  name: string
  showAmpersand?: boolean
  className?: string
}

/** Tournament-page favourite: yellow star beside a purple underlined name. */
export function FavouritePlayerName({ name, showAmpersand = false, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <FavouriteStarIcon variant="page" className="h-3 w-3" />
      <span className="font-semibold text-box-callout-you underline decoration-current decoration-1 underline-offset-2">
        {name}
      </span>
      {showAmpersand ? <span className="font-normal text-ink-500 no-underline"> &</span> : null}
    </span>
  )
}
