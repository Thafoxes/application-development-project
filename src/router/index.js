import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import CalendarView from '../views/CalendarView.vue'
import SignupView from '../views/SignupView.vue'

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
    }
  ],
})

export default router
