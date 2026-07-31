<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  LayoutDashboard,
  CalendarClock,
  CalendarDays,
  Table2,
  Users,
  FolderKanban,
  FileDown,
  FileUp,
  Sparkles,
  UserRoundCheck,
  Settings,
  Menu,
  X,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const isMobileOpen = ref(false)

const toggleMobileSidebar = () => {
  isMobileOpen.value = !isMobileOpen.value
}

const closeMobileSidebar = () => {
  isMobileOpen.value = false
}

const isActive = (path) => {
  return route.path.startsWith(path)
}

const navItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    label: 'Manage Session',
    path: '/manage-session',
    icon: CalendarClock,
    enabled: true,
  },
  {
    label: 'View Calendar',
    path: '/calendar',
    icon: CalendarDays,
    enabled: true,
  },
  {
    label: 'Add Time Table',
    path: '/add-time-table',
    icon: Table2,
    enabled: true,
  },
  {
    label: 'Manage User',
    path: '/manage-user',
    icon: Users,
    enabled: true,
  },
  {
    label: 'Manage FYP',
    path: '/manage-fyp',
    icon: FolderKanban,
    enabled: true,
  },
  {
    label: 'Assign Examiner',
    path: '/examiner-assignment',
    icon: UserRoundCheck,
    enabled: true,
  },
  {
    label: 'AI Assistant',
    path: '/dashboard',
    icon: Sparkles,
    enabled: false,
  },
  {
    label: 'Export',
    path: '/export',
    icon: FileDown,
    enabled: false,
  },
  {
    label: 'Import',
    path: '/import',
    icon: FileUp,
    enabled: false,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    enabled: false,
  },
]

const navigateTo = (item) => {
  if (!item.enabled) return
  closeMobileSidebar()
  router.push(item.path)
}
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
        <span>Coordinator Menu</span>
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
        'bg-[#f7f1ea] shrink-0 flex flex-col border-r border-[#d8c9bd] shadow-sm z-[999] transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-[240px] min-h-[calc(100vh-70px)]',
        isMobileOpen
          ? 'fixed inset-y-0 left-0 w-[270px] max-w-[85vw] translate-x-0 shadow-2xl'
          : 'fixed inset-y-0 left-0 w-[270px] max-w-[85vw] -translate-x-full md:translate-x-0',
      ]"
    >
      <!-- Sidebar top header -->
      <div class="px-4 py-4 md:py-5 flex items-center justify-between border-b border-[#e1d5cc]/60 md:border-b-0">
        <div class="bg-white/80 border border-[#e1d5cc] rounded-[18px] p-3.5 flex-1">
          <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5c001f]">
            Coordinator
          </p>
          <p class="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">Control Panel</p>
        </div>

        <button
          type="button"
          @click="closeMobileSidebar"
          class="md:hidden ml-2 p-2 text-[#5c001f] hover:bg-black/5 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Close Menu"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 pb-5 space-y-1 overflow-y-auto">
        <button
          v-for="item in navItems"
          :key="item.label"
          type="button"
          @click="navigateTo(item)"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-left transition-all duration-200 group',
            item.enabled
              ? 'cursor-pointer'
              : 'cursor-not-allowed opacity-60',
            isActive(item.path) && item.enabled
              ? 'bg-[#5c001f] text-white shadow-md'
              : 'text-[#2b1b1b] hover:bg-white hover:shadow-sm',
          ]"
        >
          <span
            :class="[
              'w-9 h-9 rounded-[12px] flex items-center justify-center transition-colors shrink-0',
              isActive(item.path) && item.enabled
                ? 'bg-[#f8be17] text-[#5c001f]'
                : 'bg-[#eadfd7] text-[#5c001f] group-hover:bg-[#f8be17]',
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
          </span>

          <span class="font-bold text-[14px] sm:text-[15px]">
            {{ item.label }}
          </span>
        </button>
      </nav>

      <!-- Sidebar Footer -->
      <div class="px-4 pb-5 mt-auto">
        <div class="rounded-[18px] bg-[#5c001f] p-4 text-white">
          <div class="flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-[#f8be17]" />
            <p class="font-bold text-sm">AI Ready</p>
          </div>
          <p class="text-xs text-white/70 mt-2">
            Supervisor and examiner AI matching are available.
          </p>
        </div>
      </div>
    </aside>
  </div>
</template>
