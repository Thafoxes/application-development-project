<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import imgLogoUtmReversePutih1 from '@/assets/77ef8f9588a3fa002b1d280d8bcea5ad51e2d03d.png'
import { navigationConfig } from '@/config/navigation'
import mockNotifications from '@/../localData/mock_notifications.json'

const router = useRouter()
const route = useRoute()
const { user, logout } = useAuth()
const showDropdown = ref(false)
const showMobileMenu = ref(false)

// Define activeRole early
const activeRole = computed(() => {
  if (!user.value) return 'student'
  if (Number(user.value.is_coordinator) === 1) return 'coordinator'
  if (Number(user.value.is_supervisor) === 1) return 'supervisor'
  if (Number(user.value.is_examiner) === 1) return 'examiner'
  return 'student'
})

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const showNotifications = ref(false)
const notifications = ref([])
const isLoadingNotifications = ref(false)
const notificationError = ref('')
const isDemoMode = ref(true)
const showSeeAllModal = ref(false)
let notificationTimer = null

const getMockNotifications = (role) => {
  return mockNotifications[role] || mockNotifications.student
}

const unreadCount = computed(() => {
  return notifications.value.filter((item) => !item.isRead).length
})

const latestNotifications = computed(() => {
  return notifications.value.slice(0, 8)
})

const apiRecipientType = computed(() => {
  const role = activeRole.value
  return role.charAt(0).toUpperCase() + role.slice(1)
})

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('en-MY', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
  })
}

const loadNotifications = async () => {
  if (!user.value) return
  notificationError.value = ''

  if (isDemoMode.value) {
    notifications.value = getMockNotifications(activeRole.value)
    return
  }

  try {
    isLoadingNotifications.value = true
    const response = await fetch(
      `${API_BASE_URL}/api/supervisor-matching/notifications?recipientType=${apiRecipientType.value}`
    )
    if (response.status === 404) {
      notifications.value = []
      return
    }
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load notifications.')
    notifications.value = data.notifications || []
  } catch (error) {
    console.warn('Notification load error (silenced):', error)
    notifications.value = []
    notificationError.value = ''
  } finally {
    isLoadingNotifications.value = false
  }
}

const toggleDemoMode = () => {
  isDemoMode.value = !isDemoMode.value
  loadNotifications()
}

const markNotificationAsRead = async (notificationId) => {
  if (!notificationId) return
  
  notifications.value = notifications.value.map((item) => {
    if (item.notification_id === notificationId) {
      return { ...item, isRead: true }
    }
    return item
  })

  if (isDemoMode.value) return

  try {
    await fetch(`${API_BASE_URL}/api/supervisor-matching/notifications/${notificationId}/read`, {
      method: 'PATCH',
    })
  } catch (error) {
    console.error('Mark notification as read error:', error)
  }
}

const markAllAsRead = async () => {
  notifications.value = notifications.value.map(item => ({ ...item, isRead: true }))
  
  if (isDemoMode.value) return
  
  try {
    for (const item of notifications.value) {
      if (!item.isRead) {
        await fetch(`${API_BASE_URL}/api/supervisor-matching/notifications/${item.notification_id}/read`, {
          method: 'PATCH',
        })
      }
    }
  } catch (error) {
    console.error('Error marking all as read:', error)
  }
}

const clearAllNotifications = () => {
  notifications.value = []
}

const openNotification = async (item) => {
  await markNotificationAsRead(item.notification_id)
  showNotifications.value = false
  showSeeAllModal.value = false

  if (activeRole.value === 'coordinator') {
    router.push({
      path: '/manage-fyp',
      query: { tab: 'records', projectId: item.project_id || '' },
    })
  } else {
    router.push('/dashboard')
  }
}

const toggleNotifications = async () => {
  showNotifications.value = !showNotifications.value
  showDropdown.value = false
  if (showNotifications.value) {
    await loadNotifications()
  }
}

const toggleUserDropdown = () => {
  showDropdown.value = !showDropdown.value
  showNotifications.value = false
}

const handleClickOutside = (event) => {
  const target = event.target
  if (!target.closest?.('.header-notification-area')) {
    showNotifications.value = false
  }
  if (!target.closest?.('.header-user-area')) {
    showDropdown.value = false
  }
}

