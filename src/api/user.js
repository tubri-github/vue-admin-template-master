import request from '@/utils/request'

const api_prefix = '/api/'

export function login(data) {
  return request({
    url: api_prefix + 'login' + '/login',
    method: 'post',
    data
  })
}

export function getInfo(token) {
  return request({
    url: api_prefix + 'login' + '/getInfo',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    url: api_prefix + 'login' + '/logout',
    method: 'post'
  })
}
