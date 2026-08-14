/**
 * Family-classification rulings.
 *
 * One museum-wide decision per (local family -> reference family) disagreement, instead of
 * the curator re-confirming the same taxonomic opinion on every batch record. Backend:
 * /api/family-policy.
 *
 * keep_local      suppresses the warning for that pair (the museum keeps its family)
 * adopt_reference records the intent to move; does NOT suppress, because actually moving a
 *                 family is a separate bulk edit that rewrites TaxonomicTable.FamilyID
 *
 * The reassign* calls are the third answer -- "neither family is right" -- and unlike the two
 * rulings above they DO change data: they rewrite TaxonomicTable.FamilyID for the taxa the
 * curator selected. Determination is untouched, every taxon's previous family is recorded, and
 * the whole move is undoable.
 */
import request from '@/utils/request'

const prefix = '/family-policy'

// Pairs still in disagreement: one row per DECISION, with taxa/specimen counts.
export function getDisagreements(includeCovered = false) {
  return request({
    url: prefix + '/disagreements',
    method: 'get',
    params: { include_covered: includeCovered }
  })
}

// The actual taxa behind one disagreement row. Without these the curator is being asked to
// rule on two family names in the abstract.
export function getDisagreementTaxa(localFamily, referenceFamily) {
  return request({
    url: prefix + '/disagreements/taxa',
    method: 'get',
    params: { local_family: localFamily, reference_family: referenceFamily }
  })
}

// Rulings already recorded. Revoked ones are kept and can be shown.
export function getRulings(includeRevoked = false) {
  return request({
    url: prefix,
    method: 'get',
    params: { include_revoked: includeRevoked }
  })
}

export function addRuling(data) {
  return request({
    url: prefix,
    method: 'post',
    data
  })
}

// Soft revoke: the row stays (who exempted what, and when, is part of the record) and the
// pair starts warning again.
export function revokeRuling(rulingId, data) {
  return request({
    url: prefix + `/${rulingId}/revoke`,
    method: 'post',
    data
  })
}

// ---------------------------------------------------------------------------------------
// Reassignment -- the "neither is right" answer. Changes data.
// ---------------------------------------------------------------------------------------

// Dry run. Returns what would move, what is already in the target family, and -- the part
// worth showing the curator -- which NEW disagreements the move would create, because moving
// to a family CoF still argues with relocates the warning instead of ending it.
export function previewReassign(data) {
  return request({
    url: prefix + '/reassign/preview',
    method: 'post',
    data
  })
}

// { taxon_ids, target_family_id | target_family_name, source_local_family,
//   source_reference_family, note, performed_by }
export function reassignFamily(data) {
  return request({
    url: prefix + '/reassign',
    method: 'post',
    data
  })
}

export function getReassignHistory(limit = 50) {
  return request({
    url: prefix + '/reassign/history',
    method: 'get',
    params: { limit }
  })
}

// Per-taxon before/after of one move, straight from the audit table.
export function getReassignTaxa(opId) {
  return request({
    url: prefix + `/reassign/${opId}/taxa`,
    method: 'get'
  })
}

// Refused by the server if any of the taxa moved again since -- restoring would silently
// overwrite the later decision.
export function undoReassign(opId, data) {
  return request({
    url: prefix + `/reassign/${opId}/undo`,
    method: 'post',
    data
  })
}
