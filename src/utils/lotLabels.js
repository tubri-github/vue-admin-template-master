// Lots specimen labels — generate a geometry-exact label PDF with pdfmake.
// Printer: Datamax-I4308 thermal label printer. Stock = 4" wide (across the print head /
// printer mouth) x 2" feed length. Content prints landscape with NO rotation (4" head fits 4" content).
// Key: PDF page size = one physical label, so the print path never has to scale; the only
// "margin" that matters on a thermal printer is an X/Y registration offset you calibrate once.
// The printer feeds one label at a time, so each label = one page (pageBreak).
// Silent printing (web app can't shell out to SumatraPDF): launch the app's Chrome with
// --kiosk-printing + Datamax as the default printer, and set the driver default to no-scale / 100%.
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

pdfMake.vfs = (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) || pdfFonts.vfs

const PT_PER_IN = 72 // pdfmake works in points; 1 inch = 72pt
const MM = 2.83465 // 1mm ≈ 2.83465pt (used for fine X/Y registration offsets)

// Real stock = Datamax-I4308: 4" wide (across the print head) x 2" feed length.
// Tune in "Label settings": offsetX/Y are thermal registration nudges (NOT A4-style margins).
export const DEFAULT_LABEL = {
  widthIn: 4, // across the print head (printer mouth)
  heightIn: 2, // feed length per label
  offsetXmm: 0, // registration: shift content right (calibrate once with a test print)
  offsetYmm: 0, // registration: shift content down
  padXmm: 2, // inner padding so text isn't flush against the edge
  padYmm: 1,
  fontSize: 8
}

function val(v) { return (v === null || v === undefined) ? '' : String(v) }

// Field-name cell (no border, bold, no-wrap — keeps the name on one line so a wrapped
// name can't grow the row and leave the value floating above the underline).
function lbl(t) { return { text: t, bold: true, noWrap: true, border: [false, false, false, false] } }
// Value cell (bottom border only = underline; uses a space when empty so the writable line still shows).
function fld(v, opts) {
  return Object.assign({ text: val(v) || ' ', border: [false, false, false, true] }, opts || {})
}
const SPAN = {} // placeholder cell for colSpan

// One label: a table so every value gets an underline (even when empty). Fields match the legacy TULANE label.
function labelBlocks(row) {
  const body = [
    [lbl('Family No.'), fld(row.FamilyNumber), lbl('Cat. No.'), fld(row.CatalogNumber)],
    [lbl('Sci. Name'), fld(row.FullScientificName, { colSpan: 3, italics: true }), SPAN, SPAN],
    [lbl('Drainage'), fld(row.Drainage), lbl('No. Spec.'), fld(row.TotalNumber)],
    [lbl('State'), fld(row.State), lbl('County'), fld(row.County)],
    [lbl('Locality'), fld(row.LocalityString, { colSpan: 3 }), SPAN, SPAN],
    [lbl('Date'), fld(row.VerbatimDate), lbl('Col. No'), fld(row.FieldNo)],
    [lbl('Col. by'), fld('', { colSpan: 3 }), SPAN, SPAN]
  ]
  return [{
    table: { widths: ['auto', '*', 'auto', '*'], body },
    layout: {
      defaultBorder: false,
      paddingTop: () => 0,
      paddingBottom: () => 1,
      paddingLeft: () => 0,
      paddingRight: () => 3
    }
  }]
}

export function buildLabelDoc(rows, dims) {
  const d = Object.assign({}, DEFAULT_LABEL, dims || {})
  const ox = (Number(d.offsetXmm) || 0) * MM // registration offset (shifts content right)
  const oy = (Number(d.offsetYmm) || 0) * MM // registration offset (shifts content down)
  const px = (Number(d.padXmm) || 0) * MM
  const py = (Number(d.padYmm) || 0) * MM
  const content = []
  rows.forEach((row, i) => {
    const blocks = labelBlocks(row)
    if (i > 0) blocks[0] = Object.assign({}, blocks[0], { pageBreak: 'before' })
    content.push.apply(content, blocks)
  })
  return {
    pageSize: { width: d.widthIn * PT_PER_IN, height: d.heightIn * PT_PER_IN },
    // [left, top, right, bottom]: registration offset + inner pad on left/top, pad on right/bottom.
    // Thermal printers calibrate via an X/Y origin offset, not four equal A4 margins.
    pageMargins: [ox + px, oy + py, px, py],
    defaultStyle: { fontSize: Number(d.fontSize) || 8, lineHeight: 1 },
    content
  }
}

// Print directly (opens the system print dialog)
export function printLabels(rows, dims) {
  if (!rows || !rows.length) return
  pdfMake.createPdf(buildLabelDoc(rows, dims)).print()
}

// Export as a downloadable PDF
export function downloadLabels(rows, dims) {
  if (!rows || !rows.length) return
  pdfMake.createPdf(buildLabelDoc(rows, dims)).download('lot-labels.pdf')
}
