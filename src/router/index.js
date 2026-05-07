import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import CalendarView from '../views/CalendarView.vue'
import SignupView from '../views/SignupView.vue'
import DashboardView from '../views/DashboardView.vue'
import ManageSessionView from '../views/ManageSessionView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/signup',
      name: 'signup',
      component: SignupView
    },
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: CalendarView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/manage-session',
      name: 'manage-session',
      component: ManageSessionView,
      meta: { requiresAuth: true }
    }
  ],
})

// Route Guard for Authentication
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('userSession')

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
