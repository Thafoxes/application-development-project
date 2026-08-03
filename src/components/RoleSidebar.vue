<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardCheck,
  BookOpenCheck,
  UsersRound,
  Route,
  Bell,
  Menu,
  X,
  Table2,
} from 'lucide-vue-next'
import { roleFlags } from '@/services/ifamousApi'

const props = defineProps({
  role: { type: String, default: '' },
})
const route = useRoute()
const router = useRouter()
const roles = roleFlags()
const isMobileOpen = ref(false)

const toggleMobileSidebar = () => {
  isMobileOpen.value = !isMobileOpen.value
}

const closeMobileSidebar = () => {
  isMobileOpen.value = false
}

const handleNavigate = (path) => {
  closeMobileSidebar()
  router.push(path)
}

const activeRole = computed(() => {
  if (props.role) return props.role
  if (roles.isCoordinator) return 'Coordinator'
  if (roles.isStudent) return 'Student'
  if (roles.isSupervisor || roles.isExaminer) return 'Staff'
  return 'User'
})

const items = computed(() => {
  if (activeRole.value === 'Coordinator') {
    return [
      ['Dashboard', '/dashboard', LayoutDashboard],
      ['Manage FYP', '/manage-fyp', FolderKanban],
      ['Examiner Assignment', '/examiner-assignment', UsersRound],
      ['My Timetable', '/personal-timetable', Table2],
    ]
  }
  if (activeRole.value === 'Student') {
    return [
      ['Dashboard', '/student-dashboard', LayoutDashboard],
      ['My FYP', '/student-fyp', FolderKanban],
      ['FYP Journey', '/project-journey', Route],
      ['Logbook', '/student-logbook', BookOpenCheck],
      ['My Timetable', '/personal-timetable', Table2],
    ]
  }
  return [
    ['Dashboard', '/supervisor-dashboard', LayoutDashboard],
    ['Assigned FYP', '/supervisor-projects', FolderKanban],
    ['Assigned Grading FYP', '/examiner-projects', ClipboardCheck],
    ['Logbook', '/supervisor-logbook', BookOpenCheck],
    ['My Timetable', '/personal-timetable', Table2],
  ].filter(([label]) => label !== 'Assigned Grading FYP' || roles.isExaminer)
})
</script>

<template>
  <div class="w-full md:w-auto shrink-0">
    <!-- Mobile & Tablet Sticky Toggle Trigger -->
    <div class="md:hidden w-full p-3 bg-[#f5efe6] border-b border-[#d8c9bd] flex items-center shrink-0">
      <button
        type="button"
        @click="toggleMobileSidebar"
        class="flex items-center gap-2 bg-[#5c001f] text-white px-3.5 py-2 rounded-xl shadow font-bold text-xs sm:text-sm hover:bg-[#430016] active:scale-95 transition-all cursor-pointer"
      >
        <Menu class="w-4 h-4 text-[#f8be17]" />
        <span>{{ activeRole }} Menu</span>
      </button>
    </div>

    <!-- Backdrop overlay for mobile drawer -->
    <div
      v-if="isMobileOpen"
      @click="closeMobileSidebar"
      class="fixed inset-0 bg-black/60 backdrop-blur-xs z-[998] md:hidden transition-opacity"
    ></div>

    <!-- Sidebar Container -->
    <aside
      :class="[
        'bg-[#f7f1ea] shrink-0 border-r border-[#d8c9bd] min-h-[calc(100vh-70px)] p-4 flex flex-col z-[999] transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-[250px]',
        isMobileOpen
          ? 'fixed inset-y-0 left-0 w-[270px] max-w-[85vw] translate-x-0 shadow-2xl'
          : 'fixed inset-y-0 left-0 w-[270px] max-w-[85vw] -translate-x-full md:translate-x-0',
      ]"
    >
      <div class="bg-white/80 border border-[#e1d5cc] rounded-[18px] p-4 mb-5 flex items-center justify-between">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5c001f]">{{ activeRole }}</p>
          <p class="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">I-FAMOUS Workspace</p>
        </div>
        <button
          type="button"
          @click="closeMobileSidebar"
          class="md:hidden ml-2 p-1.5 text-[#5c001f] hover:bg-black/5 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Close Menu"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <nav class="space-y-2 flex-1 overflow-y-auto">
        <button
          v-for="([label, path, icon]) in items"
          :key="path"
          type="button"
          @click="handleNavigate(path)"
          :class="[
            'w-full rounded-[14px] px-4 py-3 flex items-center gap-3 font-bold text-left transition text-sm sm:text-base cursor-pointer',
            route.path.startsWith(path)
              ? 'bg-[#5c001f] text-white shadow-md'
              : 'text-[#2b1b1b] hover:bg-white',
          ]"
        >
          <component :is="icon" class="w-5 h-5 shrink-0" :class="route.path.startsWith(path) ? 'text-[#f8be17]' : 'text-[#5c001f]'" />
          {{ label }}
        </button>
      </nav>

      <div class="mt-8 rounded-[18px] bg-[#5c001f] p-4 text-white">
        <div class="flex items-center gap-2">
          <Bell class="w-5 h-5 text-[#f8be17]" />
          <p class="font-bold text-sm">Assignment protected</p>
        </div>
        <p class="text-xs text-white/70 mt-2">
          Projects are visible only to the student, assigned supervisor, assigned examiner and coordinator.
        </p>
      </div>
    </aside>
  </div>
</template>
