<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import imgLogoUtmReversePutih1 from '@/assets/77ef8f9588a3fa002b1d280d8bcea5ad51e2d03d.png'
import { navigationConfig } from '@/config/navigation'
import NotificationCenter from './NotificationCenter.vue'

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

const toggleUserDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const handleClickOutside = (event) => {
  const target = event.target
  if (!target.closest?.('.header-user-area')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleLogout = () => {
  logout()
  showDropdown.value = false
  showMobileMenu.value = false
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
      <!-- Extracted Notifications Component -->
      <NotificationCenter />

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


  </div>
</template>
