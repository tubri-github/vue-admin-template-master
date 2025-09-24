// FMMT项目的SSO认证客户端 - Vue 2版本
import axios from 'axios'
import { getToken, setToken, removeToken } from './auth'

// 创建独立的axios实例，避免使用项目的全局baseURL配置
const ssoAxios = axios.create({
  // 不设置baseURL，直接使用完整URL
  withCredentials: true,  // 始终携带cookie
  timeout: 10000
})

// SSO认证配置 - 从环境变量读取
const SSO_CONFIG = {
  authCenterUrl: process.env.VUE_APP_SSO_AUTH_CENTER_URL || 'http://localhost:8010',
  projectCode: process.env.VUE_APP_SSO_PROJECT_CODE || 'FMMT',
  apiPrefix: process.env.VUE_APP_SSO_API_PREFIX || '/api/v1',
  currentDomain: process.env.VUE_APP_SSO_CURRENT_DOMAIN || window.location.origin,
  storageKeys: {
    redirectUrl: 'sso_redirect_url',
    authState: 'sso_auth_state'
  }
}

class SSOAuthClient {
  constructor(config = SSO_CONFIG) {
    this.config = config
  }

  // 生成随机字符串（用于state参数防CSRF）
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // 重定向到统一登录页面
  redirectToLogin(returnUrl = null) {
    // 保存返回地址，如果没有指定，从当前URL中提取真实要访问的页面
    let redirectUrl = returnUrl

    if (!redirectUrl) {
      // 从当前URL提取用户真正想访问的页面
      const currentUrl = window.location.href
      const currentHash = window.location.hash

      // 如果当前在登录页面，且有redirect参数，提取真实目标页面
      if (currentHash && currentHash.includes('redirect=')) {
        const redirectMatch = currentHash.match(/redirect=([^&]+)/)
        if (redirectMatch) {
          redirectUrl = decodeURIComponent(redirectMatch[1])
          // 如果是相对路径，转换为完整路径
          if (redirectUrl.startsWith('/')) {
            redirectUrl = `${window.location.origin}${window.location.pathname}#${redirectUrl}`
          }
        } else {
          redirectUrl = currentUrl
        }
      } else {
        redirectUrl = currentUrl
      }
    }

    localStorage.setItem(this.config.storageKeys.redirectUrl, redirectUrl)

    // 生成随机state用于防CSRF
    const state = this.generateRandomString(43)
    localStorage.setItem(this.config.storageKeys.authState, state)

    // 构建SSO登录URL - 重定向到认证中心
    // 确保回调URL干净，不包含任何hash路径
    const cleanCallbackUrl = `${this.config.currentDomain}/tummt/auth/callback`
    const params = new URLSearchParams({
      redirect_uri: cleanCallbackUrl,
      project: this.config.projectCode,
      state: state
    })

    window.location.href = `${this.config.authCenterUrl}${this.config.apiPrefix}/sso/login?${params.toString()}`
  }

  // 处理SSO回调，用授权码换取token和用户信息
  async handleCallback(code, state) {
    try {
      // 验证state参数防止CSRF攻击
      const savedState = localStorage.getItem(this.config.storageKeys.authState)
      if (!state || state !== savedState) {
        throw new Error('Invalid state parameter. Possible CSRF attack.')
      }

      // 清除保存的state
      localStorage.removeItem(this.config.storageKeys.authState)

      if (!code) {
        throw new Error('No authorization code received.')
      }

      // 使用授权码换取token
      const cleanCallbackUrl = `${this.config.currentDomain}/tummt/auth/callback`
      const params = new URLSearchParams({
        code: code,
        project: this.config.projectCode,
        redirect_uri: cleanCallbackUrl
      })

      const response = await ssoAxios.post(
        `${this.config.authCenterUrl}${this.config.apiPrefix}/sso/exchange-token?${params.toString()}`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to exchange authorization code')
      }

      const tokenData = response.data.data
      
      // 详细调试SSO返回的数据结构
      console.log('=== SSO Token Data Debug ===');
      console.log('Full tokenData:', tokenData);
      console.log('tokenData.is_superuser:', tokenData.is_superuser);
      console.log('tokenData.permissions:', tokenData.permissions);
      console.log('tokenData.roles:', tokenData.roles);
      console.log('tokenData.user_roles:', tokenData.user_roles);
      console.log('tokenData.role_list:', tokenData.role_list);
      console.log('All tokenData keys:', Object.keys(tokenData));
      console.log('=== End Debug ===');

      // 构造符合Vue Admin Template格式的用户数据
      const userInfo = {
        token: tokenData.access_token,
        name: tokenData.display_name || tokenData.username,
        avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
        roles: this.mapPermissionsToRoles(
          tokenData.permissions, 
          tokenData.is_superuser, 
          tokenData.roles || tokenData.user_roles || tokenData.role_list || []
        ),
        introduction: this.generateIntroduction(tokenData),
        // 保存原始数据以备后用
        _originalData: {
          user_id: tokenData.user_id,
          username: tokenData.username,
          email: tokenData.email,
          display_name: tokenData.display_name,
          is_superuser: tokenData.is_superuser,
          permissions: tokenData.permissions || [],
          roles: tokenData.roles || tokenData.user_roles || tokenData.role_list || []
        }
      }

      return userInfo
    } catch (error) {
      console.error('SSO callback handling failed:', error)
      throw error
    }
  }

