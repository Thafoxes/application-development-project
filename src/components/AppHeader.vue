<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import imgLogoUtmReversePutih1 from '@/assets/77ef8f9588a3fa002b1d280d8bcea5ad51e2d03d.png'
import { formatMalaysiaDateTime } from '@/utils/dateTime'

const router = useRouter()
const { user, logout } = useAuth()

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const showDropdown = ref(false)
const showNotifications = ref(false)
const showMobileMenu = ref(false)
const notifications = ref([])
const isLoadingNotifications = ref(false)
const notificationError = ref('')

const currentUser = computed(() => {
  return user?.value || user || {}
})

const notificationRoles = computed(() => {
  const u = currentUser.value
  const roles = []

  if (u.is_coordinator || u.role_info?.is_coordinator) {
    roles.push('Coordinator')
  }

  if (u.is_supervisor || u.role_info?.is_supervisor) {
    roles.push('Supervisor')
  }

  if (u.is_examiner || u.role_info?.is_examiner) {
    roles.push('Examiner')
  }

  if (u.is_student || u.role_info?.is_student) {
    roles.push('Student')
  }

  if (roles.length === 0) {
    roles.push('Coordinator')
  }

  return roles
})

const notificationTitle = computed(() => {
  if (notificationRoles.value.length > 1) {
    return 'My Notifications'
  }

  return `${notificationRoles.value[0]} Notifications`
})

const unreadCount = computed(() => {
  return notifications.value.filter((item) => !item.isRead).length
})

const latestNotifications = computed(() => {
  return notifications.value.slice(0, 8)
})

const dashboardPath = computed(() => {
  const u = currentUser.value
  const roles = notificationRoles.value

  if (u.is_admin || u.role_info?.is_admin) {
    return '/admin-dashboard'
  }

  if (roles.includes('Student') && !roles.includes('Coordinator') && !roles.includes('Supervisor') && !roles.includes('Examiner')) {
    return '/student-dashboard'
  }

  if ((roles.includes('Supervisor') || roles.includes('Examiner')) && !roles.includes('Coordinator')) {
    return '/supervisor-dashboard'
  }

  return '/dashboard'
})

const roleHomePath = computed(() => {
  const roles = notificationRoles.value

  if (roles.includes('Student') && !roles.includes('Coordinator') && !roles.includes('Supervisor') && !roles.includes('Examiner')) {
    return '/student-fyp'
  }

  if (roles.includes('Examiner') && !roles.includes('Supervisor') && !roles.includes('Coordinator')) {
    return '/examiner-projects'
  }

  if (roles.includes('Supervisor') && !roles.includes('Coordinator')) {
    return '/supervisor-projects'
  }

  return '/manage-fyp'
})

const goToDashboard = () => {
  showMobileMenu.value = false
  router.push(dashboardPath.value)
}

const getNotificationTarget = (item) => {
  const type = String(item?.recipientType || '').toLowerCase()
  const projectId = item?.project_id || ''

  if (type === 'student') {
    const isResult = /result released|grade released/i.test(String(item?.title || ''))
    return {
      path: '/student-project-details',
      query: projectId ? { projectId, ...(isResult ? { tab: 'result' } : {}) } : {},
    }
  }

  if (type === 'supervisor') {
    return {
      path: '/supervisor-review',
      query: projectId ? { projectId } : {},
    }
  }

  if (type === 'coordinator') {
    return {
      path: '/manage-fyp',
      query: { tab: 'records', ...(projectId ? { projectId } : {}) },
    }
  }

  if (type === 'examiner') {
    return {
      path: '/examiner-review',
      query: projectId ? { projectId } : {},
    }
  }

  return { path: roleHomePath.value }
}

const notificationOpenLabel = computed(() => {
  const roles = notificationRoles.value

  if (roles.includes('Student') && !roles.includes('Coordinator') && !roles.includes('Supervisor') && !roles.includes('Examiner')) {
    return 'Open My FYP'
  }

  if (roles.includes('Supervisor') && !roles.includes('Coordinator')) {
    return 'Open Assigned Projects'
  }

  return 'Open Manage FYP'
})

const loadNotifications = async () => {
  notificationError.value = ''

  try {
    isLoadingNotifications.value = true

    const u = currentUser.value
    const roles = notificationRoles.value.join(',')
    const email = u.email || ''

    const query = new URLSearchParams({
      roles,
      email,
    })

    const response = await fetch(
      `${API_BASE_URL}/api/supervisor-matching/notifications?${query.toString()}`
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to load notifications.')
    }

    notifications.value = data.notifications || []
  } catch (error) {
    console.error('Notification load error:', error)
    notificationError.value = error.message || 'Failed to load notifications.'
  } finally {
    isLoadingNotifications.value = false
  }
}

