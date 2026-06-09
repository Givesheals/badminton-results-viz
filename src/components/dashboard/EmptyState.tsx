export function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-court-300 bg-court-50/40 px-6 py-12 text-center">
      <p className="text-lg font-medium text-ink-900">No data loaded yet</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-700">
        Upload a match history Excel file (like your league export) or try the sample data
        to see the dashboard.
      </p>
    </section>
  )
}
