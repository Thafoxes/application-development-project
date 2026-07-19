<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

import { navigationConfig } from '@/config/navigation'

const props = defineProps({
  role: {
    type: String,
    default: null,
  },
})

const router = useRouter()
const route = useRoute()
const { user, activeRole, switchRole } = useAuth()

// Determine all roles the user is authorized for
const availableRoles = computed(() => {
  const roles = []
  if (!user.value) return roles
  if (Number(user.value.is_coordinator) === 1) roles.push({ id: 'coordinator', name: 'Coordinator' })
  if (Number(user.value.is_supervisor) === 1) roles.push({ id: 'supervisor', name: 'Supervisor' })
  if (Number(user.value.is_examiner) === 1) roles.push({ id: 'examiner', name: 'Examiner' })
  if (Number(user.value.is_student) === 1) roles.push({ id: 'student', name: 'Student' })
  return roles
})

const selectedRoleVal = ref(activeRole.value)

// Keep selectedRoleVal in sync with activeRole global state
watch(activeRole, (newRole) => {
  selectedRoleVal.value = newRole
})

const handleRoleChange = () => {
  switchRole(selectedRoleVal.value)
  // Redirect to dashboard on workspace switch to avoid rendering mismatch pages
  router.push('/dashboard')
}

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// Sidebar links configuration per role
const menuItems = computed(() => {
  const roleKey = props.role || activeRole.value
  return navigationConfig[roleKey] || navigationConfig.student
})
</script>

<template>
  <aside
    class="hidden lg:flex w-[280px] bg-white shrink-0 flex-col py-6 border-r border-gray-200 shadow-sm"
  >
    <!-- Workspace Selector (if user has multiple roles) -->
    <div v-if="availableRoles.length > 1" class="px-4 mb-6 pb-6 border-b border-gray-150">
      <label class="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">
        Active Workspace
      </label>
      <div class="relative">
        <select
          v-model="selectedRoleVal"
          @change="handleRoleChange"
          class="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-250 rounded-lg text-sm font-bold text-gray-800 hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] transition-all cursor-pointer appearance-none"
        >
          <option v-for="role in availableRoles" :key="role.id" :value="role.id">
            {{ role.name }} View
          </option>
        </select>
        <!-- Custom Dropdown Arrow -->
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Nav List -->
    <nav class="flex-1 px-4 space-y-1">
      <button
        v-for="item in menuItems"
        :key="item.name"
        @click="item.path !== '#' ? router.push(item.path) : null"
        :class="[
          'w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 outline-none',
          isActive(item.path)
            ? 'bg-[#5c001f] text-white shadow'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        ]"
      >
        <!-- Icon rendering -->
        <span class="mr-3.5 flex-shrink-0">
          <!-- Dashboard Icon -->
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
          <!-- Sessions Icon -->
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
          <!-- Calendar Icon -->
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
          <!-- Timetable Icon -->
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
          <!-- Users Icon -->
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
          <!-- Import Icon -->
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
          <!-- Document Icon -->
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
          <!-- Logbook Icon -->
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

        <!-- Link Label -->
        <span>{{ item.name }}</span>
      </button>
    </nav>
  </aside>
</template>
