# Environment Setup Guide

## 环境变量配置指南

### 快速开始

1. 复制 `.env.example` 文件：
   ```bash
   cp .env.example .env.development
   cp .env.example .env.production
   cp .env.example .env.staging
   ```

2. 根据不同环境修改对应的配置文件

### 环境变量说明

#### 基础配置
- `ENV` - 环境标识 (development/staging/production)
- `VUE_APP_BASE_API` - 后端API基础路径

#### SSO 统一认证配置
- `VUE_APP_SSO_AUTH_CENTER_URL` - 认证中心地址
- `VUE_APP_SSO_PROJECT_CODE` - 项目代码（与FishnetUserSystem数据库匹配）
- `VUE_APP_SSO_API_PREFIX` - SSO API路径前缀
- `VUE_APP_SSO_CURRENT_DOMAIN` - 当前前端域名（用于回调）

#### 第三方服务
- `VUE_APP_GOOGLE_MAPS_API_KEY` - Google Maps API密钥

#### 功能开关
- `VUE_APP_ENABLE_SSO_DIRECT_LOGIN` - 是否启用SSO直接登录 (true/false)
- `VUE_APP_USE_MOCK_DATA` - 是否使用模拟数据 (true/false)

### 不同环境配置示例

#### 开发环境 (.env.development)
```env
VUE_APP_SSO_AUTH_CENTER_URL = 'http://localhost:8010'
VUE_APP_SSO_CURRENT_DOMAIN = 'http://localhost:9528'
VUE_APP_ENABLE_SSO_DIRECT_LOGIN = true
VUE_APP_USE_MOCK_DATA = true
```

#### 生产环境 (.env.production)
```env
VUE_APP_SSO_AUTH_CENTER_URL = 'https://auth.your-domain.com'
VUE_APP_SSO_CURRENT_DOMAIN = 'https://museum.your-domain.com'
VUE_APP_ENABLE_SSO_DIRECT_LOGIN = true
VUE_APP_USE_MOCK_DATA = false
```

### 注意事项

1. **安全性**：不要将包含敏感信息的 `.env` 文件提交到Git
2. **团队协作**：使用 `.env.example` 作为模板，让团队成员知道需要配置哪些变量
3. **部署**：生产环境的环境变量应该由部署平台或CI/CD系统提供