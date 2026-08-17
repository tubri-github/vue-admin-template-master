import request from '@/utils/request'

// The reference table of name decisions: what a curator has ruled an imported name means, so
// the next batch carrying that spelling arrives with the answer filled in. Nothing here
// CREATES entries -- those are written as a side effect of deciding a record in batch review,
// because a ruling is only worth reusing if it was actually applied to specimens.
const prefix = '/name-decision/'

export function getNameDecisions(params = {}) {
  return request({
    url: prefix + 'decisions',
    method: 'get',
    params
  })
}

export function getNameDecisionStats() {
  return request({
    url: prefix + 'decisions/stats',
    method: 'get'
  })
}

// Which records a ruling pre-filled -- read this before revoking one, to see what it touched.
export function getNameDecisionRecords(id, params = {}) {
  return request({
    url: prefix + `decisions/${id}/records`,
    method: 'get',
    params
  })
}

// Stop applying a ruling to new imports. Kept for the record; already pre-filled records are
// left alone.
export function retireNameDecision(id, payload) {
  return request({
    url: prefix + `decisions/${id}/retire`,
    method: 'post',
    data: payload
  })
}

// Point a ruling at a different taxon; the previous answer stays visible on the row.
export function reviseNameDecision(id, payload) {
  return request({
    url: prefix + `decisions/${id}/revise`,
    method: 'post',
    data: payload
  })
}
