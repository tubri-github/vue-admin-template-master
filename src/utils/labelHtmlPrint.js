// HTML label printing via print-js (the legacy approach that prints 4x2 correctly on the
// Datamax — HTML content flows to fill the label, so there's no "centered on a bigger sheet"
// blank like a fixed-size PDF page gets).
//  - LOTS: fixed-geometry template (every label is exactly LOT_PITCH_IN tall, every field sits in
//    a fixed slot). Long text never moves other fields: it is shrunk (never cut) to fit its own
//    slot — see fitLotLabels(). Prints at 100% scale.
//  - LOAN: still the older content-height flow layout (LABEL_STYLE) — not migrated yet.
import printJS from 'print-js'
import { Message } from 'element-ui'
import { labelDate } from '@/utils/labelDate'

function esc(v) {
  return (v === null || v === undefined ? '' : String(v))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Family field shows the NAME (the number alone isn't obvious), with the number in parens when
// present — matches the search list + loan label "FamilyName" display. Returns escaped HTML.
function familyText(row) {
  const name = esc(row.FamilyName)
  const num = esc(row.FamilyNumber)
  if (name && num) return name + ' (' + num + ')'
  return name || num
}

// Shared print CSS. Like the LEGACY version: NO @page size and NO page-break — each label is just
// a content-height block that FLOWS continuously down the strip with a gap between labels. Forcing
// fixed 2in pages (@page size + page-break) drifted against the continuous feed so the blank grew
// every label, AND it locked the print dialog's orientation (couldn't pick Landscape). Flowing
// continuously matches what the printer expects and keeps orientation user-selectable. The dashed
// border top+bottom of each block = cut lines bracketing the content.
const LABEL_STYLE = `
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .lbl {
    box-sizing: border-box; width: 4in;
    padding: 0.09in 0.16in;
    margin: 0 0 0.4in 0;
    border-top: 1.5px dashed #000;
    font-family: Arial, Helvetica, sans-serif; color: #000;
    /* keep each label whole — never split the header/Loan No off onto a separate page */
    break-inside: avoid; page-break-inside: avoid;
  }
  /* the loan NOTES page has little content; pad it to roughly a normal label's height so the
     blocks are evenly spaced on the strip (instead of forcing fixed rows). */
  .lbl.notes { min-height: 1.6in; }
  .hdr { text-align: center; font-weight: bold; font-size: 13px; margin-bottom: 2px; }
  .bd { display: flex; align-items: stretch; }
  /* flex-basis:0 + min-width:0 so the table always fills the row (short content) and wraps
     rather than pushing the number column (long content) — keeps the number's X position fixed. */
  .t { flex: 1 1 0; min-width: 0; width: 100%; border-collapse: collapse; font-size: 12px; }
  .t td { padding: 1px 5px; vertical-align: bottom; line-height: 1.15; }
  /* No nowrap + width:1% → the label column shrinks to the longest WORD, so the two long
     labels ("Scientific Name", "No. of Specimens") wrap to two lines and the column stays
     narrow. Short labels (Dr., State, …) then sit right next to their underline — no big gap.
     vertical-align:bottom keeps each value (and its underline) on the bottom line, so a
     wrapped label making the row taller never leaves the value floating above its line. */
  .t td.k { font-weight: bold; width: 1%; }
  .t td.v { border-bottom: 1px solid #000; }
  .t td.i { font-style: italic; }
  /* fixed-size flex item: the big number never grows/shrinks with content, so it stays put. */
  .vn { flex: 0 0 auto; writing-mode: vertical-rl; text-orientation: mixed; font-size: 30px; font-weight: bold;
        text-align: center; padding-left: 4px; letter-spacing: 1px; }
  .loaned { font-size: 13px; margin-top: 10px; }
`

// ---------------------------------------------------------------------------------------------
// LOTS: fixed template.
// One label = exactly LOT_PITCH_IN tall (no margin between labels), so the strip advances the same
// distance per label no matter the content → no cumulative drift, no 75% scaling needed.
// If 5 test labels creep against the stock, tune LOT_PITCH_IN (die-cut pitch = label + gap).
// Still NO @page size / page-break (those locked orientation + drifted, see memory notes);
// @page margin:0 only stops Chrome's default margins from auto-shrinking the 4in-wide content.
const LOT_PITCH_IN = 2
const BASE_FONT_PX = 12 // value text starts here and is shrunk per field until it fits its slot
const MIN_OK_FONT_PX = 7 // below this the label is still printed in full, but flagged in a warning
const FLOOR_FONT_PX = 3 // absolute floor of the shrink search
const WRAP_IF_BELOW_PX = 9 // single-line slot that would shrink below this may wrap to 2 lines instead

// Row heights (px @96dpi) — they add up to the body height, so every field's position is fixed.
const LOT_STYLE = `
  @page { margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  .ll {
    position: relative; width: 4in; height: ${LOT_PITCH_IN}in; overflow: hidden;
    padding: 0.06in 0.12in 0.05in; margin: 0;
    border-top: 1.5px dashed #000;
    font-family: Arial, Helvetica, sans-serif; color: #000;
    display: flex; flex-direction: column;
    break-inside: avoid; page-break-inside: avoid;
  }
  .ll .hd { flex: 0 0 16px; text-align: center; font-weight: bold; font-size: 13px; line-height: 16px; white-space: nowrap; }
  /* type-specimen badge: circled letter(s) in the top-left corner; absolute so the title never moves */
  .ll .tb { position: absolute; left: 0.12in; top: 0.05in; width: 18px; height: 18px; border: 1.5px solid #000;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 11px; line-height: 1; letter-spacing: -0.5px; }
  .ll .bd { flex: 1 1 0; min-height: 0; display: flex; }
  .ll .rows { flex: 1 1 0; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
  /* min-height:0 is essential: a flex row's default min-height:auto lets long text grow the row
     (pushing every row below it down) instead of overflowing → then shrinkToFit can detect it. */
  .ll .r { display: flex; align-items: flex-end; min-width: 0; min-height: 0; overflow: hidden; }
  .ll .r1 { flex: 0 0 19px; } .ll .r2 { flex: 0 0 23px; } .ll .r3 { flex: 0 0 40px; }
  .ll .r4 { flex: 0 0 24px; }
  .ll .k { flex: 0 0 auto; font-weight: bold; font-size: 11px; line-height: 1.15; white-space: nowrap;
           padding: 0 3px 2px 0; }
  .ll .k.l { width: 50px; }
  .ll .k.rk { padding-left: 6px; }
  .ll .v { display: flex; align-items: flex-end; min-width: 0; align-self: stretch;
           border-bottom: 1px solid #000; padding: 0 3px 1px; overflow: hidden;
           font-size: ${BASE_FONT_PX}px; line-height: 1.12; }
  .ll .v.grow { flex: 1 1 0; }
  .ll .v .tx { display: block; max-width: none; overflow-wrap: normal; word-break: normal; }
  .ll .v.one .tx { white-space: nowrap; }
  .ll .v.i { font-style: italic; }
  .ll .vn { flex: 0 0 0.42in; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .ll .vn .tx { writing-mode: vertical-rl; text-orientation: mixed; font-weight: bold; font-size: 30px;
                letter-spacing: 1px; line-height: 1; white-space: nowrap; }
`

// TypeStatus is free text (Paratypes / PARATYPE / Holotype / "MS Paratypes" / "Paratypes(36)" / junk
// like "2 jars"). Display-only mapping to a circled abbreviation; anything unrecognised → no badge.
// Order matters: the compound words (paratopotype, paralectotype) must be checked first.
const TYPE_BADGES = [
  [/paratopotyp/i, 'PT'], [/paralectotyp/i, 'PL'], [/holotyp/i, 'H'], [/paratyp/i, 'P'],
  [/allotyp/i, 'A'], [/neotyp/i, 'N'], [/lectotyp/i, 'L'], [/syntyp/i, 'S'], [/topo/i, 'T']
]
function typeBadge(ts) {
  if (!ts) return ''
  const hit = TYPE_BADGES.find(([re]) => re.test(String(ts)))
  return hit ? hit[1] : ''
}

// value cell: `one` = single line (nowrap), otherwise wraps inside its fixed-height slot
function cell(text, cls, style) {
  return `<div class="v ${cls}"${style ? ` style="${style}"` : ''}><span class="tx">${text}</span></div>`
}

// One lots label (TULANE layout + big vertical catalog number down the right edge).
function lotLabelInner(row) {
  const name = esc(row.FullScientificName || row.ScientificName)
  const cat = esc(row.CatalogNumber != null ? row.CatalogNumber : (row.identifier || ''))
  const badge = typeBadge(row.TypeStatus)
  return `<div class="ll" data-cat="${cat}">
    ${badge ? `<div class="tb" title="${esc(row.TypeStatus)}"><span class="tx">${badge}</span></div>` : ''}
    <div class="hd">TULANE UNIVERSITY COLLECTIONS</div>
    <div class="bd">
      <div class="rows">
        <div class="r r1"><span class="k l">Family</span>${cell(familyText(row), 'one grow')}<span class="k rk">Cat. No.</span>${cell(esc(row.CatalogNumber), 'one', 'flex:0 0 62px')}</div>
        <div class="r r2"><span class="k">Scientific Name</span>${cell(name, 'grow i')}</div>
        <div class="r r1"><span class="k l">Dr.</span>${cell(esc(row.Drainage), 'one grow')}<span class="k rk">No. of Specimens</span>${cell(esc(row.TotalNumber), 'one', 'flex:0 0 34px')}</div>
        <div class="r r1"><span class="k l">State</span>${cell(esc(row.State), 'one', 'flex:0 0 112px')}<span class="k rk">County</span>${cell(esc(row.County), 'one grow')}</div>
        <div class="r r3"><span class="k l">Locality</span>${cell(esc(row.LocalityString), 'grow')}</div>
        <div class="r r1"><span class="k l">Date</span>${cell(esc(labelDate(row.VerbatimDate)), 'one', 'flex:0 0 112px')}<span class="k rk">Col. No</span>${cell(esc(row.FieldNo), 'one grow')}</div>
        <div class="r r4"><span class="k l">Col. by</span>${cell(esc(row.VerbatimCollectors), 'grow')}</div>
      </div>
      <div class="vn"><span class="tx">${cat}</span></div>
    </div>
  </div>`
}

// Shrink each slot's text (binary search on font-size) until it fits its box — never truncated.
// Runs in a hidden iframe holding ONLY LOT_STYLE, i.e. the same environment print-js prints in
// (scanStyles:false), so what fits here fits on paper. Returns the HTML with the sizes inlined.
function fitsIn(box, tx, padX) {
  return tx.scrollWidth <= box.clientWidth - padX + 0.5 && tx.offsetHeight <= box.clientHeight + 0.5
}
function shrinkToFit(box, tx, base, padX) {
  if (fitsIn(box, tx, padX)) return base
  let lo = FLOOR_FONT_PX; let hi = base
  while (hi - lo > 0.25) {
    const mid = (lo + hi) / 2
    tx.style.fontSize = mid + 'px'
    if (fitsIn(box, tx, padX)) lo = mid; else hi = mid
  }
  tx.style.fontSize = lo + 'px'
  return lo
}
function fitLotLabels(html) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:5in;height:3in;visibility:hidden;border:0'
  document.body.appendChild(iframe)
  try {
    const doc = iframe.contentDocument
    doc.open()
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>${LOT_STYLE}</style></head><body>${html}</body></html>`)
    doc.close()
    const small = []
    doc.querySelectorAll('.ll').forEach(lbl => {
      let minFs = BASE_FONT_PX
      lbl.querySelectorAll('.v').forEach(box => {
        const tx = box.firstElementChild
        if (!tx || !tx.textContent) return
        let fs = shrinkToFit(box, tx, BASE_FONT_PX, 6)
        // a very long single-line value (e.g. "E FELICIANA & ST HELENA PARISHES" as County) reads
        // better as 2 lines in the same slot than 1 tiny line — keep whichever gives the bigger font
        if (fs < WRAP_IF_BELOW_PX && box.classList.contains('one')) {
          box.classList.remove('one'); tx.style.fontSize = ''
          const fs2 = shrinkToFit(box, tx, BASE_FONT_PX, 6)
          if (fs2 > fs) fs = fs2
          else { box.classList.add('one'); tx.style.fontSize = fs + 'px' }
        }
        minFs = Math.min(minFs, fs)
      })
      const vn = lbl.querySelector('.vn')
      if (vn && vn.firstElementChild) shrinkToFit(vn, vn.firstElementChild, 30, 0)
      const tb = lbl.querySelector('.tb')
      if (tb && tb.firstElementChild) shrinkToFit(tb, tb.firstElementChild, 11, 3)
      if (minFs < MIN_OK_FONT_PX) small.push(lbl.getAttribute('data-cat'))
    })
    return { html: doc.body.innerHTML, small }
  } finally {
    document.body.removeChild(iframe)
  }
}

// One loan specimen = a label page + a NOTES page (legacy loan format).
function loanLabelInner(row, meta) {
  const name = esc(row.FullScientificName)
  const spec = esc(row.Quantity) + ' of ' + esc(row.TotalNumber)
  const labelPage = `<div class="lbl">
    <div class="hdr">TULANE UNIVERSITY COLLECTIONS</div>
    <div class="hdr" style="font-weight:normal;font-size:11px">Loan No.: ${esc(meta.loanNumber)}</div>
    <div class="bd">
      <table class="t">
        <tr><td class="k">Family Name</td><td class="v">${esc(row.FamilyName)}</td><td class="k">Cat. No</td><td class="v">${esc(row.CatalogNumber)}</td></tr>
        <tr><td class="k">Species</td><td class="v i" colspan="3">${name}</td></tr>
        <tr><td class="k">Dr.</td><td class="v">${esc(row.Drainage)}</td><td class="k">No. Spec.</td><td class="v">${spec}</td></tr>
        <tr><td class="k">State</td><td class="v">${esc(row.LocalityState)}</td><td class="k">County</td><td class="v">${esc(row.LocalityCounty)}</td></tr>
        <tr><td class="k">Locality</td><td class="v" colspan="3">${esc(row.LocalityString)}</td></tr>
        <tr><td class="k">Col. Date</td><td class="v">${esc(row.StartDate || labelDate(row.VerbatimDate))}</td><td class="k">Col. No.</td><td class="v">${esc(row.FieldNo)}</td></tr>
        <tr><td class="k">Col. by</td><td class="v" colspan="3">${esc(row.VerbatimCollectors)}</td></tr>
      </table>
    </div>
  </div>`
  const notesPage = `<div class="lbl notes">
    <div class="hdr">NOTES</div>
    <div class="hdr" style="font-weight:normal;font-size:11px">Loan No.: ${esc(meta.loanNumber)}</div>
    <div class="bd">
      <table class="t">
        <tr><td class="k">Family Name</td><td class="v">${esc(row.FamilyName)}</td><td class="k">Cat. No</td><td class="v">${esc(row.CatalogNumber)}</td></tr>
        <tr><td class="k">Species</td><td class="v i" colspan="3">${name}</td></tr>
      </table>
    </div>
    <div class="loaned">${spec} loaned to ${esc(meta.loanPeopleFullName)}</div>
  </div>`
  return labelPage + notesPage
}

export function printLotLabelsHtml(rows) {
  if (!rows || !rows.length) return
  const { html, small } = fitLotLabels(rows.map(lotLabelInner).join(''))
  if (small.length) {
    // still printed in full — just tiny; tell the user which ones to eyeball
    const list = small.slice(0, 10).join(', ') + (small.length > 10 ? ` … (+${small.length - 10})` : '')
    console.warn('[labels] text shrunk below ' + MIN_OK_FONT_PX + 'px on catalog numbers:', small)
    Message({ type: 'warning', duration: 8000, showClose: true,
      message: `${small.length} label(s) have very long text printed in a small font: ${list}` })
  }
  printJS({ printable: html, type: 'raw-html', scanStyles: false, style: LOT_STYLE })
}

export function printLoanLabelsHtml(rows, meta) {
  if (!rows || !rows.length) return
  const m = meta || {}
  printJS({ printable: rows.map(r => loanLabelInner(r, m)).join(''), type: 'raw-html', scanStyles: false, style: LABEL_STYLE })
}
