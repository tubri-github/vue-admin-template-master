import request from '@/utils/request'

const api_prefix = '/api/batch/'
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
    url: `/api/verbatim/batches/${batchSerialId}/complete`,
    method: 'post'
  });
}

export function exportBatchResults(batchSerialId) {
  return request({
    url: `/api/verbatim/batches/${batchSerialId}/export`,
    method: 'get',
    responseType: 'blob'
  });
}

// Verbatim 数据获取 API
export function getVerbatimTaxonomic(verbatimTaxonomicId) {
  return request({
    url: `/api/verbatim/taxonomic/${verbatimTaxonomicId}`,
    method: 'get'
  });
}

export function getVerbatimLocality(verbatimLocalityId) {
  return request({
    url: `/api/verbatim/locality/${verbatimLocalityId}`,
    method: 'get'
  });
}

// 物种验证相关 API
export function searchTaxonomic(params) {
  return request({
    url: '/api/taxonomic/search',
    method: 'get',
    params
  });
}

export function autoMatchSpecies(verbatimData) {
  return request({
    url: '/api/taxonomic/auto-match',
    method: 'post',
    data: verbatimData
  });
}

export function createTaxonomic(taxonomicData) {
  return request({
    url: '/api/taxonomic',
    method: 'post',
    data: taxonomicData
  });
}

// 地点验证相关 API
export function searchLocality(params) {
  return request({
    url: '/api/locality/search',
    method: 'get',
    params
  });
}

export function searchLocalityAdvanced(searchData) {
  return request({
    url: '/api/locality/search/advanced',
    method: 'post',
    data: searchData
  });
}

export function searchLocalityByCoordinates(coordinateData) {
  return request({
    url: '/api/locality/search/coordinates',
    method: 'post',
    data: coordinateData
  });
}

export function autoMatchLocality(verbatimData) {
  return request({
    url: '/api/locality/auto-match',
    method: 'post',
    data: verbatimData
  });
}

export function createLocality(localityData) {
  return request({
    url: '/api/locality',
    method: 'post',
    data: localityData
  });
}

// 记录更新相关 API
export function updateVerbatimRecord(recordData) {
  return request({
    url: `/api/verbatim/records/${recordData.id}`,
    method: 'put',
    data: recordData
  });
}

export function updateRecordDetails(recordData) {
  return request({
    url: `/api/primary/records/${recordData.id}`,
    method: 'put',
    data: recordData
  });
}

export function generateFieldNumber() {
  return request({
    url: '/api/primary/generate-field-number',
    method: 'post'
  });
}

// 统计和报告 API
export function getBatchProgress(batchSerialId) {
  return request({
    url: `/api/verbatim/batches/${batchSerialId}/progress`,
    method: 'get'
  });
}

export function getVerbatimStatistics(params = {}) {
  return request({
    url: '/api/verbatim/statistics',
    method: 'get',
    params
  });
}
