import { useRef, useState, type DragEvent } from 'react'
import { useDataset } from '../../context/DatasetContext'

export function FileUpload() {
  const { loadFile, loadSample, isLoading, error } = useDataset()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    await loadFile(file)
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setIsDragging(false)
    void handleFiles(event.dataTransfer.files)
  }

  return (
    <section className="rounded-2xl border border-brand-200/70 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink-900">Import results</h2>
      <p className="mt-1 text-sm text-ink-700">
        Upload a match history export (.xlsx) — the sheet layout is always the same.
      </p>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
          isDragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-brand-200 bg-brand-50/40 hover:border-brand-400 hover:bg-brand-50/70'
        }`}
      >
        <p className="text-sm font-medium text-ink-900">
          {isLoading ? 'Reading file…' : 'Drag & drop your file here'}
        </p>
        <p className="mt-1 text-xs text-ink-700">.xlsx, .xls, or .csv</p>
        <button
          type="button"
          disabled={isLoading}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:opacity-60"
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
        >
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-loss-50 px-3 py-2 text-sm text-loss-700" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-4">
        <p className="text-sm text-ink-700">No file handy?</p>
        <button
          type="button"
          onClick={loadSample}
          disabled={isLoading}
          className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 shadow-sm transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:opacity-60"
        >
          Load sample data
        </button>
      </div>
    </section>
  )
}
