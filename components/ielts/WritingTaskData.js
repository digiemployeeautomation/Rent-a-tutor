// components/ielts/WritingTaskData.js
//
// Writing Task 1 (Academic) prompts carry their chart data as text, e.g.
//
//   Approximate figures (cups per day):
//     18-30:  2010 = 1.8,  2020 = 2.6
//     31-45:  2010 = 2.5,  2020 = 2.9
//
// splitTaskData() pulls that block out of the prompt so it can be drawn as a
// flat bar chart and a ruled table instead of monospace-looking text. If the prompt
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

// Flat series colours: chalkboard green, then copper. More than two series is
// rare in Task 1; the later ones stay in the palette.
const SERIES_COLOURS = ['bg-board-600', 'bg-copper-500', 'bg-ink-700', 'bg-sun-400']

export function TaskDataView({ data }) {
  if (!data) return null
  const max = Math.max(...data.rows.flatMap((r) => r.values.map((v) => v.value)), 0) || 1
  const valueOf = (row, s) => row.values.find((v) => v.series === s)?.value
  const unit = data.unit ? data.unit.charAt(0).toUpperCase() + data.unit.slice(1) : ''

  return (
    <figure>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="h-sub">{unit || data.title}</span>
        {/* Key: which colour is which series */}
        <span className="flex flex-wrap gap-x-4 gap-y-1" aria-hidden="true">
          {data.series.map((s, i) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-700 tabular">
              <span className={`h-2.5 w-2.5 ${SERIES_COLOURS[i % SERIES_COLOURS.length]}`} /> {s}
            </span>
          ))}
        </span>
      </figcaption>

      {/* Chart: flat bars from one axis line, each labelled with its value */}
      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)]" aria-hidden="true">
        {data.rows.map((row) => (
          <div key={row.label} className="contents">
            <p className="flex max-w-[8rem] items-center pr-3 text-[15px] font-bold leading-tight text-ink-900 tabular">{row.label}</p>
            <div className="space-y-[3px] border-l border-ink-900 py-2">
              {data.series.map((s, i) => {
                const v = valueOf(row, s)
                if (v == null) return null
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span
                      className={`h-3.5 min-w-[2px] ${SERIES_COLOURS[i % SERIES_COLOURS.length]}`}
                      style={{ width: `calc((100% - 2.75rem) * ${Math.max(0, v) / max})` }}
                    />
                    <span className="text-[13px] font-bold leading-none text-ink-800 tabular">{v}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Table: the exact figures (and the screen-reader version of the chart) */}
      <table className="mt-5 w-full border-collapse text-left text-[15px]">
        <caption className="sr-only">{data.title}{data.unit ? ` (${data.unit})` : ''}</caption>
        <thead>
          <tr className="border-b-2 border-ink-900">
            <th scope="col" className="py-2 pr-3 text-[13px] font-bold text-ink-600">{data.title}</th>
            {data.series.map((s) => <th key={s} scope="col" className="py-2 pl-3 text-right text-[13px] font-bold text-ink-900 tabular">{s}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.label} className="border-b border-ink-200">
              <th scope="row" className="py-2 pr-3 font-semibold text-ink-900 tabular">{row.label}</th>
              {data.series.map((s) => (
                <td key={s} className="py-2 pl-3 text-right text-ink-800 tabular">{valueOf(row, s) ?? '–'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
