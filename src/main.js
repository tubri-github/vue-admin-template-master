import Vue from 'vue'

import 'normalize.css/normalize.css' // A modern alternative to CSS resets

import './assets/icon-fonts/iconfont.css'
import './assets/icon-fonts/iconfont'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import locale from 'element-ui/lib/locale/lang/en' // lang i18n

import '@/styles/index.scss' // global css

import App from './App'
import store from './store'
import router from './router'

import '@/icons' // icon
import '@/permission' // permission

import * as VueGoogleMaps from 'vue2-google-maps' //maps

import VXETable from 'vxe-table' //vxe-table
import 'vxe-table/lib/style.css'
/**
 * If you don't want to use mock-server
 * you want to use MockJs for mock api
 * you can execute: mockXHR()
 *
 * Currently MockJs will be used in the production environment,
 * please remove it before going online ! ! !
 */
if (process.env.NODE_ENV === 'production') {
  const { mockXHR } = require('../mock')
  mockXHR()
}

// set ElementUI lang to EN
Vue.use(ElementUI, { locale })
// 如果想要中文版 element-ui，按如下方式声明
// Vue.use(ElementUI)

VXETable.setup({
  loadingText:'Loading...',
  table:{
    emptyText:"Data not Found"
  }
  })
Vue.use(VXETable)
//set GoogleMap to Vue
Vue.use(VueGoogleMaps,{
  load:{
    key:'AIzaSyAPvHRVPWYvk86tFKcj6h3La4ym6EpH52k',
    libraries:'places',
  },
  installComponents: true
})
import countTo from 'vue-count-to'
Vue.component('countTo', countTo)

Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
})
