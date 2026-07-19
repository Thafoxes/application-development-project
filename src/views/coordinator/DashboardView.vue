<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppHeader from '@/components/common_components/AppHeader.vue'
import NavigationButton from '@/components/NavigationButton.vue'
import StatsCard from '@/components/StatsCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import CreateSessionModal from '@/components/CreateSessionModal.vue'
import AppSidebar from '@/components/common_components/AppSidebar.vue'
import AppFooter from '@/components/common_components/AppFooter.vue'
import { useCalendarStore } from '@/stores/calendarStore'
import FypDashboardContainer from '@/views/Student/FypDashboardContainer.vue'

const { user, activeRole } = useAuth()
const router = useRouter()
const isModalOpen = ref(false)

const handleSessionCreated = () => {
  isModalOpen.value = false
  router.push('/manage-session')
}

const calendarStore = useCalendarStore()

onMounted(() => {
  calendarStore.fetchActiveSession()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black">
    <!-- Header -->
    <AppHeader />

    <!-- Access Denied View -->
    <div
      v-if="!user"
      class="flex-1 flex flex-col items-center justify-center text-center px-4"
    >
      <h1 class="text-4xl font-bold text-[#5c001f] mb-4">Access Restricted</h1>
      <p class="text-xl text-gray-700 mb-6">
        You do not have permissions to view this dashboard.
      </p>
    </div>

    <!-- Main Content Split Layout for Students -->
    <div v-else-if="activeRole === 'student'" class="flex flex-1 w-full relative">
      <AppSidebar />
      <main class="flex-1 flex flex-col px-4 md:px-10 py-8 gap-6 overflow-y-auto">
        <div class="flex flex-col gap-4 w-full bg-white/40 p-6 rounded-2xl border border-white/20 backdrop-blur-sm shadow-sm">
          <div>
            <h1 class="font-['Inter'] font-extrabold text-3xl tracking-tight text-gray-900">Student Workspace</h1>
            <p class="text-sm text-gray-600 mt-1">Manage your Final Year Project proposal, milestones, and deliverables.</p>
          </div>
        </div>
        <FypDashboardContainer />
      </main>
    </div>

    <!-- Main Content Split Layout for Coordinators -->
    <div v-else-if="activeRole === 'coordinator'" class="flex flex-1 w-full relative">
      <!-- Side Navigation -->
      <AppSidebar />

      <!-- Main Dashboard Content -->
      <main class="flex-1 flex flex-col px-10 py-8 gap-6 overflow-y-auto">
        <!-- Session Heading & Action -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full bg-white/40 p-6 rounded-2xl border border-white/20 backdrop-blur-sm shadow-sm"
        >
          <div>
            <h1 class="font-['Inter'] font-extrabold text-3xl tracking-tight text-gray-900">
              {{
                calendarStore.isLoading
                  ? 'Loading Active Session...'
                  : calendarStore.activeSessionId
                    ? 'Active Academic Session: ' + calendarStore.activeSessionId
                    : 'No Active Academic Session'
              }}
            </h1>
            <p class="text-sm text-gray-600 mt-1">
              Manage institutional deadlines, user records, and program milestones.
            </p>
          </div>
          <button
            @click="isModalOpen = true"
            class="bg-[#5c001f] text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-[#4a0019] active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg border-none flex items-center justify-center space-x-2 self-start sm:self-auto"
          >
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
            <span>Create New Session</span>
          </button>
        </div>

        <!-- Divider -->
        <hr class="border-gray-300 w-full opacity-60" />

        <!-- Quick Stats Cards (Sleek Color coded design) -->
        <div
          class="bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-sm border border-gray-100 w-full"
        >
          <h2 class="font-['Inter'] font-bold text-lg text-gray-900 tracking-tight">
            Active Indicators
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            <!-- Total Projects -->
            <div
              class="bg-emerald-50 border border-emerald-200/60 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow transition-all duration-200"
            >
              <div class="space-y-1">
                <p class="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Total Projects
                </p>
                <p class="text-3xl font-extrabold text-emerald-950">0</p>
              </div>
              <div class="p-3 bg-emerald-100 rounded-lg text-emerald-800 shadow-inner">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
              </div>
            </div>

            <!-- Needing Supervisor -->
            <div
              class="bg-amber-50 border border-amber-200/60 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow transition-all duration-200"
            >
              <div class="space-y-1">
                <p class="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Needing Supervisor
                </p>
                <p class="text-3xl font-extrabold text-amber-950">0</p>
              </div>
              <div class="p-3 bg-amber-100 rounded-lg text-amber-850 shadow-inner">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  ></path>
                </svg>
              </div>
            </div>

            <!-- Missed Deadline -->
            <div
              class="bg-rose-50 border border-rose-200/60 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow transition-all duration-200"
            >
              <div class="space-y-1">
                <p class="text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Missed Deadlines
                </p>
                <p class="text-3xl font-extrabold text-rose-950">0</p>
              </div>
              <div class="p-3 bg-rose-100 rounded-lg text-rose-800 shadow-inner">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Users & Data Manager -->
        <div
          class="bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-sm border border-gray-100 w-full"
        >
          <div>
            <h2 class="font-['Inter'] font-bold text-lg text-gray-900 tracking-tight">
              User Administration & Data Directory
            </h2>
            <p class="text-sm text-gray-500 mt-1">
              Review registered participants across administrative categories and manage data import
              pipelines.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
            <StatsCard amount="12" label="Users" />
            <StatsCard amount="1" label="Students" />
            <StatsCard amount="3" label="Staff" />
            <StatsCard amount="4" label="Examiners" />
          </div>

          <button
            @click="router.push('/import-users')"
            class="bg-[#5c001f] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#4a0019] transition-all self-start mt-2 shadow-sm hover:shadow active:scale-[0.99] duration-150 flex items-center space-x-2 border-none"
          >
            <span>Access Bulk Data Ingestion Hub</span>
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              ></path>
            </svg>
          </button>
        </div>

        <!-- System Alerts Table -->
        <div
          class="bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-sm border border-gray-100 w-full mb-10"
        >
          <h2 class="font-['Inter'] font-bold text-lg text-gray-900 tracking-tight">
            System Alerts & Activity Logs
          </h2>

          <div class="overflow-hidden border border-gray-100 rounded-xl bg-white shadow-inner">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr
                  class="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  <th class="px-6 py-4">Alert Classification</th>
                  <th class="px-6 py-4">Affected User</th>
                  <th class="px-6 py-4 text-center">Current Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-6 py-4 text-sm font-semibold text-gray-900">Proposal Submitted</td>
                  <td class="px-6 py-4 text-sm text-gray-600">Matt Dickerson</td>
                  <td class="px-6 py-4 text-center flex justify-center items-center">
                    <StatusBadge status="Proposal Submitted" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- Main Content Split Layout for Supervisor / Examiner / Other Roles (Fallback) -->
    <div v-else class="flex flex-1 w-full relative">
      <AppSidebar />
      <main class="flex-1 flex flex-col px-4 md:px-10 py-8 gap-6 overflow-y-auto">
        <div class="flex flex-col gap-4 w-full bg-white/40 p-6 rounded-2xl border border-white/20 backdrop-blur-sm shadow-sm animate-fade-in">
          <div>
            <h1 class="font-['Inter'] font-extrabold text-3xl tracking-tight text-gray-900 capitalize">{{ activeRole }} Workspace</h1>
            <p class="text-sm text-gray-600 mt-1">Workspace for the role of {{ activeRole }}. Under active development.</p>
          </div>
        </div>
      </main>
    </div>

    <!-- Footer -->
    <AppFooter class="mt-auto -mb-[30px]" />

    <!-- Create Session Modal -->
    <CreateSessionModal
      v-if="isModalOpen"
      @close="isModalOpen = false"
      @create="handleSessionCreated"
    />
  </div>
</template>
