// HTML label printing via print-js (the legacy approach that prints 4x2 correctly on the
// Datamax — HTML content flows to fill the label, so there's no "centered on a bigger sheet"
// blank like a fixed-size PDF page gets). Each label is one print page; a dashed border at the
// top sits on the page edge (@page margin:0) = the cut line for continuous printing.
import printJS from 'print-js'

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

// One lots label (legacy TULANE layout + big vertical catalog number down the right edge).
function lotLabelInner(row) {
  const name = esc(row.FullScientificName || row.ScientificName)
  const cat = esc(row.CatalogNumber != null ? row.CatalogNumber : (row.identifier || ''))
  return `<div class="lbl">
    <div class="hdr">TULANE UNIVERSITY COLLECTIONS</div>
    <div class="bd">
      <table class="t">
        <tr><td class="k">Family</td><td class="v">${familyText(row)}</td><td class="k">Cat. No.</td><td class="v">${esc(row.CatalogNumber)}</td></tr>
        <tr><td class="k">Scientific Name</td><td class="v i" colspan="3">${name}</td></tr>
        <tr><td class="k">Dr.</td><td class="v">${esc(row.Drainage)}</td><td class="k">No. of Specimens</td><td class="v">${esc(row.TotalNumber)}</td></tr>
        <tr><td class="k">State</td><td class="v">${esc(row.State)}</td><td class="k">County</td><td class="v">${esc(row.County)}</td></tr>
        <tr><td class="k">Locality</td><td class="v" colspan="3">${esc(row.LocalityString)}</td></tr>
        <tr><td class="k">Date</td><td class="v">${esc(row.VerbatimDate)}</td><td class="k">Col. No</td><td class="v">${esc(row.FieldNo)}</td></tr>
        <tr><td class="k">Col. by</td><td class="v" colspan="3">${esc(row.VerbatimCollectors)}</td></tr>
      </table>
      <div class="vn">${cat}</div>
    </div>
  </div>`
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
        <tr><td class="k">Col. Date</td><td class="v">${esc(row.StartDate)}</td><td class="k">Col. No.</td><td class="v">${esc(row.FieldNo)}</td></tr>
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
  printJS({ printable: rows.map(lotLabelInner).join(''), type: 'raw-html', scanStyles: false, style: LABEL_STYLE })
}

export function printLoanLabelsHtml(rows, meta) {
  if (!rows || !rows.length) return
  const m = meta || {}
  printJS({ printable: rows.map(r => loanLabelInner(r, m)).join(''), type: 'raw-html', scanStyles: false, style: LABEL_STYLE })
}