const markNotificationAsRead = async (notificationId) => {
  if (!notificationId) return

  try {
    await fetch(
      `${API_BASE_URL}/api/supervisor-matching/notifications/${notificationId}/read`,
      {
        method: 'PATCH',
      }
    )

    notifications.value = notifications.value.map((item) => {
      if (item.notification_id === notificationId) {
        return {
          ...item,
          isRead: true,
        }
      }

      return item
    })
  } catch (error) {
    console.error('Mark notification as read error:', error)
  }
}

const openNotification = async (item) => {
  await markNotificationAsRead(item.notification_id)

  showNotifications.value = false
  showMobileMenu.value = false
  router.push(getNotificationTarget(item))
}

const toggleNotifications = async () => {
  showNotifications.value = !showNotifications.value
  showDropdown.value = false
  showMobileMenu.value = false

  if (showNotifications.value) {
    await loadNotifications()
  }
}

const toggleUserDropdown = () => {
  showDropdown.value = !showDropdown.value
  showNotifications.value = false
  showMobileMenu.value = false
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  showNotifications.value = false
  showDropdown.value = false
}

const goToProfile = () => {
  showDropdown.value = false
  showNotifications.value = false
  showMobileMenu.value = false
  router.push('/profile')
}

const handleLogout = () => {
  logout()
  showDropdown.value = false
  showNotifications.value = false
  showMobileMenu.value = false
  router.push('/')
}

const goToManageFYP = () => {
  showNotifications.value = false
  showMobileMenu.value = false
  router.push({ path: roleHomePath.value })
}

const handleClickOutside = (event) => {
  const target = event.target

  if (!target.closest?.('.header-notification-area')) {
    showNotifications.value = false
  }

  if (!target.closest?.('.header-user-area')) {
    showDropdown.value = false
  }

  if (!target.closest?.('.header-mobile-menu-area')) {
    showMobileMenu.value = false
  }
}

let notificationTimer = null

