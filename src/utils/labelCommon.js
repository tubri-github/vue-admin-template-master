// Shared label helpers for the geometry-exact (pdfmake) lots/loan labels.
// One PDF page = one physical 4x2" label, so the print path never scales.
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

pdfMake.vfs = (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) || pdfFonts.vfs

// Cut lines as a page BACKGROUND so they sit at the physical paper edge, not inside the
// content margins. Background canvas coords are absolute page coords (0,0 = paper top-left),
// and the function runs for every page — and every label is one page. A plain dashed rule
// (no scissor glyph) spans the full width at the very top and bottom edges.
export function cutLinesBackground(currentPage, pageSize) {
  const w = pageSize.width
  const h = pageSize.height
  const y0 = 0.5 // half the lineWidth so the full stroke stays on the page
  return {
    canvas: [
      { type: 'line', x1: 0, y1: y0, x2: w, y2: y0, lineWidth: 0.7, dash: { length: 3, space: 2 }, lineColor: '#000' },
      { type: 'line', x1: 0, y1: h - y0, x2: w, y2: h - y0, lineWidth: 0.7, dash: { length: 3, space: 2 }, lineColor: '#000' }
    ]
  }
}

// Print via pdfmake's native .print() — opens the PDF in a new tab and lets Chrome's PDF
// viewer auto-print it. The viewer honours the PDF page size (4x2"), whereas a hidden 0x0
// iframe makes Chrome center the small page on the dialog paper (the "4x4, blank top/bottom"
// symptom). Triggered from a user click, so the popup isn't blocked.
export function printPdf(docDef) {
  pdfMake.createPdf(docDef).print()
}

export function downloadPdf(docDef, filename) {
  pdfMake.createPdf(docDef).download(filename || 'labels.pdf')
}
