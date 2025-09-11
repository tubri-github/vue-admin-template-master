import request from '@/utils/request'

const api_prefix = '/file/'

export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: api_prefix + 'upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 验证字段映射和数据 - 这个对应后端的 validateMapping
export function validateMapping(data) {
  return request({
    url: api_prefix + 'validateMapping',
    method: 'post',
    data
  })
}

// 确认导入 - 这个对应后端的 confirmImport
export function confirmImport(data) {
  return request({
    url: api_prefix + 'confirmImport',
    method: 'post',
    data
  })
}

// 获取导入状态
export function getImportStatus(fileId) {
  return request({
    url: api_prefix + 'importStatus/' + fileId,
    method: 'get'
  })
}

// 导出问题列表
export function exportIssuesList(fileId) {
  return request({
    url: api_prefix + 'exportIssuesList/' + fileId,
    method: 'get',
    responseType: 'blob' // 用于文件下载
  })
}

// 下载模板
export function downloadTemplate() {
  return request({
    url: api_prefix + 'downloadTemplate',
    method: 'get',
    responseType: 'blob'
  })
}

// 获取分类学名称（用于参考）
export function getTaxonomicNames(params) {
  return request({
    url: api_prefix + 'taxonomicNames',
    method: 'get',
    params
  })
}

// 清理导入数据
export function cleanupImport(fileId) {
  return request({
    url: api_prefix + 'cleanupImport/' + fileId,
    method: 'delete'
  })
}
