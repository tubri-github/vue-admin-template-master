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
