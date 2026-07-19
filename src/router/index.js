import { createRouter, createWebHistory } from 'vue-router'

// Sub-paths that dynamically resolve to the main workspace container
const workspaceDashboardPaths = [
  '/student/dashboard', '/student/proposal', '/student/logbook',
  '/supervisor/dashboard', '/supervisor/students', '/supervisor/logs',
  '/examiner/dashboard', '/examiner/projects', '/examiner/evaluations', '/examiner/slots'
]

// Sub-paths that resolve to the calendar view
const workspaceCalendarPaths = [
  '/student/schedule', '/supervisor/schedule'
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/auth/SignupView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/coordinator/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/manage-session',
      name: 'manage-session',
      component: () => import('../views/coordinator/ManageSessionView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('../views/coordinator/CalendarView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/add-time-table',
      name: 'add-time-table',
      component: () => import('../views/coordinator/ManageTimeTableView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/create-meeting',
      name: 'create-meeting',
      component: () => import('../views/coordinator/CreateMeetingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/edit-time-table',
      name: 'edit-time-table',
      component: () => import('../views/coordinator/EditTimeTableView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/manage-user',
      name: 'manage-user',
      component: () => import('../views/coordinator/ManageUserView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/manage-user/:id',
      name: 'view-user',
      component: () => import('../views/coordinator/ViewUserView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/import-users',
      name: 'import-users',
      component: () => import('../views/coordinator/UserBulkDataImportView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/manage-fyp',
      name: 'manage-fyp',
      component: () => import('../views/coordinator/fyp_module/ManageFYPProposalsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/manage-fyp/:id',
      name: 'view-fyp-proposal',
      component: () => import('../views/coordinator/fyp_module/ViewFYPProposalView.vue'),
      meta: { requiresAuth: true },
    },
    // Programmatically map other workspace views
    ...workspaceDashboardPaths.map(path => ({
      path,
      component: () => import('../views/coordinator/DashboardView.vue'),
      meta: { requiresAuth: true }
    })),
    ...workspaceCalendarPaths.map(path => ({
      path,
      component: () => import('../views/coordinator/CalendarView.vue'),
      meta: { requiresAuth: true }
    }))
  ],
})

import { isTokenExpired } from '@/utils/authHelper'

// Route Guard for Authentication
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!localStorage.getItem('userSession')

  // Check if session has expired actively
  if (isAuthenticated && isTokenExpired(token)) {
    localStorage.removeItem('userSession')
    localStorage.removeItem('token')
    alert("Your session has expired. Please sign in again.")
    return next({ name: 'login' })
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    // If the route requires auth and user is not logged in, redirect to login
    next({ name: 'login' })
  } else if (to.name === 'login' && isAuthenticated) {
    // If the user is already logged in and tries to access login page, redirect to dashboard
    next({ name: 'dashboard' })
  } else {
    // Proceed normally
    next()
  }
})

export default router
