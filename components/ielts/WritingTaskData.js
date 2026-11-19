// components/ielts/WritingTaskData.js
//
// Writing Task 1 (Academic) prompts carry their chart data as text, e.g.
//
//   Approximate figures (cups per day):
//     18-30:  2010 = 1.8,  2020 = 2.6
//     31-45:  2010 = 2.5,  2020 = 2.9
//
// splitTaskData() pulls that block out of the prompt so it can be drawn as a
// readable table + bar chart instead of monospace-looking text. If the prompt
// has no such block, the prompt is returned untouched and data is null.
// Server-safe (no hooks).

const ROW_RE = /^\s*([^:=]+?)\s*:\s*(.+=.+)$/
const PAIR_RE = /([^,=]+?)\s*=\s*(-?\d+(?:\.\d+)?)/g

function parseRow(line) {
  const m = line.match(ROW_RE)
  if (!m) return null
  const values = []
  for (const p of m[2].matchAll(PAIR_RE)) values.push({ series: p[1].trim(), value: Number(p[2]) })
  return values.length ? { label: m[1].trim(), values } : null
}

export function splitTaskData(prompt) {
  const text = String(prompt ?? '')
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i].trim()
    if (!head.endsWith(':') || ROW_RE.test(lines[i])) continue
    const rows = []
    let j = i + 1
    while (j < lines.length) {
      const row = parseRow(lines[j])
      if (!row) break
      rows.push(row)
      j++
    }
    if (rows.length >= 2) {
      const series = [...new Set(rows.flatMap((r) => r.values.map((v) => v.series)))]
      const unit = (head.match(/\(([^)]+)\)/) || [])[1] || ''
      const before = lines.slice(0, i).join('\n').trim()
      const after = lines.slice(j).join('\n').trim()
      return {
        promptText: [before, after].filter(Boolean).join('\n\n'),
        data: { title: head.replace(/:$/, '').replace(/\s*\([^)]*\)\s*/, ' ').trim() || 'Chart data', unit, series, rows },
      }
    }
  }
  return { promptText: text, data: null }
}

const SERIES_COLOURS = ['bg-teal-600', 'bg-sun-400', 'bg-blue-600', 'bg-ink-400']

export function TaskDataView({ data }) {
  if (!data) return null
  const max = Math.max(...data.rows.flatMap((r) => r.values.map((v) => v.value)), 0) || 1
  const valueOf = (row, s) => row.values.find((v) => v.series === s)?.value

  return (
    <figure className="rounded-2xl border border-ink-100 bg-paper p-4 sm:p-5">
      <figcaption className="text-xs font-semibold uppercase tracking-wider text-ink-500">{data.title}</figcaption>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-hidden="true">
        {data.series.map((s, i) => (
          <span key={s} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-600">
            <span className={`h-2.5 w-2.5 rounded-sm ${SERIES_COLOURS[i % SERIES_COLOURS.length]}`} /> {s}
          </span>
        ))}
      </div>

      {/* Bar chart (visual) */}
      <div className="mt-3 space-y-3" aria-hidden="true">
        {data.rows.map((row) => (
          <div key={row.label}>
            <p className="text-sm font-semibold text-ink-800">{row.label}</p>
            <div className="mt-1 space-y-1">
              {data.series.map((s, i) => {
                const v = valueOf(row, s)
                if (v == null) return null
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-white">
                      <div className={`h-full rounded-full ${SERIES_COLOURS[i % SERIES_COLOURS.length]}`} style={{ width: `${(v / max) * 100}%` }} />
                    </div>
                    <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-ink-700">{v}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Table: the screen-reader version of the chart (the bars show the same numbers) */}
      <div className="sr-only">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{data.title}</caption>
          <thead>
            <tr className="border-b border-ink-100 text-xs uppercase tracking-wider text-ink-400">
              <th scope="col" className="px-3 py-2 font-semibold">Group</th>
              {data.series.map((s) => <th key={s} scope="col" className="px-3 py-2 text-right font-semibold">{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.label} className="border-b border-ink-50 last:border-0">
                <th scope="row" className="px-3 py-2 font-medium text-ink-800">{row.label}</th>
                {data.series.map((s) => (
                  <td key={s} className="px-3 py-2 text-right tabular-nums text-ink-700">{valueOf(row, s) ?? '–'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.unit ? <p className="mt-3 text-xs text-ink-400">All figures are {data.unit}.</p> : null}
    </figure>
  )
}
