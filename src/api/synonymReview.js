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