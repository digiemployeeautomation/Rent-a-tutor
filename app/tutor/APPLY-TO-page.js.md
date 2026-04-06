// PATCH: app/tutor/page.js — add mobile filter toggle
//
// The find-a-tutor page was missing the collapsible filter pattern
// used by both browse pages. The subject sidebar was always visible,
// pushing the tutor grid off-screen on small phones.
//
// Add `filtersOpen` state and toggle button (same pattern as browse pages).
// Only the state declaration and aside JSX need to change.
//
// ── 1. Add state (near the top of FindTutorPage) ──────────────
//
//   const [filtersOpen, setFiltersOpen] = useState(false)
//
// ── 2. Replace the <aside> block with this ────────────────────

<aside className="lg:w-52 flex-shrink-0">
  {/* Mobile filter toggle */}
  <button
    onClick={() => setFiltersOpen(o => !o)}
    className="lg:hidden w-full flex items-center justify-between px-4 py-2.5 mb-4 rounded-xl border border-gray-200 text-sm bg-white"
    style={{ color: '#374151' }}>
    <span>
      Filters
      {(subject || search) && (
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
          active
        </span>
      )}
    </span>
    <span className="text-gray-400">{filtersOpen ? '▲' : '▼'}</span>
  </button>

  {/* Filter content — always visible on desktop, toggle on mobile */}
  <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
    <div className="mb-6">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Sort by</h3>
      <div className="space-y-1">
        {[
          { value: 'rating',     label: 'Top rated'       },
          { value: 'reviews',    label: 'Most reviewed'   },
          { value: 'price_asc',  label: 'Price: low–high' },
          { value: 'price_desc', label: 'Price: high–low' },
        ].map(o => (
          <button key={o.value} onClick={() => setSort(o.value)}
            className="w-full text-left text-sm px-3 py-2 rounded-lg transition"
            style={sort === o.value
              ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', fontWeight: 500 }
              : { color: '#6b7280' }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>

    <div className="mb-6">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Subject</h3>
      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        <button onClick={() => setSubject('')}
          className="w-full text-left text-sm px-3 py-2 rounded-lg transition"
          style={subject === ''
            ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', fontWeight: 500 }
            : { color: '#6b7280' }}>
          All subjects
        </button>
        {SUBJECTS.map(s => (
          <button key={s} onClick={() => setSubject(s)}
            className="w-full text-left text-sm px-3 py-2 rounded-lg transition"
            style={subject === s
              ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', fontWeight: 500 }
              : { color: '#6b7280' }}>
            {s}
          </button>
        ))}
      </div>
    </div>

    {(subject || search) && (
      <button onClick={() => { setSubject(''); setSearchInput('') }}
        className="text-xs underline"
        style={{ color: 'var(--color-primary-lit)' }}>
        Clear filters
      </button>
    )}
  </div>
</aside>
