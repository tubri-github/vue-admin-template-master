import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'
import ssoAuth from '@/utils/sso-auth'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/auth/callback'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // 优先检查本地token
  const hasLocalToken = getToken()

  if (hasLocalToken) {
    // 如果有本地token，按原逻辑处理
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      const hasRoles = store.getters.roles && store.getters.roles.length > 0
      if (hasRoles) {
        next()
      } else {
        try {
          let roles = store.getters.roles
          
          if (!roles || roles.length === 0) {
            const userInfo = await store.dispatch('user/getInfo')
            roles = userInfo.roles
          }

          const accessRoutes = await store.dispatch('permission/generateRoutes', roles)
          router.options.routes.push(...accessRoutes)
          router.addRoutes(accessRoutes)
          next({ ...to, replace: true })
        } catch (error) {
          await store.dispatch('user/resetToken')
          Message.error(error || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    // 没有本地token，检查SSO session
    if (whiteList.indexOf(to.path) !== -1) {
      // 白名单页面直接通过
      next()
    } else {
      try {
        // 检查SSO session
        const ssoUserInfo = await ssoAuth.checkSSOSession()
        
        if (ssoUserInfo) {
          // SSO session有效，自动登录
          console.log('Found valid SSO session, auto-login user:', ssoUserInfo.name)
          
          // 设置用户状态
          await store.dispatch('user/loginBySSO', ssoUserInfo)
          
          // 生成可访问路由
          const accessRoutes = await store.dispatch('permission/generateRoutes', ssoUserInfo.roles)
          router.options.routes.push(...accessRoutes)
          router.addRoutes(accessRoutes)
          
          // 跳转到目标页面
          next({ ...to, replace: true })
        } else {
          // 没有有效的SSO session，重定向到登录页面
          next(`/login?redirect=${to.path}`)
        }
      } catch (error) {
        // SSO检查失败，重定向到登录页面
        console.debug('SSO session check failed:', error)
        next(`/login?redirect=${to.path}`)
      }
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
