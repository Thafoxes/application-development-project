<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import axios from 'axios'
import AIAssistantWidget from './components/AIAssistantWidget.vue'

const router = useRouter()
const { token, logout } = useAuth()

let idleTimeoutId = null
const IDLE_TIME_LIMIT = 15 * 60 * 1000 // 15 minutes in milliseconds

const handleLogoutOnIdle = () => {
  if (token.value) {
    logout()
    alert("You have been logged out due to 15 minutes of inactivity.")
    router.push('/')
  }
}

const resetIdleTimer = () => {
  if (idleTimeoutId) {
    clearTimeout(idleTimeoutId)
  }
  if (token.value) {
    idleTimeoutId = setTimeout(handleLogoutOnIdle, IDLE_TIME_LIMIT)
  }
}

const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart']

onMounted(async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await axios.get(`${apiUrl}/api/status`)
    if (response.data && response.data.message === 'connected') {
      console.log('connected')
    }
  } catch (error) {
    console.error('Failed to connect to backend:', error)
  }

  // Start idle tracker on load
  resetIdleTimer()

  // Add event listeners to register user interactions
  activityEvents.forEach((event) => {
    window.addEventListener(event, resetIdleTimer, { passive: true })
  })
})

onUnmounted(() => {
  if (idleTimeoutId) {
    clearTimeout(idleTimeoutId)
  }
  activityEvents.forEach((event) => {
    window.removeEventListener(event, resetIdleTimer)
  })
})
</script>

<template>
  <router-view />
  <!-- Float the AI Assistant at the bottom right -->
  <AIAssistantWidget />
</template>
