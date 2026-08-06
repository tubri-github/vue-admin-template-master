/**
 * Duplicate-taxon merge.
 *
 * Two TaxonomicTable rows spelling the SAME name, each carrying its own specimens. Merging
 * moves the loser's current determinations onto the winner. Backend: /api/taxon-merge.
 *
 * Nothing is deleted: the losing taxon row is tagged merged_into_taxon_id and kept, and the
 * moved determinations copy the original determiner/date forward -- a merge is bookkeeping,
 * not a re-identification. Every merge is undoable, but undos must run newest-first.
 */
import request from '@/utils/request'

const prefix = '/taxon-merge'

// Unresolved duplicate groups, each member's specimen count and a recommended winner.
export function getDuplicateGroups() {
  return request({
    url: prefix + '/duplicates',
    method: 'get'
  })
}

// What a merge would move. Changes nothing.
export function previewMerge(winnerTaxonId, loserTaxonId) {
  return request({
    url: prefix + '/preview',
    method: 'get',
    params: { winner_taxon_id: winnerTaxonId, loser_taxon_id: loserTaxonId }
  })
}

export function mergeTaxa(data) {
  return request({
    url: prefix + '/merge',
    method: 'post',
    data
  })
}

export function undoMerge(applyLogId, data) {
  return request({
    url: prefix + `/merge/${applyLogId}/undo`,
    method: 'post',
    data
  })
}

// Merge history. Merges share the recheck apply log, so filter it by operation.
export function getMergeHistory(params = {}) {
  return request({
    url: '/synonym-review/recheck/apply-log',
    method: 'get',
    params: {
      page: params.page || 1,
      page_size: params.page_size || 20,
      operation: 'taxon_merge',
      status: params.status || undefined
    }
  })
}
