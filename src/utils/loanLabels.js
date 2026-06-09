// Loan partial labels — geometry-exact PDF with pdfmake (same 4x2" Datamax stock as lots).
// PDF page = one physical label, so the print path never scales (print at "Actual size").
// Legacy loan label is TWO pages per specimen: (1) the TULANE specimen label, (2) a NOTES page.
import { cutLinesBackground, printPdf, downloadPdf } from '@/utils/labelCommon'

const PT_PER_IN = 72
const MM = 2.83465

// Same geometry as lots labels (Datamax-I4308: 4" across head x 2" feed length).
export const DEFAULT_LABEL = {
  widthIn: 4,
  heightIn: 2,
  offsetXmm: 0,
  offsetYmm: 0,
  padXmm: 2,
  padYmm: 1,
  fontSize: 8
}

function val(v) { return (v === null || v === undefined) ? '' : String(v) }
function lbl(t) { return { text: t, bold: true, noWrap: true, border: [false, false, false, false] } }
function fld(v, opts) {
  return Object.assign({ text: val(v) || ' ', border: [false, false, false, true] }, opts || {})
}
const SPAN = {}

function tbl(body) {
  return {
    table: { widths: ['auto', '*', 'auto', '*'], body },
    layout: {
      defaultBorder: false,
      paddingTop: () => 0,
      paddingBottom: () => 1,
      paddingLeft: () => 0,
      paddingRight: () => 3
    }
  }
}

// Page 1 — the specimen label (legacy TULANE loan label fields).
function labelPage(row, meta) {
  return [
    { text: 'TULANE UNIVERSITY COLLECTIONS', bold: true, fontSize: 9, alignment: 'center' },
    { text: 'Loan No.: ' + val(meta.loanNumber), fontSize: 8, alignment: 'center', margin: [0, 0, 0, 2] },
    tbl([
      [lbl('Family Name'), fld(row.FamilyName), lbl('Cat. No'), fld(row.CatalogNumber)],
      [lbl('Species'), fld(row.FullScientificName, { colSpan: 3, italics: true }), SPAN, SPAN],
      [lbl('Dr.'), fld(row.Drainage), lbl('No. Spec.'), fld(val(row.Quantity) + ' of ' + val(row.TotalNumber))],
      [lbl('State'), fld(row.LocalityState), lbl('County'), fld(row.LocalityCounty)],
      [lbl('Locality'), fld(row.LocalityString, { colSpan: 3 }), SPAN, SPAN],
      [lbl('Col. Date'), fld(row.StartDate), lbl('Col. No.'), fld(row.FieldNo)],
      [lbl('Col. by'), fld(row.VerbatimCollectors, { colSpan: 3 }), SPAN, SPAN]
    ])
  ]
}

// Page 2 — NOTES page (legacy: header + short table + "N of M loaned to ...").
function notesPage(row, meta) {
  return [
    { text: 'NOTES', bold: true, fontSize: 9, alignment: 'center' },
    { text: 'Loan No.: ' + val(meta.loanNumber), fontSize: 8, alignment: 'center', margin: [0, 0, 0, 2] },
    tbl([
      [lbl('Family Name'), fld(row.FamilyName), lbl('Cat. No'), fld(row.CatalogNumber)],
      [lbl('Species'), fld(row.FullScientificName, { colSpan: 3, italics: true }), SPAN, SPAN]
    ]),
    {
      text: val(row.Quantity) + ' of ' + val(row.TotalNumber) + ' loaned to ' + val(meta.loanPeopleFullName),
      fontSize: 8,
      margin: [0, 8, 0, 0]
    }
  ]
}

export function buildLoanLabelDoc(rows, meta, dims) {
  const d = Object.assign({}, DEFAULT_LABEL, dims || {})
  const ox = (Number(d.offsetXmm) || 0) * MM
  const oy = (Number(d.offsetYmm) || 0) * MM
  const px = (Number(d.padXmm) || 0) * MM
  const py = (Number(d.padYmm) || 0) * MM
  const m = meta || {}
  const pageW = d.widthIn * PT_PER_IN
  const content = []
  rows.forEach((row, i) => {
    // Each specimen = label page + NOTES page; every page is its own physical label.
    const pages = [labelPage(row, m), notesPage(row, m)]
    pages.forEach((blocks, j) => {
      if (i > 0 || j > 0) blocks[0] = Object.assign({}, blocks[0], { pageBreak: 'before' })
      content.push.apply(content, blocks)
    })
  })
  return {
    pageSize: { width: pageW, height: d.heightIn * PT_PER_IN },
    pageMargins: [ox + px, oy + py, px, py],
    background: cutLinesBackground, // dashed cut lines at the physical paper edges
    defaultStyle: { fontSize: Number(d.fontSize) || 8, lineHeight: 1 },
    content
  }
}

export function printLoanLabels(rows, meta, dims) {
  if (!rows || !rows.length) return
  printPdf(buildLoanLabelDoc(rows, meta, dims))
}

export function downloadLoanLabels(rows, meta, dims) {
  if (!rows || !rows.length) return
  downloadPdf(buildLoanLabelDoc(rows, meta, dims), 'loan-labels.pdf')
}