onMounted(() => {
  loadNotifications()
  notificationTimer = setInterval(loadNotifications, 30000)
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  if (notificationTimer) {
    clearInterval(notificationTimer)
  }

  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header
    class="bg-[#5C001F] w-full min-h-[64px] lg:h-[70px] px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between shrink-0 shadow-md relative z-50 select-none"
  >
    <!-- Left side: Brand logo & title -->
    <div
      class="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer hover:opacity-95 transition-opacity"
      @click="goToDashboard"
      title="Go to Dashboard"
    >
      <div class="h-8 sm:h-10 lg:h-[45px] flex items-center shrink-0 max-w-[120px] sm:max-w-[150px] lg:max-w-[180px]">
        <img
          :src="imgLogoUtmReversePutih1"
          alt="UTM Logo"
          class="max-h-full w-auto object-contain pointer-events-none"
        />
      </div>

      <div class="h-6 sm:h-8 lg:h-[40px] w-px bg-white/40 shrink-0 mx-1 sm:mx-2"></div>

      <p
        class="capitalize font-bold text-lg sm:text-2xl lg:text-[28px] text-white whitespace-nowrap tracking-wide leading-none font-['Inter']"
      >
        I-FAMOUS
      </p>
    </div>

    <!-- Right side: Notifications, Desktop Profile & Mobile Hamburger Menu -->
    <div v-if="user" class="flex items-center gap-2 sm:gap-4 shrink-0 relative">
      <!-- Notifications Button & Dropdown -->
      <div class="relative header-notification-area">
        <button
          @click.stop="toggleNotifications"
          class="relative p-2 text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-colors cursor-pointer"
          title="Notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 sm:h-7 sm:w-7"
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
            class="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#5c001f] flex items-center justify-center shadow-sm"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </button>

        <!-- Notification Dropdown -->
        <div
          v-if="showNotifications"
          class="absolute right-0 mt-3 w-[360px] sm:w-[420px] max-w-[calc(100vw-1.5rem)] bg-white rounded-[20px] shadow-2xl border border-gray-200 overflow-hidden z-[9999]"
        >
          <div class="bg-[#5c001f] text-white px-5 py-4 flex items-center justify-between">
            <div>
              <p class="font-bold text-base sm:text-lg">{{ notificationTitle }}</p>
              <p class="text-xs text-white/80">
                {{ unreadCount }} unread notification(s)
              </p>
            </div>

            <button
              @click.stop="loadNotifications"
              class="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>

          <div v-if="isLoadingNotifications" class="p-6 text-center text-sm font-medium text-gray-600">
            Loading notifications...
          </div>

          <div v-else-if="notificationError" class="p-5 bg-red-50 text-red-700 text-sm font-medium">
            {{ notificationError }}
          </div>

          <div v-else-if="latestNotifications.length === 0" class="p-6 text-center">
            <p class="font-bold text-gray-800">No notifications yet</p>
            <p class="text-xs sm:text-sm text-gray-500 mt-1">
              Coordinator and supervisor assignment records will appear here.
            </p>
          </div>

          <div v-else class="max-h-[380px] overflow-y-auto">
            <button
              v-for="item in latestNotifications"
              :key="item.notification_id"
              @click="openNotification(item)"
              class="w-full text-left px-4 sm:px-5 py-3.5 border-b border-gray-100 hover:bg-amber-50/60 transition-colors cursor-pointer"
            >
              <div class="flex gap-3">
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-[#5c001f]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
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
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <p class="font-bold text-xs sm:text-sm text-[#5c001f] truncate">
                      {{ item.title }}
                    </p>

                    <span
                      v-if="!item.isRead"
                      class="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-1"
                    ></span>
                  </div>

                  <p class="text-[11px] text-gray-500 mt-0.5">
                    {{ item.recipientType }} · {{ formatMalaysiaDateTime(item.createdAt) }}
                  </p>

                  <p class="text-xs text-gray-700 mt-1.5 leading-relaxed line-clamp-2">
                    {{ item.message }}
                  </p>

                  <p class="text-[11px] text-[#5c001f] font-bold mt-1.5">
                    Click to open related project →
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div class="p-3.5 bg-slate-50 border-t border-slate-100">
            <button
              @click="goToManageFYP"
              class="w-full bg-[#5c001f] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#470018] active:scale-[0.99] transition-all text-xs sm:text-sm cursor-pointer"
            >
              {{ notificationOpenLabel }}
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop User Profile Button & Dropdown (hidden on small screens) -->
      <div class="relative header-user-area hidden md:block">
        <button
          @click.stop="toggleUserDropdown"
          class="bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-white/20"
        >
          <div
            class="w-7 h-7 rounded-full bg-white text-[#5c001f] flex items-center justify-center font-bold text-xs shadow-sm"
          >
            {{ user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U' }}
          </div>

          <p class="capitalize font-bold text-sm text-white whitespace-nowrap font-['Inter']">
            {{ user.full_name || 'User' }}
          </p>

          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          v-if="showDropdown"
          class="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200"
        >
          <div class="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 truncate font-medium">
            {{ user.email }}
          </div>

          <button
            @click="goToDashboard"
            class="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-800 hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer"
          >
            <span>📊</span> Dashboard
          </button>

          <button
            @click="goToProfile"
            class="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#5c001f] hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer"
          >
            <span>👤</span> Edit Profile
          </button>

          <button
            @click="handleLogout"
            class="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 font-semibold border-t border-gray-100 flex items-center gap-2 cursor-pointer"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      <!-- Mobile & Tablet Hamburger Toggle Button -->
      <div class="relative header-mobile-menu-area md:hidden">
        <button
          @click.stop="toggleMobileMenu"
          class="p-2 text-white hover:bg-white/10 active:bg-white/20 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
          title="Mobile Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <svg v-if="!showMobileMenu" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Mobile & Tablet Drawer Menu -->
        <div
          v-if="showMobileMenu"
          class="absolute right-0 mt-3 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl py-3 border border-gray-200 z-[9999] space-y-1"
        >
          <div class="px-4 py-2.5 bg-[#5c001f] text-white rounded-t-xl -mt-3 mb-2 flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-white text-[#5c001f] font-bold flex items-center justify-center text-sm shrink-0">
              {{ user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U' }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-bold text-sm text-white truncate">{{ user.full_name || 'User' }}</p>
              <p class="text-[11px] text-white/80 truncate">{{ user.email }}</p>
            </div>
          </div>

          <button
            @click="goToDashboard"
            class="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-100 font-semibold flex items-center gap-2.5 cursor-pointer"
          >
            <span class="text-base">📊</span> Dashboard
          </button>

          <button
            @click="goToManageFYP"
            class="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-100 font-semibold flex items-center gap-2.5 cursor-pointer"
          >
            <span class="text-base">📁</span> {{ notificationOpenLabel }}
          </button>

          <button
            @click="goToProfile"
            class="w-full text-left px-4 py-2.5 text-sm text-[#5c001f] hover:bg-amber-50 font-semibold flex items-center gap-2.5 cursor-pointer"
          >
            <span class="text-base">👤</span> Edit Profile
          </button>

          <div class="pt-2 border-t border-slate-100 px-3">
            <button
              @click="handleLogout"
              class="w-full bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
