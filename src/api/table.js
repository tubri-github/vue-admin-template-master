import request from '@/utils/request'

const api_prefix = ''

export function addNewLoan(data) {
  return request({
    url: api_prefix + 'loan' + '/loan',
    method: 'post',
    data
  })
}

export function addNewLoanPeople(data) {
  return request({
    url: api_prefix + 'loan' + '/loanpeople',
    method: 'post',
    data
  })
}

export function addNewLot(data) {
  return request({
    url: api_prefix + 'lots' + '/lot',
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
    url: api_prefix + 'loan' + '/loanpeople',
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
    url: api_prefix + 'loan' + '/uploan',
    method: 'post',
    data
  })
}

export function generateNewLoanID(params) {
  return request({
    url: api_prefix + 'loan' + '/newloan',
    method: 'get',
    params
  })
}

export function generateNewGiftID(params) {
  return request({
    url: api_prefix + 'loan' + '/newgift',
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

// 保持向后兼容的函数
export function getLocalityAdvanced(params = {}) {
  // 转换为新的搜索接口参数
  const searchParams = {}

  if (params.fieldNo) {
    searchParams.field_no = params.fieldNo
  }

  if (params.limit) {
    searchParams.limit = params.limit
  }

  return searchLocalities(searchParams)
}

// 新版 locality 高级搜索（过滤引擎，直传 search/field_filters/structured_filters/page…）—— 给 AdvancedSearchBase 用
export function searchLocalitiesAdvanced(params) {
  return request({
    url: api_prefix + 'locality' + '/localityAdvanced',
    method: 'get',
    params
  })
}

// locality 搜索的 filter-metadata（路径是单段 /filter-metadata，避开 /locality/{keyword}）
export function getLocalityFilterMetadata() {
  return request({
    url: api_prefix + 'locality' + '/filter-metadata',
    method: 'get'
  })
}

// GEOLocate 地理参照：按文字 locality + 行政区反查候选坐标
export function georeferenceLocality(params) {
  return request({
    url: api_prefix + 'locality' + '/georeference',
    method: 'get',
    params
  })
}

// 把选定的经纬度存回某条 locality
export function updateLocalityCoords(data) {
  return request({
    url: api_prefix + 'locality' + '/update-coords',
    method: 'post',
    data
  })
}

// 按 Locality1ID 取单条 locality（编辑加载用）
export function getLocalityById(id) {
  return request({
    url: api_prefix + 'locality' + '/' + id,
    method: 'get'
  })
}

// 更新一条已有 locality（编辑提交）
export function updateLocality(data) {
  return request({
    url: api_prefix + 'locality' + '/update-locality',
    method: 'post',
    data
  })
}

// 地名建议（gazetteer）：本地受控词表 + GeoNames。level=continent|country|state|county
export function geoSuggest(params) {
  return request({
    url: api_prefix + 'locality' + '/geo-suggest',
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
// 按 PrimaryID 取单条 lot 编辑数据（子节点没有 CatalogNumber，edit 必须用 PrimaryID）
export function getLotByPrimary(primaryId) {
  return request({
    url: api_prefix + 'lots' + '/lot-by-primary/' + primaryId,
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
    url: api_prefix + 'lots' + '/updatelot',
    method: 'post',
    data
  })
}

export function getLotsAdvanced(params) {
  return request({
    url: api_prefix + 'lots' + '/lots',
    method: 'get',
    params
  })
}

// 返回 lots 可过滤列清单（key/label/group/type/operators），驱动 chip 选择器
export function getLotsFilterMetadata() {
  return request({
    url: api_prefix + 'lots' + '/lots/filter-metadata',
    method: 'get'
  })
}

// Collection 树：取某节点及其后代
export function getLotTree(params) {
  return request({
    url: api_prefix + 'lots' + '/tree/' + params.primaryId,
    method: 'get'
  })
}

// Collection 树：在某节点下加子记录（osteology/tissue/image）
export function addSubRecord(data) {
  return request({
    url: api_prefix + 'lots' + '/sub-record',
    method: 'post',
    data
  })
}

// Collection 树：删除一个子记录节点（cascade=true 连整棵子树一起删；root 不可删）
export function deleteSubRecord(primaryId, cascade = false) {
  return request({
    url: api_prefix + 'lots' + '/sub-record/' + primaryId,
    method: 'delete',
    params: { cascade }
  })
}

export function getLoansAdvanced(params) {
  return request({
    url: api_prefix + 'loan' + '/loanAdvanced',
    method: 'get',
    params
  })
}

// Loan 搜索的 filter-metadata（驱动通用 AdvancedSearchBase 的 chip 选择器）
// 注意：路径不能放在 /loan/ 下，否则被 /loan/{loanid} 抢先匹配
export function getLoanFilterMetadata() {
  return request({
    url: api_prefix + 'loan' + '/filter-metadata',
    method: 'get'
  })
}

// 按 LoanNumber 取借阅详情（含各借阅明细行）
export function getLoanDetail(loanNumber) {
  return request({
    url: api_prefix + 'loan' + '/loan/' + loanNumber,
    method: 'get'
  })
}

export function deaccessionLot(data) {
  return request({
    url: api_prefix + 'lots' + '/deaccession',
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
export function getLocalityes(params) {
  return request({
    url: api_prefix + 'search' + '/locality',
    method: 'get',
    params
  })
}

export function getJarSizes(params) {
  return request({
    url: api_prefix + 'lots' + '/jarsizes',
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
    url: api_prefix + 'taxon' + '/taxon',
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
    url: api_prefix + 'locality' + '/locality',
    method: 'post',
    data
  })
}
export function addNewCollector(data) {
  return request({
    url: api_prefix + 'person' + '/collectors',
    method: 'post',
    data
  })
}
export function addNewDeterminer(data) {
  return request({
    url: api_prefix + 'person' + '/determiner',
    method: 'post',
    data
  })
}
export function addNewStaff(data) {
  return request({
    url: api_prefix + 'person' + '/staff',
    method: 'post',
    data
  })
}

// ULM
export function getULMRandom() {
  return request({
    url: api_prefix + 'ulm' + '/ulmrandom',
    method: 'get'
  })
}

// ULM
export function getULM(params) {
  return request({
    url: api_prefix + 'uln' + '/ulm',
    method: 'get',
    params
  })
}

export function reportULM(params) {
  return request({
    url: api_prefix + 'ulm' + '/reportulm',
    method: 'get',
    params
  })
}

export function updateULMLot(data) {
  return request({
    url: '/updateulmrandom',
    method: 'post',
    data
  })
}

export function getULMLotList(params) {
  return request({
    url: '/ulmlotlist',
    method: 'get',
    params
  })
}

export function downloadULMData() {
  return request({
    url: '/ulmreportdata',
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
    url: api_prefix + 'ulm' + '/ulmstatsu',
    method: 'get'
  })
}

export function getULMStatsReview() {
  return request({
    url: '/ulmstatsreview',
    method: 'get'
  })
}

// Osteology
export function getOst(params) {
  return request({
    url: '/ost',
    method: 'get',
    params
  })
}

export function updateOst(data) {
  return request({
    url: '/updateost',
    method: 'post',
    data
  })
}

export function getOstList(params) {
  return request({
    url: '/ostlist',
    method: 'get',
    params
  })
}

export function reportOst(params) {
  return request({
    url: '/reportost',
    method: 'get',
    params
  })
}

export function recentAdded() {
  return request({
    url: api_prefix + 'admin' + '/recentadded',
    method: 'get'
  })
}

export function getReport() {
  return request({
    url: api_prefix + 'lots' + '/validate-data',
    method: 'get',
    responseType: 'blob'
  })
}

// api/locality.js
// Locality相关的API调用函数

/**
 * 统一搜索地点
 * @param {Object} params - 搜索参数
 */
export function searchLocalities(params = {}) {
  return request({
    url: api_prefix + '/locality/search',
    method: 'get',
    params
  })
}

/**
 * 根据ID获取地点详情
 * @param {number} localityId - 地点ID
 */
export function getLocalityDetails(localityId) {
  return request({
    url: api_prefix + `/locality/${localityId}`,
    method: 'get'
  })
}

/**
 * 创建新地点
 * @param {Object} localityData - 地点数据
 */
export function createLocality(localityData) {
  return request({
    url: api_prefix + '/locality/create',
    method: 'post',
    data: localityData
  })
}

export function checkLocalityFieldNoExists(params) {
  return request({
    url: api_prefix + `/locality/check-fieldno/${params.fieldNo}`,
    method: 'get'
  })
}
