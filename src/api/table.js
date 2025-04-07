import request from '@/utils/request'

const api_prefix = '/api/'

export function addNewLoan(data) {
  return request({
    url: api_prefix + 'loan' + '/loan/',
    method: 'post',
    data
  })
}

export function addNewLoanPeople(data) {
  return request({
    url: api_prefix + 'loan' + '/loanpeople/',
    method: 'post',
    data
  })
}

export function addNewLot(data) {
  return request({
    url: api_prefix + 'lots' + '/lot/',
    method: 'post',
    data
  })
}

export function getLotString(params) {
  return request({
    url: api_prefix + 'lots' + '/lotString/' + params.catId,
    method: 'get',
    params
  })
}

export function getLoanPeople(params) {
  return request({
    url: api_prefix + 'loan' + '/loanpeople/',
    method: 'get',
    params
  })
}

export function getLoan(params) {
  return request({
    url: api_prefix + 'loan' + '/loan/' + params.loanId,
    method: 'get',
  })
}

export function updateLoan(data) {
  return request({
    url: api_prefix + 'loan' + '/uploan/',
    method: 'post',
    data
  })
}

export function generateNewLoanID(params) {
  return request({
    url: api_prefix + 'loan' + '/newloan/',
    method: 'get',
    params
  })
}

export function generateNewGiftID(params) {
  return request({
    url: api_prefix + 'loan' + '/newgift/',
    method: 'get',
    params
  })
}

export function getLoanNumbersByYear(params) {
  return request({
    url: api_prefix + 'loan' + '/loancount/' + params.year,
    method: 'get'
  })
}
export function getLotNumbersByYear(params) {
  return request({
    url: api_prefix + 'lots' + '/lotcount/' + params.year,
    method: 'get'
  })
}
export function getLocalityNumbersByYear(params) {
  return request({
    url: api_prefix + 'locality' + '/localitycount/' + params.year,
    method: 'get'
  })
}

export function getLocalityAdvanced(params) {
  return request({
    url: api_prefix + 'locality' + '/localityAdvanced/',
    method: 'get',
    params
  })
}

export function getSpeciesStats() {
  return request({
    url: api_prefix + 'stats' + '/speciesStats',
    method: 'get'
  })
}
export function getLots(params) {
  return request({
    url: api_prefix + 'lots' + '/lot/' + params.ids + '/' + params.limit,
    method: 'get'
  })
}

export function getDeterminationListByPrimaryID(params) {
  return request({
    url: api_prefix + 'lots' + '/determinations/' + params.primaryID,
    method: 'get'
  })
}

export function getPreparationListByPrimaryID(params) {
  return request({
    url: api_prefix + 'lots' + '/preparations/' + params.primaryID,
    method: 'get'
  })
}

export function updateLot(data) {
  return request({
    url: api_prefix + 'lots' + '/updatelot/',
    method: 'post',
    data
  })
}

export function getLotsAdvanced(params) {
  return request({
    url: api_prefix + 'lots' + '/lots/',
    method: 'get',
    params
  })
}

export function getLoansAdvanced(params) {
  return request({
    url: api_prefix + 'loan' + '/loanAdvanced/',
    method: 'get',
    params
  })
}

export function deaccessionLot(data) {
  return request({
    url: api_prefix + 'lots' + '/deaccession/',
    method: 'post',
    data
  })
}

export function getDeaccessions(params) {
  return request({
    url: api_prefix + 'lots' + '/deaccession/' + params.primaryID,
    method: 'get'
  })
}

export function getLocality(params) {
  return request({
    url: api_prefix + 'locality' + '/locality/' + params.keyWord,
    method: 'get',
    params
  })
}

export function getJarSizes(params) {
  return request({
    url: api_prefix + 'lots' + '/jarsizes/',
    method: 'get',
    params
  })
}
// limit 100
export function getDetermination(params) {
  return request({
    url: api_prefix + 'taxon' + '/determination',
    method: 'get',
    params
  })
}

