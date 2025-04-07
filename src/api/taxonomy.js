import request from '@/utils/request'
const api_prefix = '/api/'
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

export function getMonthlyCollectionTimeline() {
  return request({
    url: api_prefix + 'stats' + '/timeline',
    method: 'get'
  })
}
