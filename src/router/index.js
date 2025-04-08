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
  // {
  //   path: '/ulm',
  //   component: Layout,
  //   name: 'ULM',
  //   meta: { title: 'ULM', icon: 'nested' },
  //   children: [
  //     {
  //       path: 'jar',
  //       name: 'jarsize',
  //       component: () => import('@/views/jarsize/index'),
  //       meta: { title: 'ULM', icon: 'user' }
  //     },
  //     {
  //       path: 'review',
  //       name: 'review',
  //       component: () => import('@/views/jarsize/reviewlist'),
  //       meta: { title: 'Review', icon: 'user', roles: ['admin'] }
  //     }
  //   ]
  // },
  //
  // {
  //   path: '/ost',
  //   component: Layout,
  //   name: 'Osteology',
  //   meta: { title: 'Osteology', icon: 'user' },
  //   children: [
  //     {
  //       path: 'ost',
  //       name: 'osteology',
  //       component: () => import('@/views/Lot/osteology/index'),
  //       meta: { title: 'Osteology', icon: 'user' }
  //     }
  //     // {
  //     //   path: 'review',
  //     //   name: 'review',
  //     //   component: () => import('@/views/Lot/osteology/reviewlist'),
  //     //   meta: { title: 'Review', icon: 'user', roles:['admin']}
  //     // },
  //   ]
  // },

  {
    path: '/lot',
    component: Layout,
    name: 'Lot',
    meta: { title: 'Lot', icon: 'jar', roles: ['admin'] },
    children: [
      {
        path: 'add',
        name: 'AddLot',
        component: () => import('@/views/lotform/index'),
        meta: { title: 'Add', icon: 'jar' }
      },
      {
        path: 'deaccesion',
        name: 'DeaaccesionALot',
        component: () => import('@/views/Lot/deaccesion'),
        meta: { title: 'Deaccesion', icon: 'jar' }
      },
      {
        path: 'search',
        name: 'SearchLot',
        component: () => import('@/views/Lot/baseSearch/index'),
        meta: { title: 'Search', icon: 'form' },
        children: [
          {
            path: 'basic_search',
            name: 'BaseSearchLot',
            component: () => import('@/views/Lot/baseSearch/index'),
            meta: { title: 'Basic Search', icon: 'form' },
          },
          // {
          //   path: 'adv_search',
          //   name: 'AdvancedSearchLot',
          //   component: () => import('@/views/Lot/LotSearch/index'),
          //   meta: { title: 'Advance Search', icon: 'form' },
          // }
        ]
      }
    ]
  },

  {
    path: '/locality',
    component: Layout,
    name: 'Locality',
    meta: { title: 'Locality', icon: 'locality', roles:['admin'] },
    children: [
      {
        path: 'add',
        name: 'AddLocality',
        component: () => import('@/views/localityform/index'),
        meta: { title: 'Add', icon: 'locality' }
      },
      {
        path: 'search',
        name: 'SearchLocality',
        component: () => import('@/views/Locality/LocalitySearch/Search'),
        meta: { title: 'Search', icon: 'form' }
      }
    ]
  },

  {
    path: '/loan',
    component: Layout,
    name: 'Loan',
    meta: { title: 'Loan', icon: 'loan', roles:['admin'] },
    children: [
      {
        path: 'add',
        name: 'AddLoan',
        component: () => import('@/views/loanform/index'),
        meta: { title: 'Add', icon: 'loan' }
      },
      {
        path: 'search',
        name: 'SearchLoan',
        component: () => import('@/views/Loan/LoanSearch/index'),
        meta: { title: 'Search', icon: 'form' }
      }
    ]
  },
  {
    path: '/taxonomic',
    component: Layout,
    name: 'Taxonomic',
    meta: { title: 'Taxonomic', icon: 'tree', roles:['admin']},
    children: [
      {
        path: 'add',
        name: 'addTaxon',
        component: () => import('@/views/taxonomic/taxonomicform'),
        meta: { title: 'Taxonomic', icon: 'tree' }
      },
      // {
      //   path: 'review',
      //   name: 'review',
      //   component: () => import('@/views/Lot/osteology/reviewlist'),
      //   meta: { title: 'Review', icon: 'user', roles:['admin']}
      // },
    ]
  },
  {
    path: '/Person',
    component: Layout,
    name: 'Person',
    meta: { title: 'Person', icon: 'user', roles:['admin'] },
    children: [
      {
        path: 'add',
        name: 'AddPerson',
        component: () => import('@/views/personform/index'),
        meta: { title: 'Person', icon: 'user' }
      },
      // {
      //   path: 'search',
      //   name: 'SearchPerson',
      //   // component: () => import('@/views/Lot/LotSearch/index'),
      //   meta: { title: 'Search', icon: 'form' }
      // }
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
