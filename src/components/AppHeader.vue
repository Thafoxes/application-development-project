<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import imgLogoUtmReversePutih1 from '@/assets/77ef8f9588a3fa002b1d280d8bcea5ad51e2d03d.png'

const router = useRouter()
const { user, logout } = useAuth()
const showDropdown = ref(false)

const handleLogout = () => {
  logout()
  showDropdown.value = false
  router.push('/')
}
</script>

<template>
  <div
    class="bg-[#5C001F] w-full h-[100px] px-[20px] py-[8px] flex items-center justify-between shrink-0 shadow-sm relative z-50"
  >
    <!-- Left side -->
    <div class="flex items-center gap-[15px] shrink-0">
      <div class="h-[71.186px] overflow-clip relative shrink-0 w-[210px]">
        <img
          :src="imgLogoUtmReversePutih1"
          alt="UTM Logo"
          class="max-h-full max-w-full object-contain pointer-events-none"
        />
      </div>
      <!-- Vertical Line Separator -->
      <div class="h-[70px] w-px bg-white/40 shrink-0 mx-2"></div>
      <p
        class="capitalize font-bold text-[48px] text-white whitespace-nowrap tracking-wide leading-none pt-0.5 font-['Inter']"
      >
        I-FAMOUS
      </p>
    </div>

    <!-- Right side (Authenticated) -->
    <div v-if="user" class="flex items-center gap-[15px] shrink-0 relative">
      <!-- Notifications Icon -->
      <button class="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span class="absolute top-1 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-[#800000]"></span>
      </button>

      <!-- User Profile Dropdown -->
      <div class="relative">
        <button 
          @click="showDropdown = !showDropdown"
          class="bg-[rgba(255,255,255,0.5)] flex items-center justify-center gap-[12px] px-[12px] py-[8px] rounded-[15px] hover:bg-white/60 transition-colors"
        >
          <div class="w-[35px] h-[35px] rounded-full bg-[#5c001f] flex items-center justify-center text-white font-bold text-lg">
            {{ user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <p class="capitalize font-bold text-[24px] text-white whitespace-nowrap font-['Inter']">
            {{ user.full_name || 'Username' }}
          </p>
        </button>

        <!-- Dropdown Menu -->
        <div 
          v-if="showDropdown" 
          class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
        >
          <div class="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
            {{ user.email }}
          </div>
          <button 
            @click="handleLogout" 
            class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
