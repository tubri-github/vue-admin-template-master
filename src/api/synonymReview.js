import request from '@/utils/request'

const api_prefix = '/synonym-review/'

// Scan all taxon names against TaxonRank DB
export function triggerSynonymScan() {
  return request({
    url: api_prefix + 'scan',
    method: 'post'
  })
}

// Get paginated review list with filters
export function getReviewList(params = {}) {
  return request({
    url: api_prefix + 'reviews',
    method: 'get',
    params: {
      page: params.page || 1,
      page_size: params.page_size || 20,
      status: params.status || undefined,
      issue: params.issue || undefined,
      search: params.search || undefined,
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'desc'
    }
  })
}

// Get single review detail
export function getReviewDetail(reviewId) {
  return request({
    url: api_prefix + `reviews/${reviewId}`,
    method: 'get'
  })
}

// Accept a synonym suggestion
export function acceptReview(reviewId, data) {
  return request({
    url: api_prefix + `reviews/${reviewId}/accept`,
    method: 'post',
    data
  })
}

// Reject a synonym suggestion
export function rejectReview(reviewId, data) {
  return request({
    url: api_prefix + `reviews/${reviewId}/reject`,
    method: 'post',
    data
  })
}

// Skip a review
export function skipReview(reviewId, data) {
  return request({
    url: api_prefix + `reviews/${reviewId}/skip`,
    method: 'post',
    data
  })
}

// Batch accept
export function batchAcceptReviews(data) {
  return request({
    url: api_prefix + 'reviews/batch-accept',
    method: 'post',
    data
  })
}

// Batch reject
export function batchRejectReviews(data) {
  return request({
    url: api_prefix + 'reviews/batch-reject',
    method: 'post',
    data
  })
}

// Correct a review with reviewer-provided name
export function correctReview(reviewId, data) {
  return request({
    url: api_prefix + `reviews/${reviewId}/correct`,
    method: 'post',
    data
  })
}

// Reset a review back to pending
export function resetReview(reviewId, data) {
  return request({
    url: api_prefix + `reviews/${reviewId}/reset`,
    method: 'post',
    data
  })
}

// Search the reference DB (taxonomic_dev) for taxa
export function searchReferenceTaxa(keyword) {
  return request({
    url: api_prefix + 'taxon-search',
    method: 'get',
    params: { keyword, limit: 15 }
  })
}

// Get review statistics
export function getReviewStats() {
  return request({
    url: api_prefix + 'stats',
    method: 'get'
  })
}

// Check TaxonRank DB config status
export function getConfigStatus() {
  return request({
    url: api_prefix + 'config-status',
    method: 'get'
  })
}

// ===== Taxon recheck (whole-DB check of in-use taxa + determination write-back) =====

// Scan all in-use taxa, classify, persist actionable pending reviews
export function recheckScan() {
  return request({ url: api_prefix + 'recheck/scan', method: 'post' })
}

// Paginated recheck review list with category / appliable / family_mismatch filters
export function recheckReviews(params = {}) {
  return request({
    url: api_prefix + 'recheck/reviews',
    method: 'get',
    params: {
      page: params.page || 1,
      page_size: params.page_size || 20,
      status: params.status || 'pending',
      category: params.category || undefined,
      appliable: params.appliable === undefined ? undefined : params.appliable,
      family_mismatch: params.family_mismatch === undefined ? undefined : params.family_mismatch,
      search: params.search || undefined,
      sort_by: params.sort_by || 'in_use_count',
      sort_order: params.sort_order || 'desc'
    }
  })
}

// Category / appliable / family-mismatch counts over the pending set
export function recheckStats() {
  return request({ url: api_prefix + 'recheck/stats', method: 'get' })
}

// Dry-run: how many determinations would change and to which target
export function recheckPreview(reviewId, data = {}) {
  return request({ url: api_prefix + `recheck/reviews/${reviewId}/preview`, method: 'post', data })
}

// Confirm a correction -> determination write-back (may run in background for large ones)
export function recheckApply(reviewId, data) {
  return request({ url: api_prefix + `recheck/reviews/${reviewId}/apply`, method: 'post', data })
}

// List applies (undo history)
export function recheckApplyLog(params = {}) {
  return request({
    url: api_prefix + 'recheck/apply-log',
    method: 'get',
    params: { page: params.page || 1, page_size: params.page_size || 20, status: params.status || undefined }
  })
}

// Poll a single apply's status (running | applied | failed | undone)
export function recheckApplyLogDetail(logId) {
  return request({ url: api_prefix + `recheck/apply-log/${logId}`, method: 'get' })
}

// Undo an apply
export function recheckUndo(logId, data) {
  return request({ url: api_prefix + `recheck/apply-log/${logId}/undo`, method: 'post', data })
}

// "Looked at it, we keep our name." Records the decision without touching any data, so the
// row stops coming back on every scan. Most of a scan's output ends here, not in an apply.
export function recheckDismiss(reviewId, data) {
  return request({ url: api_prefix + `recheck/reviews/${reviewId}/dismiss`, method: 'post', data })
}

// Same for many rows at once: an explicit id list, or everything pending that matches the
// current filters. The server refuses a call with no selector at all.
export function recheckBatchDismiss(data) {
  return request({ url: api_prefix + 'recheck/reviews/batch-dismiss', method: 'post', data })
}

// Put a dismissed row back to pending.
export function recheckResetReview(reviewId, data) {
  return request({ url: api_prefix + `recheck/reviews/${reviewId}/reset`, method: 'post', data })
}