  // 将权限映射为角色（适配现有的角色系统）
  mapPermissionsToRoles(permissions = [], isSuperuser = false, userRoles = []) {
    console.log('Mapping permissions to roles:', { permissions, isSuperuser, userRoles });
    
    // 检查是否是超级用户
    if (isSuperuser === true || isSuperuser === 'true' || isSuperuser === 1) {
      console.log('User is superuser, granting admin role');
      return ['admin']
    }

    // 检查用户角色（处理新的角色数据结构）
    if (userRoles && userRoles.length > 0) {
      console.log('Processing user roles:', userRoles);
      
      const hasManagerRole = userRoles.some(role => {
        // 处理角色对象格式
        let roleName = '';
        let roleCode = '';
        
        if (typeof role === 'string') {
          roleName = role.toLowerCase();
        } else if (role && typeof role === 'object') {
          roleName = (role.name || role.role_name || '').toLowerCase();
          roleCode = (role.code || role.role_code || '').toLowerCase();
        }
        
        console.log('Checking role:', { roleName, roleCode });
        
        // 检查是否是管理员角色（基于FishnetUserSystem的角色体系）
        return roleName.includes('system_manager') ||
               roleName.includes('system manager') ||
               roleName.includes('admin') ||
               roleName.includes('administrator') ||
               roleName.includes('manager') ||
               roleCode.includes('system_manager') ||
               roleCode.includes('admin') ||
               roleCode.includes('manager') ||
               // 检查具体的项目管理员角色
               roleName.includes('project_admin') ||
               roleName.includes('data_manager') ||
               roleCode.includes('project_admin') ||
               roleCode.includes('data_manager');
      });
      
      if (hasManagerRole) {
        console.log('User has manager/admin role, granting admin permissions');
        return ['admin']
      }
      
      // 检查是否有编辑权限
      const hasEditorRole = userRoles.some(role => {
        let roleName = '';
        let roleCode = '';
        
        if (typeof role === 'string') {
          roleName = role.toLowerCase();
        } else if (role && typeof role === 'object') {
          roleName = (role.name || role.role_name || '').toLowerCase();
          roleCode = (role.code || role.role_code || '').toLowerCase();
        }
        
        return roleName.includes('editor') ||
               roleName.includes('data_editor') ||
               roleName.includes('contributor') ||
               roleCode.includes('editor') ||
               roleCode.includes('data_editor') ||
               roleCode.includes('contributor');
      });
      
      if (hasEditorRole) {
        console.log('User has editor role, granting editor permissions');
        return ['editor']
      }
    }

    const roles = []

    // 根据权限映射角色
    if (permissions && Array.isArray(permissions)) {
      if (permissions.includes('data.manage') || 
          permissions.includes('project.admin') ||
          permissions.includes('admin') ||
          permissions.includes('management') ||
          permissions.includes('all')) {
        roles.push('admin')
      } else if (permissions.includes('data.edit') || 
                 permissions.includes('project.edit') ||
                 permissions.includes('editor') ||
                 permissions.includes('write')) {
        roles.push('editor')
      } else if (permissions.includes('data.view') || 
                 permissions.includes('project.access') ||
                 permissions.includes('viewer') ||
                 permissions.includes('read')) {
        roles.push('viewer')
      }
    }

    // 如果没有特定权限，给予基础viewer权限（安全的默认值）
    if (roles.length === 0) {
      console.log('No specific permissions found, granting viewer role for authenticated user');
      roles.push('viewer')
    }

    console.log('Final mapped roles:', roles);
    
    // 额外调试：如果是superuser但roles为空，强制设置admin
    if (isSuperuser === true && roles.length === 0) {
      console.error('ERROR: Superuser detected but no admin role assigned! Force adding admin role.');
      roles.push('admin');
    }
    
    console.log('FINAL RETURN roles:', roles);
    return roles
  }

