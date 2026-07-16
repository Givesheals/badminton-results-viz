import type { NoteScopeDisplay } from '../../lib/opponentNotes'

export function PairNoteScopeBanner({
  scope,
}: {
  scope: Extract<NoteScopeDisplay, { kind: 'pair' }>
}) {
  return (
    <p className="mb-1.5 rounded-md border border-ink-100 bg-ink-50/90 px-2 py-1.5 text-xs text-ink-600">
      <span className="font-medium text-ink-800">{scope.primary}</span>
      {scope.secondary != null && scope.secondary !== '' && (
        <>
          <br />
          <span>{scope.secondary}</span>
        </>
      )}
    </p>
  )
}
