import request from '@/utils/request'
const api_prefix = ''
export function getFamilyList() {
  return request({
    url: api_prefix + 'stats' + '/familyList',
    method: 'get'
  })
}

export function getGenusList(params) {
  return request({
    url: api_prefix + 'stats' + '/genusList',
    method: 'get',
    params
  })
}

export function getSpeciesList(params) {
  return request({
    url: api_prefix + 'stats' + '/speciesList',
    method: 'get',
    params
  })
}

// Every family this taxon has been filed under. The family is a single overwritten column, so
// this reads family_fix_audit -- written both by the automatic 2026-06-10 pass and by curator
// moves from the family-disagreement tab. Undone moves are included and flagged.
export function getTaxonFamilyHistory(taxonId) {
  return request({
    url: api_prefix + 'taxon' + `/${taxonId}/family-history`,
    method: 'get'
  })
}

export function getMonthlyCollectionTimeline() {
  return request({
    url: api_prefix + 'stats' + '/timeline',
    method: 'get'
  })
}