  // 生成用户介绍
  generateIntroduction(userData) {
    if (userData.is_superuser) {
      return 'I am a super administrator'
    }

    const permissions = userData.permissions || []
    if (permissions.includes('data.manage') || permissions.includes('project.admin')) {
      return 'I am a data manager'
    }

    return 'I am a museum user'
  }

  // SSO登出
  async logout() {
    try {
      // 调用认证中心的SSO登出接口
      await ssoAxios.post(`${this.config.authCenterUrl}${this.config.apiPrefix}/sso/logout`, {
        redirect_uri: window.location.origin
      })
    } catch (error) {
      console.error('SSO logout failed:', error)
    }
  }

  // 获取保存的重定向URL
  getRedirectUrl() {
    const url = localStorage.getItem(this.config.storageKeys.redirectUrl)
    localStorage.removeItem(this.config.storageKeys.redirectUrl)
    return url
  }

  // 检查SSO session是否有效
  async checkSSOSession() {
    try {
      const response = await ssoAxios.get(
        `${this.config.authCenterUrl}${this.config.apiPrefix}/sso/check-session`,
        {
          params: {
            project: this.config.projectCode
          }
        }
      )

      if (response.data.success && response.data.data) {
        const tokenData = response.data.data
        
        // 详细调试SSO session数据结构
        console.log('=== SSO Session Data Debug ===');
        console.log('Full session tokenData:', tokenData);
        console.log('session tokenData.is_superuser:', tokenData.is_superuser);
        console.log('session tokenData.permissions:', tokenData.permissions);
        console.log('session tokenData.roles:', tokenData.roles);
        console.log('session tokenData.user_roles:', tokenData.user_roles);
        console.log('session tokenData.role_list:', tokenData.role_list);
        console.log('All session tokenData keys:', Object.keys(tokenData));
        console.log('=== End Session Debug ===');

        // 构造符合Vue Admin Template格式的用户数据
        const userInfo = {
          token: tokenData.access_token,
          name: tokenData.display_name || tokenData.username,
          avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
          roles: this.mapPermissionsToRoles(
            tokenData.permissions, 
            tokenData.is_superuser, 
            tokenData.roles || tokenData.user_roles || tokenData.role_list || []
          ),
          introduction: this.generateIntroduction(tokenData),
          _originalData: {
            user_id: tokenData.user_id,
            username: tokenData.username,
            email: tokenData.email,
            display_name: tokenData.display_name,
            is_superuser: tokenData.is_superuser,
            permissions: tokenData.permissions || [],
            roles: tokenData.roles || tokenData.user_roles || tokenData.role_list || []
          }
        }

        return userInfo
      }

      return null
    } catch (error) {
      console.debug('No valid SSO session:', error.message)
      return null
    }
  }
}

// 创建全局实例
export const ssoAuthClient = new SSOAuthClient()

// 导出主要方法供组件使用
export default {
  redirectToLogin: (returnUrl) => ssoAuthClient.redirectToLogin(returnUrl),
  handleCallback: (code, state) => ssoAuthClient.handleCallback(code, state),
  logout: () => ssoAuthClient.logout(),
  getRedirectUrl: () => ssoAuthClient.getRedirectUrl(),
  checkSSOSession: () => ssoAuthClient.checkSSOSession()
}
