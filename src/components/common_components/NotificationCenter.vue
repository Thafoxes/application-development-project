<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import mockNotifications from '@/../localData/mock_notifications.json'

const router = useRouter()
const { user, activeRole } = useAuth()

const showNotifications = ref(false)
const notifications = ref([])
const isLoadingNotifications = ref(false)
const notificationError = ref('')
const isDemoMode = ref(true)
const showSeeAllModal = ref(false)
let notificationTimer = null

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

const getMockNotifications = (role) => {
  return mockNotifications[role] || mockNotifications.student
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
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
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
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
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
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
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
  if (showNotifications.value) {
    await loadNotifications()
  }
}

const handleClickOutside = (event) => {
  const target = event.target
  if (!target.closest('.header-notification-area')) {
    showNotifications.value = false
  }
}

const goToManageFYP = () => {
  showNotifications.value = false
  router.push({ path: '/manage-fyp', query: { tab: 'records' } })
}

const openSeeAll = () => {
  showNotifications.value = false
  showSeeAllModal.value = true
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
</script>

<template>
  <div class="relative header-notification-area">
    <button 
      @click.stop="toggleNotifications"
      class="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors border-none bg-transparent cursor-pointer outline-none"
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
          class="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors block border-none cursor-pointer bg-transparent"
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
                  item.isRead ? 'bg-gray-300' : 'bg-[#5c001f]'
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
