<template>
  <div class="auth-callback-container">
    <div class="callback-content">
      <div v-if="isProcessing" class="processing">
        <div class="spinner"></div>
        <h2>Processing Authentication...</h2>
        <p>Please wait while we verify your login.</p>
      </div>
      
      <div v-else-if="error" class="error">
        <div class="error-icon">⚠️</div>
        <h2>Authentication Failed</h2>
        <p>{{ error }}</p>
        <div class="actions">
          <el-button type="primary" @click="retryLogin">Try Again</el-button>
          <el-button @click="goHome">Go Home</el-button>
        </div>
      </div>

      <div v-else class="success">
        <div class="success-icon">✅</div>
        <h2>Login Successful!</h2>
        <p>Redirecting you to the application...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ssoAuthClient } from '@/utils/sso-auth'

export default {
  name: 'AuthCallback',
  data() {
    return {
      isProcessing: true,
      error: null
    }
  },
  async mounted() {
    await this.processCallback()
  },
  methods: {
    async processCallback() {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')
        const errorParam = urlParams.get('error')

        // 检查是否有错误参数
        if (errorParam) {
          throw new Error(`Authentication error: ${errorParam}`)
        }

        // 使用SSO客户端处理回调
        const userInfo = await ssoAuthClient.handleCallback(code, state)
        
        // 使用Vuex更新认证状态
        await this.$store.dispatch('user/loginBySSO', userInfo)
        
        this.isProcessing = false
        
        console.log('SSO Login successful, redirecting to dashboard...')
        
        setTimeout(() => {
          // 使用Vue Router进行导航，确保通过路由守卫
          // 从localStorage获取原始要访问的页面，如果没有则跳转到dashboard
          const savedRedirectUrl = ssoAuthClient.getRedirectUrl()
          let targetPath = '/'  // 默认跳转到首页，会自动重定向到dashboard
          
          if (savedRedirectUrl) {
            try {
              // 如果有保存的重定向URL，提取其中的路径
              const url = new URL(savedRedirectUrl)
              if (url.hash && url.hash.length > 1) {
                // 提取hash中的路径，去掉#号
                targetPath = url.hash.substring(1)
                // 如果是登录页面，则跳转到首页
                if (targetPath.startsWith('/login')) {
                  targetPath = '/'
                }
              }
            } catch (e) {
              console.warn('Failed to parse saved redirect URL:', e)
              targetPath = '/'
            }
          }
          
          console.log('SSO callback complete, redirecting to path:', targetPath)
          
          // 使用Vue Router进行导航，这样会触发路由守卫
          this.$router.replace(targetPath)
        }, 1000)
        
      } catch (err) {
        console.error('Authentication callback error:', err)
        this.error = err.message
        this.isProcessing = false
      }
    },

    retryLogin() {
      ssoAuthClient.redirectToLogin()
    },

    goHome() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.auth-callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  padding: 2rem;
}

.callback-content {
  background: white;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.processing h2,
.success h2 {
  color: #409EFF;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.error h2 {
  color: #F56C6C;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

p {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .auth-callback-container {
    padding: 1rem;
  }
  
  .callback-content {
    padding: 2rem 1rem;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>