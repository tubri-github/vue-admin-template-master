/**
 * Genus-column repair report. Read-only. Backend: /api/genus-audit.
 *
 * An old import wrote genus+species+family markers into the Genus column
 * ('Notropislutrensis+[Cyprinidae_SN]![Species] lutren'). The affected rows were rebuilt from
 * FullScientificName; a small number were deliberately left alone because there the Genus
 * column is the correct one and the name is the stale one.
 */
import request from '@/utils/request'

const prefix = '/genus-audit'

export function getGenusSummary() {
  return request({
    url: prefix + '/summary',
    method: 'get'
  })
}

// Rows whose Genus was rebuilt, with the value they had before.
export function getFixedRows(params = {}) {
  return request({
    url: prefix + '/fixed',
    method: 'get',
    params: {
      page: params.page || 1,
      page_size: params.page_size || 20,
      search: params.search || undefined
    }
  })
}

// Rows where Genus and the name still disagree on purpose -- each needs a taxonomic decision.
export function getUnresolvedRows() {
  return request({
    url: prefix + '/unresolved',
    method: 'get'
  })
}

// Decisions already made by hand. Reverted ones are kept and can be shown.
export function getManualDecisions(includeReverted = false) {
  return request({
    url: prefix + '/decisions',
    method: 'get',
    params: { include_reverted: includeReverted }
  })
}

// The scientific name is right -> rebuild Genus from its first word.
export function rebuildGenus(taxonId, data) {
  return request({
    url: prefix + `/unresolved/${taxonId}/rebuild-genus`,
    method: 'post',
    data
  })
}

// The Genus column is right -> correct the scientific name. The server refuses when the
// corrected name already exists on another taxon: that is a merge, not a rename.
export function renameTaxon(taxonId, data) {
  return request({
    url: prefix + `/unresolved/${taxonId}/rename`,
    method: 'post',
    data
  })
}

// Both columns are fine (placeholder, hybrid notation) -- record it and stop listing the row.
export function keepAsIs(taxonId, data) {
  return request({
    url: prefix + `/unresolved/${taxonId}/keep-as-is`,
    method: 'post',
    data
  })
}

export function revertDecision(decisionId, data) {
  return request({
    url: prefix + `/decisions/${decisionId}/revert`,
    method: 'post',
    data
  })
}