export function getDeterminers() {
  return request({
    url: api_prefix + 'taxon' + '/determiners',
    method: 'get'
  })
}

// limit 100
export function getTaxon(params) {
  return request({
    url: api_prefix + 'taxon' + '/taxons/' + params.keyWord,
    method: 'get'
  })
}

export function addTaxon(data) {
  return request({
    url: api_prefix + 'taxon' + '/taxon/',
    method: 'post',
    data
  })
}

export function getFamily(params) {
  return request({
    url: api_prefix + 'taxon' + '/familysearch/' + params.keyWord,
    method: 'get'
  })
}

// limit 100
export function getCollectors(params) {
  return request({
    url: api_prefix + 'person' + '/collectors/' + params.keyWord,
    method: 'get',
    params
  })
}

// limit 100
export function getStaff(params) {
  return request({
    url: api_prefix + 'person' + '/staff',
    method: 'get',
    params
  })
}

export function getPreparation(params) {
  return request({
    url: api_prefix + 'lots' + '/preparation',
    method: 'get',
    params
  })
}

// address

export function getCountry(params) {
  return request({
    url: api_prefix + 'locality' + '/country',
    method: 'get',
    params
  })
} export function getStates(params) {
  return request({
    url: api_prefix + 'locality' + '/state',
    method: 'get',
    params
  })
} export function getCounty(params) {
  return request({
    url: api_prefix + 'locality' + '/county',
    method: 'get',
    params
  })
} export function getContinent(params) {
  return request({
    url: api_prefix + 'locality' + '/continent',
    method: 'get',
    params
  })
}

export function addNewLocality(data) {
  return request({
    url: api_prefix + 'locality' + '/locality/',
    method: 'post',
    data
  })
}
export function addNewCollector(data) {
  return request({
    url: api_prefix + 'person' + '/collectors/',
    method: 'post',
    data
  })
}
export function addNewDeterminer(data) {
  return request({
    url: api_prefix + 'person' + '/determiner/',
    method: 'post',
    data
  })
}
export function addNewStaff(data) {
  return request({
    url: api_prefix + 'person' + '/staff/',
    method: 'post',
    data
  })
}

// ULM
export function getULMRandom() {
  return request({
    url: api_prefix + 'ulm' + '/ulmrandom/',
    method: 'get'
  })
}

// ULM
export function getULM(params) {
  return request({
    url: api_prefix + 'uln' + '/ulm/',
    method: 'get',
    params
  })
}

export function reportULM(params) {
  return request({
    url: api_prefix + 'ulm' + '/reportulm/',
    method: 'get',
    params
  })
}

export function updateULMLot(data) {
  return request({
    url: '/updateulmrandom/',
    method: 'post',
    data
  })
}

export function getULMLotList(params) {
  return request({
    url: '/ulmlotlist/',
    method: 'get',
    params
  })
}

export function downloadULMData() {
  return request({
    url: '/ulmreportdata/',
    method: 'get'
  })
} export function downloadULMNotFoundData() {
  return request({
    url: '/ulmnotfoundreportdata',
    method: 'get'
  })
}

export function getULMStatsUser() {
  return request({
    url: '/ulmstatsu/',
    method: 'get'
  })
}

export function getULMStatsReview() {
  return request({
    url: '/ulmstatsreview/',
    method: 'get'
  })
}

// Osteology
export function getOst(params) {
  return request({
    url: '/ost/',
    method: 'get',
    params
  })
}

export function updateOst(data) {
  return request({
    url: '/updateost/',
    method: 'post',
    data
  })
}

export function getOstList(params) {
  return request({
    url: '/ostlist/',
    method: 'get',
    params
  })
}

export function reportOst(params) {
  return request({
    url: '/reportost/',
    method: 'get',
    params
  })
}

export function recentAdded() {
  return request({
    url: api_prefix + 'admin' +  '/recentadded/',
    method: 'get'
  })
}
