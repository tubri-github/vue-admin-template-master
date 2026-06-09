import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },

  {
    path: '/auth/callback',
    component: () => import('@/views/auth/callback'),
    hidden: true,
    meta: {
      skipAuth: true// 标记此路由跳过认证检查
    }
  },

  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },

  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [{
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('@/views/dashboard/index'),
      meta: { title: 'Dashboard', icon: 'dashboard' }
    }]
  }

  // {
  //   path: '/example',
  //   component: Layout,
  //   redirect: '/example/table',
  //   name: 'Example',
  //   meta: { title: 'Example', icon: 'el-icon-s-help' },
  //   children: [
  //     {
  //       path: 'table',
  //       name: 'Table',
  //       component: () => import('@/views/table/index'),
  //       meta: { title: 'Table', icon: 'table' }
  //     },
  //     {
  //       path: 'tree',
  //       name: 'Tree',
  //       component: () => import('@/views/tree/index'),
  //       meta: { title: 'Tree', icon: 'tree' }
  //     }
  //   ]
  // },
]

export const asyncRoutes = [
  // 为所有用户提供基本的查看功能
  {
    path: '/lot',
    component: Layout,
    name: 'Lot',
    meta: { title: 'Lot', icon: 'jar' },
    children: [
      {
        path: 'add',
        name: 'AddLot',
        component: () => import('@/views/lotform/index'),
        meta: { title: 'Add', icon: 'jar', roles: ['admin', 'editor'] }
      },
      {
        path: 'deaccesion',
        name: 'DeaaccesionALot',
        component: () => import('@/views/Lot/deaccesion'),
        meta: { title: 'Deaccesion', icon: 'jar', roles: ['admin'] }
      },
      {
        // Basic Search 暂时隐藏（保留路由/组件，仅不显示在菜单）
        path: 'search',
        name: 'SearchLot',
        hidden: true,
        component: () => import('@/views/Lot/baseSearch/index'),
        meta: { title: 'Search', icon: 'form' },
        children: [
          {
            path: 'basic_search',
            name: 'BaseSearchLot',
            component: () => import('@/views/Lot/baseSearch/index'),
            meta: { title: 'Basic Search', icon: 'form' }
          }
        ]
      },
      {
        // 原 Advanced Search → 现在就叫 Search（放大镜图标）
        path: 'advanced-search',
        name: 'AdvancedSearchLot',
        component: () => import('@/views/Lot/advancedSearch/index'),
        meta: { title: 'Search', icon: 'search' }
      },
      {
        path: 'collections',
        name: 'LotCollectionTree',
        component: () => import('@/views/Lot/collectionTree/index'),
        meta: { title: 'Collection Tree', icon: 'tree' }
      },
      {
        path: 'lot-main',
        name: 'LotMain',
        component: () => import('@/views/Lot/index'),
        meta: { title: 'Lot Main', icon: 'form' },
        hidden: true
      },
      {
        path: 'lot-search-old',
        name: 'LotSearchOld',
        component: () => import('@/views/Lot/LotSearch/index'),
        meta: { title: 'Lot Search Old', icon: 'form' },
        hidden: true
      }
    ]
  },

  {
    path: '/locality',
    component: Layout,
    name: 'Locality',
    meta: { title: 'Locality', icon: 'locality' },
    children: [
      {
        path: 'add',
        name: 'AddLocality',
        component: () => import('@/views/localityform/index'),
        meta: { title: 'Add', icon: 'locality', roles: ['admin', 'editor'] }
      },
      {
        // 新版 locality 搜索（复用通用 AdvancedSearchBase）；旧 LocalitySearch/Search 留作参考
        path: 'search',
        name: 'SearchLocality',
        component: () => import('@/views/Locality/AdvancedSearch/index'),
        meta: { title: 'Search', icon: 'search' }
      },
      {
        path: 'es-search',
        name: 'ESSearchLocality',
        component: () => import('@/views/Locality/search'),
        meta: { title: 'ES Search', icon: 'search' },
        hidden: true
      }
    ]
  },

  {
    path: '/loan',
    component: Layout,
    name: 'Loan',
    meta: { title: 'Loan', icon: 'loan' },
    children: [
      {
        path: 'add',
        name: 'AddLoan',
        component: () => import('@/views/loanform/index'),
        meta: { title: 'Add', icon: 'loan', roles: ['admin', 'editor'] }
      },
      {
        // 新版借阅搜索（复用通用 AdvancedSearchBase）；旧 LoanSearch 留作参考
        path: 'search',
        name: 'SearchLoan',
        component: () => import('@/views/Loan/AdvancedSearch/index'),
        meta: { title: 'Search', icon: 'search' }
      }
    ]
  },

  {
    path: '/taxonomic',
    component: Layout,
    name: 'Taxonomic',
    meta: { title: 'Taxonomic', icon: 'tree' },
    children: [
      {
        path: 'add',
        name: 'addTaxon',
        component: () => import('@/views/taxonomic/taxonomicform'),
        meta: { title: 'Taxonomic', icon: 'tree', roles: ['admin', 'editor'] }
      }
    ]
  },

  {
    path: '/synonym-review',
    component: Layout,
    name: 'SynonymReview',
    meta: { title: 'Synonym Review', icon: 'tree', roles: ['admin'] },
    children: [
      {
        path: 'index',
        name: 'SynonymReviewPage',
        component: () => import('@/views/synonymReview/index'),
        meta: { title: 'Taxon Synonym Review', icon: 'tree' }
      }
    ]
  },

  {
    path: '/fileprocessor',
    component: Layout,
    name: 'FileProcessor',
    meta: { title: 'File Processor', icon: 'tree', roles: ['admin'] },
    children: [
      {
        path: 'upload',
        name: 'uploadulm',
        component: () => import('@/views/fileprocessor/ImportWizard'),
        meta: { title: 'File Upload', icon: 'tree' }
      },
      {
        path: 'review',
        name: 'reviewulm',
        component: () => import('@/views/fileprocessor/VerbatimWorkspace'),
        meta: { title: 'Batch Review', icon: 'tree' }
      }
    ]
  },

  {
    path: '/Person',
    component: Layout,
    name: 'Person',
    meta: { title: 'Person', icon: 'user', roles: ['admin'] },
    children: [
      {
        path: 'add',
        name: 'AddPerson',
        component: () => import('@/views/personform/index'),
        meta: { title: 'Person', icon: 'user' }
      }
    ]
  },

  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