const goToManageFYP = () => {
  showNotifications.value = false
  router.push({ path: '/manage-fyp', query: { tab: 'records' } })
}

onMounted(() => {
  if (user.value) {
    loadNotifications()
    notificationTimer = setInterval(loadNotifications, 30000)
  }
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  if (notificationTimer) clearInterval(notificationTimer)
  document.removeEventListener('click', handleClickOutside)
})

const handleLogout = () => {
  logout()
  showDropdown.value = false
  showMobileMenu.value = false
  showNotifications.value = false
  router.push('/')
}

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const handleMobileNavigate = (path) => {
  showMobileMenu.value = false
  if (path && path !== '#') {
    router.push(path)
  }
}

// Navigation links config
const menuItems = computed(() => {
  return navigationConfig[activeRole.value] || navigationConfig.student
})
</script>

<template>
  <div
    class="bg-utm-dark-maroon w-full h-[70px] px-[20px] py-[8px] flex items-center justify-between shrink-0 shadow-sm relative z-50 animate-fade-in"
  >
    <!-- Left side -->
    <div class="flex items-center gap-[10px] shrink-0">
      <!-- Hamburger Toggle Button (Mobile Only) -->
      <button
        v-if="user"
        @click="showMobileMenu = !showMobileMenu"
        class="block lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors mr-1 focus:outline-none"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            v-if="!showMobileMenu"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
          <path
            v-else
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>

      <router-link
        :to="user ? '/dashboard' : '/'"
        class="flex items-center hover:opacity-90 transition-opacity no-underline"
      >
        <div
          class="h-[32px] lg:h-[45px] overflow-clip relative shrink-0 w-[95px] lg:w-[133px] flex items-center"
        >
          <img
            :src="imgLogoUtmReversePutih1"
            alt="UTM Logo"
            class="max-h-full max-w-full object-contain pointer-events-none"
          />
        </div>
        <!-- Vertical Line Separator -->
        <div class="h-[30px] lg:h-[40px] w-px bg-white/40 shrink-0 mx-2"></div>
        <p
          class="capitalize font-bold text-[20px] lg:text-[28px] text-white whitespace-nowrap tracking-wide leading-none pt-0.5 font-['Inter']"
        >
          I-FAMOUS
        </p>
      </router-link>
    </div>

    <!-- Right side (Authenticated) -->
    <div v-if="user" class="flex items-center gap-[15px] shrink-0 relative">
      <!-- Notifications Icon & Dropdown -->
      <div class="relative header-notification-area">
        <button 
          @click.stop="toggleNotifications"
          class="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8 lg:h-6 lg:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span
            v-if="unreadCount > 0"
            class="absolute top-1 right-1 lg:top-0 lg:right-0 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border border-[#800000] flex items-center justify-center"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </button>

        <!-- Notification Dropdown -->
        <div
          v-if="showNotifications"
          class="absolute right-0 mt-2 w-[350px] lg:w-[380px] max-w-[90vw] bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden z-[9999]"
        >
          <div class="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div>
              <p class="font-bold text-sm text-gray-800 capitalize">{{ activeRole }} Notifications</p>
              <p class="text-xs text-gray-500">
                {{ unreadCount }} unread notification(s)
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click.stop="toggleDemoMode"
                :class="[
                  'text-[10px] lg:text-xs font-semibold px-2 py-1 rounded transition-colors border-none cursor-pointer',
                  isDemoMode ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                ]"
              >
                {{ isDemoMode ? 'Demo ON' : 'Load Demo' }}
              </button>
              <button
                @click.stop="loadNotifications"
                class="text-gray-500 hover:text-gray-800 text-[10px] lg:text-xs font-semibold px-2 py-1 rounded hover:bg-gray-200 transition-colors border-none cursor-pointer"
              >
                Refresh
              </button>
            </div>
          </div>

          <div v-if="isLoadingNotifications" class="p-6 text-center text-sm text-gray-600">
            Loading notifications...
          </div>

          <div v-else-if="notificationError" class="p-5 bg-red-50 text-red-700 text-sm">
            {{ notificationError }}
          </div>

          <div v-else-if="latestNotifications.length === 0" class="p-6 text-center">
            <p class="font-bold text-gray-700">No new notifications</p>
            <p class="text-xs text-gray-500 mt-1">
              You're all caught up.
            </p>
          </div>

          <div v-else class="max-h-[300px] overflow-y-auto">
            <button
              v-for="item in latestNotifications"
              :key="item.notification_id"
              @click="openNotification(item)"
              class="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors block border-none cursor-pointer"
            >
              <div class="flex gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <p class="font-semibold text-sm text-gray-800 line-clamp-1">
                      {{ item.title }}
                    </p>
                    <span v-if="!item.isRead" class="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5"></span>
                  </div>
                  <p class="text-[10px] text-gray-400 mt-0.5">
                    {{ formatTime(item.createdAt) }}
                  </p>
                  <p class="text-xs text-gray-600 mt-1.5 leading-relaxed line-clamp-2">
                    {{ item.message }}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <!-- Bottom Action buttons -->
          <div class="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
            <button
              @click.stop="openSeeAll"
              class="flex-1 bg-gray-200 text-gray-800 px-3 py-2 rounded-md text-xs font-bold hover:bg-gray-300 transition-colors text-center border-none cursor-pointer"
            >
              See All
            </button>
            <button
              v-if="activeRole === 'coordinator'"
              @click="goToManageFYP"
              class="flex-1 bg-[#5c001f] text-white px-3 py-2 rounded-md text-xs font-bold hover:bg-opacity-90 transition-opacity text-center border-none cursor-pointer"
            >
              Manage FYP
            </button>
          </div>
        </div>
      </div>

      <!-- User Profile Dropdown -->
      <div class="hidden lg:block relative header-user-area">
        <button
          @click.stop="toggleUserDropdown"
          class="bg-[rgba(255,255,255,0.5)] flex items-center justify-center gap-[12px] lg:gap-[8px] px-[12px] py-[8px] lg:py-[4px] lg:px-[10px] rounded-[15px] hover:bg-white/60 transition-colors"
        >
          <div
            class="w-[35px] h-[35px] lg:w-[28px] lg:h-[28px] rounded-full bg-[#5c001f] flex items-center justify-center text-white font-bold text-lg lg:text-sm"
          >
            {{ user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <p
            class="capitalize font-bold text-[24px] lg:text-[16px] text-white whitespace-nowrap font-['Inter']"
          >
            {{ user.full_name || 'Username' }}
          </p>
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showDropdown"
          class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
        >
          <div class="px-4 py-2 text-sm text-gray-500 border-b border-gray-100 font-medium">
            {{ user.email }}
          </div>
          <button
            @click="handleLogout"
            class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Dropdown Navigation Menu Overlay -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform -translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-4 opacity-0"
    >
      <div
        v-if="showMobileMenu && user"
        class="absolute top-[70px] left-0 right-0 bg-white border-b border-gray-200 shadow-xl z-50 p-4 flex flex-col space-y-1 lg:hidden"
      >
        <div class="px-4 py-2 border-b border-gray-150 mb-2 flex items-center space-x-3">
          <div
            class="w-8 h-8 rounded-full bg-[#5c001f] flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm"
          >
            {{ user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div>
            <p class="text-xs font-bold text-gray-900 capitalize">
              {{ user.full_name || 'Username' }}
            </p>
            <p class="text-[10px] text-gray-400 font-semibold">{{ user.email }}</p>
          </div>
        </div>

        <button
          v-for="item in menuItems"
          :key="item.name"
          @click="handleMobileNavigate(item.path)"
          :class="[
            'w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 outline-none border-none text-left',
            isActive(item.path)
              ? 'bg-[#5c001f] text-white shadow'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 bg-transparent',
          ]"
        >
          <!-- Icon rendering -->
          <span class="mr-3.5 flex-shrink-0">
            <svg
              v-if="item.icon === 'dashboard'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
              ></path>
            </svg>
            <svg
              v-else-if="item.icon === 'sessions'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path>
            </svg>
            <svg
              v-else-if="item.icon === 'calendar'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            <svg
              v-else-if="item.icon === 'timetable'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <svg
              v-else-if="item.icon === 'users'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            <svg
              v-else-if="item.icon === 'import'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              ></path>
            </svg>
            <svg
              v-else-if="item.icon === 'document'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            <svg
              v-else-if="item.icon === 'logbook'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              ></path>
            </svg>
          </span>
          <span>{{ item.name }}</span>
        </button>

        <!-- Logout Action Button in Mobile Menu Overlay -->
        <div class="border-t border-gray-150 my-2 pt-2 shrink-0">
          <button
            @click="handleLogout"
            class="w-full flex items-center px-4 py-3 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-all duration-200 outline-none border-none text-left bg-transparent"
          >
            <span class="mr-3.5 flex-shrink-0 text-red-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                ></path>
              </svg>
            </span>
            <span class="text-red-600 font-bold">Logout</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- See All Notifications Modal -->
    <div
      v-if="showSeeAllModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm"
      @click.self="showSeeAllModal = false"
    >
      <div
        class="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 transform scale-100 transition-all text-left"
      >
        <!-- Modal Header -->
        <div class="bg-[#5c001f] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-lg text-white">All Notifications ({{ activeRole }} View)</h3>
            <p class="text-xs text-white/80 font-medium mt-0.5">
              {{ isDemoMode ? 'Showing demonstration mock notifications' : 'Real-time notifications from server' }}
            </p>
          </div>
          <button
            @click="showSeeAllModal = false"
            class="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 border-none cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Actions Bar -->
        <div class="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div class="text-xs text-gray-500 font-bold">
            Total: {{ notifications.length }} notifications | {{ unreadCount }} unread
          </div>
          <div class="flex items-center gap-3">
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="text-xs text-[#5c001f] hover:underline font-bold bg-transparent border-none cursor-pointer"
            >
              Mark all as read
            </button>
            <button
              @click="clearAllNotifications"
              class="text-xs text-red-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
            >
              Clear all
            </button>
          </div>
        </div>

        <!-- Modal Body (Notifications List) -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <div v-if="notifications.length === 0" class="text-center py-12">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p class="font-bold text-gray-700 text-lg">No notifications found</p>
            <p class="text-sm text-gray-500 mt-1">There are no notifications to display at this time.</p>
            <button
              v-if="!isDemoMode"
              @click="toggleDemoMode"
              class="mt-4 bg-[#5c001f] text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-opacity-90 transition-opacity border-none cursor-pointer"
            >
              Load Demo Notifications
            </button>
          </div>

          <div
            v-else
            v-for="item in notifications"
            :key="item.notification_id"
            :class="[
              'p-4 rounded-lg border transition-all flex gap-4 text-left',
              item.isRead ? 'bg-white border-gray-200' : 'bg-[#5c001f]/5 border-[#5c001f]/20 shadow-sm'
            ]"
          >
            <!-- Unread Status Dot -->
            <div class="flex-shrink-0 pt-1">
              <span
                :class="[
                  'block w-3 h-3 rounded-full',
                  item.isRead ? 'bg-gray-300' : 'bg-red-500'
                ]"
              ></span>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                <h4 class="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                  {{ item.title }}
                </h4>
                <span class="text-xs text-gray-400 font-semibold whitespace-nowrap">
                  {{ formatTime(item.createdAt) }}
                </span>
              </div>
              <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {{ item.message }}
              </p>
              
              <div class="mt-3 flex items-center gap-3">
                <button
                  v-if="!item.isRead"
                  @click="markNotificationAsRead(item.notification_id)"
                  class="text-[11px] font-bold text-[#5c001f] hover:underline bg-transparent border-none cursor-pointer"
                >
                  Mark as read
                </button>
                <button
                  @click="openNotification(item)"
                  class="text-[11px] font-bold text-gray-500 hover:text-gray-800 hover:underline bg-transparent border-none cursor-pointer"
                >
                  View details &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            @click="showSeeAllModal = false"
            class="bg-gray-200 text-gray-800 px-5 py-2 rounded-md text-sm font-bold hover:bg-gray-300 transition-colors border-none cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
