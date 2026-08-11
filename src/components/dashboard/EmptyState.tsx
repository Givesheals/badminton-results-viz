type Props = {
  onOpenAddNewData: () => void
  error?: string | null
}

export function EmptyState({ onOpenAddNewData, error }: Props) {
  return (
    <section className="rounded-2xl border border-dashed border-court-300 bg-court-50/40 px-6 py-12 text-center">
      <p className="text-lg font-medium text-ink-900">No data loaded yet</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-700">
        Import a match history Excel file to see the dashboard, or try the sample data.
      </p>
      {error && (
        <p className="mx-auto mt-3 max-w-md rounded-lg bg-loss-50 px-3 py-2 text-sm text-loss-700" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onOpenAddNewData}
        className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
      >
        Add new data
      </button>
    </section>
  )
}
