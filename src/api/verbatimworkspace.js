import request from '@/utils/request'

const api_prefix = '/batch/'
// 批次管理相关 API
export function getVerbatimBatches(data) {
  return request({
    url: api_prefix + 'batches',
    method: 'get',
    data
  })
}

export function getBatchInfo(batchSerialId) {
  return request({
    url: api_prefix + `/batches/${batchSerialId}`,
    method: 'get'
  })
}

export function getBatchRecords(batchSerialId, params = {}) {
  return request({
    url: api_prefix + `/batches/${batchSerialId}/records`,
    method: 'get',
    params: {
      page: params.page || 1,
      page_size: params.page_size || 25,
      status: params.status,
      search: params.search
    }
  })
}
export function markBatchCompleted(batchSerialId) {
  return request({
    url: api_prefix + `/batches/${batchSerialId}/complete`,
    method: 'post'
  });
}

export function exportBatchResults(batchSerialId) {
  return request({
    url: api_prefix + `/batches/${batchSerialId}/export`,
    method: 'get',
    responseType: 'blob'
  });
}

// Verbatim 数据获取 API
export function getVerbatimTaxonomic(verbatimTaxonomicId) {
  return request({
    url: `/verbatim/taxonomic/${verbatimTaxonomicId}`,
    method: 'get'
  });
}

export function getVerbatimLocality(verbatimLocalityId) {
  return request({
    url: `/verbatim/locality/${verbatimLocalityId}`,
    method: 'get'
  });
}

// 物种验证相关 API
export function searchTaxonomic(params) {
  return request({
    url: '/taxonomic/search',
    method: 'get',
    params
  });
}

export function autoMatchSpecies(verbatimData) {
  return request({
    url: '/taxonomic/auto-match',
    method: 'post',
    data: verbatimData
  });
}

export function createTaxonomic(taxonomicData) {
  return request({
    url: '/taxonomic',
    method: 'post',
    data: taxonomicData
  });
}

// 地点验证相关 API
export function searchLocality(params) {
  return request({
    url: '/locality/search',
    method: 'get',
    params
  });
}

export function searchLocalityAdvanced(searchData) {
  return request({
    url: '/locality/search/advanced',
    method: 'post',
    data: searchData
  });
}

export function searchLocalityByCoordinates(coordinateData) {
  return request({
    url: '/locality/search/coordinates',
    method: 'post',
    data: coordinateData
  });
}

export function autoMatchLocality(verbatimData) {
  return request({
    url: '/locality/auto-match',
    method: 'post',
    data: verbatimData
  });
}

export function createLocality(localityData) {
  return request({
    url: '/locality',
    method: 'post',
    data: localityData
  });
}

// 记录更新相关 API
export function updateVerbatimRecord(recordData) {
  return request({
    url: api_prefix + `/records/${recordData.id}`,
    method: 'put',
    data: recordData
  })
}

export function updateRecordDetails(recordData) {
  return request({
    url: `/primary/records/${recordData.id}`,
    method: 'put',
    data: recordData
  });
}


// 统计和报告 API
export function getBatchProgress(batchSerialId) {
  return request({
    url: api_prefix + `/batches/${batchSerialId}/progress`,
    method: 'get'
  });
}

export function getVerbatimStatistics(params = {}) {
  return request({
    url: '/batch/statistics',
    method: 'get',
    params
  });
}
export function applyTaxonomicSuggestion(record_id) {
  return request({
    url: api_prefix + `/records/${record_id}/apply-suggestion `,
    method: 'get',
  })
}
