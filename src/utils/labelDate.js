// Display-only formatting of locality1.VerbatimDate on lots labels.
// VerbatimDate stores the source text as-is (DB is never changed). Some sources put a
// machine date-time there ("2023-05-02 10:30:01.045" from the upload file, or the locality
// page's picker "2024-04-06T05:00:00.000Z") — the time wraps the Date cell onto two lines.
// Only that machine pattern is cut to YYYY-MM-DD; "VI-1987", "summer 1987", "6/13/1987" print untouched.
const MACHINE_DT = /^(\d{4}-\d{2}-\d{2})[ T]\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/

function pad(n) { return (n < 10 ? '0' : '') + n }

export function labelDate(v) {
  if (v === null || v === undefined) return ''
  const s = String(v).trim()
  const m = MACHINE_DT.exec(s)
  if (!m) return s
  if (m[4]) {
    // Has a timezone (picker values are local midnight serialized as UTC): convert to the
    // browser's local day first, otherwise "…T05:00:00.000Z" style values can land a day off.
    const d = new Date(s.replace(' ', 'T'))
    if (!isNaN(d.getTime())) return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
  }
  return m[1]
}
