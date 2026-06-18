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
  const query = {
    page: params.page || 1,
    page_size: params.page_size || 25,
    status: params.status,
    search: params.search
  }
  // field_filters: 只在非空对象时序列化为 JSON
  if (params.field_filters && typeof params.field_filters === 'object') {
    const cleaned = {}
    Object.keys(params.field_filters).forEach(k => {
      const vals = params.field_filters[k]
      if (Array.isArray(vals) && vals.length > 0) cleaned[k] = vals
    })
    if (Object.keys(cleaned).length > 0) {
      query.field_filters = JSON.stringify(cleaned)
    }
  }
  return request({
    url: api_prefix + `/batches/${batchSerialId}/records`,
    method: 'get',
    params: query
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

// 下载该批次保留的原始上传源文件
export function downloadBatchSourceFile(batchSerialId) {
  return request({
    url: api_prefix + `/batches/${batchSerialId}/source-file`,
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
    url: api_prefix + `/records/${record_id}/apply-suggestion`,
    method: 'post',
  })
}

export function applyFamilyTaxon(record_id, family_id) {
  return request({
    url: api_prefix + `/records/${record_id}/apply-family-taxon`,
    method: 'post',
    data: { family_id }
  })
}

// 创建 CoF 建议的 taxon（本地缺该 accepted 名时）并指给该记录
export function createCofTaxon(record_id, payload) {
  return request({
    url: api_prefix + `/records/${record_id}/create-cof-taxon`,
    method: 'post',
    data: payload
  })
}

// 新建 Family 记录（family_name 必填，family_number/alias2 选填）
export function createFamily(payload) {
  return request({
    url: '/taxon/family',
    method: 'post',
    data: payload
  })
}

// 确认批次导入，生成正式的catalog number
export function confirmBatchImport(batchSerialId) {
  return request({
    url: '/file/confirmBatchImport',
    method: 'post',
    data: {
      batchSerialId: batchSerialId,
      confirmImport: true
    }
  })
}

// 获取批次状态，检查是否有临时ID记录
export function getBatchStatus(batchSerialId) {
  return request({
    url: `/file/batchStatus/${batchSerialId}`,
    method: 'get'
  })
}
