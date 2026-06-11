<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppHeader from '@/components/common_components/AppHeader.vue'
import NavigationButton from '@/components/NavigationButton.vue'
import CreateSessionModal from '@/components/CreateSessionModal.vue'
import AppSidebar from '@/components/common_components/AppSidebar.vue'
import AppFooter from '@/components/common_components/AppFooter.vue'

const { user } = useAuth()
const router = useRouter()

const isModalOpen = ref(false)

const handleSessionCreated = async () => {
  isModalOpen.value = false
  await fetchSessions() // Refresh the table
}

const sessions = ref([])
const isLoading = ref(true)
const error = ref('')

const fetchSessions = async () => {
  isLoading.value = true
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const res = await fetch(`${apiUrl}/api/sessions`)
    if (!res.ok) throw new Error('Failed to fetch sessions')
    sessions.value = await res.json()
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchSessions()
})

const editingId = ref(null)
const editValue = ref('')

const startEdit = (session) => {
  editingId.value = session.fyp_session_id
  editValue.value = session.fyp_session_id
}

const cancelEdit = () => {
  editingId.value = null
  editValue.value = ''
}

const saveEdit = async (oldId) => {
  if (!editValue.value || editValue.value == oldId) {
    cancelEdit()
    return
  }

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const res = await fetch(`${apiUrl}/api/sessions/${oldId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_session_id: parseInt(editValue.value, 10) }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to update session')
    }

    await fetchSessions()
    cancelEdit()
  } catch (err) {
    alert(err.message)
  }
}

const deleteSession = async (id) => {
  if (!confirm(`Are you sure you want to delete SESSION ${id}?`)) return

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const res = await fetch(`${apiUrl}/api/sessions/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to delete session')
    }

    await fetchSessions()
  } catch (err) {
    alert(err.message)
  }
}

const setActiveSession = async (id) => {
  if (!confirm(`Are you sure you want to set SESSION ${id} as the active semester?`)) return

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const res = await fetch(`${apiUrl}/api/sessions/${id}/active`, {
      method: 'PUT',
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to set active session')
    }

    localStorage.setItem('activeSessionId', id)
    await fetchSessions()
  } catch (err) {
    alert(err.message)
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black">
    <AppHeader />

    <!-- Access Denied View for Non-Coordinators -->
    <div
      v-if="!user || Number(user.is_coordinator) !== 1"
      class="flex-1 flex flex-col items-center justify-center text-center px-4"
    >
      <h1 class="text-4xl font-bold text-[#5c001f] mb-4">Access Restricted</h1>
      <p class="text-xl text-gray-700">
        You do not have coordinator permissions to view this page.
      </p>
    </div>

    <!-- Main Content -->
    <div v-else class="flex flex-1 w-full relative">
      <!-- Side Navigation -->
      <AppSidebar />

      <!-- Main Dashboard Content -->
      <main class="flex-1 flex flex-col px-10 py-8 gap-6 overflow-y-auto">
        <!-- Heading -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full bg-white/40 p-6 rounded-2xl border border-white/20 backdrop-blur-sm shadow-sm"
        >
          <div>
            <h1 class="font-['Inter'] font-extrabold text-3xl tracking-tight text-gray-900">
              Manage Academic Sessions
            </h1>
            <p class="text-sm text-gray-600 mt-1">
              Configure active semesters, create new semester, and manage active semester.
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

        <!-- Data Table Container -->
        <div
          class="bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-sm border border-gray-100 w-full mb-10"
        >
          <h2 class="font-['Inter'] font-bold text-lg text-gray-900 tracking-tight">
            All Semesters
          </h2>

          <div
            v-if="isLoading"
            class="text-gray-500 py-4 font-semibold text-sm flex items-center space-x-2"
          >
            <svg
              class="animate-spin h-5 w-5 text-[#5c001f]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading database sessions...</span>
          </div>

          <div
            v-else-if="error"
            class="bg-red-50 text-red-800 border border-red-200 p-3 rounded-lg text-sm font-semibold"
          >
            {{ error }}
          </div>

          <div
            v-else
            class="overflow-hidden border border-gray-100 rounded-xl bg-white shadow-inner mt-2"
          >
            <!-- Table Header -->
            <div
              class="bg-gray-50 flex justify-between px-6 py-4 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider"
            >
              <div class="flex-[2] pl-2">Session Description</div>
              <div class="flex-1 text-center">Semester Status</div>
              <div class="flex-1 text-center">Administrative Actions</div>
            </div>

            <!-- Table Rows -->
            <div
              v-for="(session, index) in sessions"
              :key="session.fyp_session_id"
              class="flex justify-between items-center px-6 py-4 border-b border-gray-100 last:border-b-0 transition-colors"
              :class="index % 2 === 0 ? 'bg-[#f7f6fe]/30' : 'bg-white'"
            >
              <div class="flex-[2] text-sm font-semibold text-gray-900 pl-2">
                <template v-if="editingId === session.fyp_session_id">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-wider"
                      >SESSION</span
                    >
                    <input
                      v-model="editValue"
                      type="number"
                      class="border border-gray-300 rounded-lg px-3 py-1.5 w-[150px] outline-none focus:ring-2 focus:ring-[#5c001f] focus:border-transparent text-sm transition-all shadow-sm font-semibold"
                      @keyup.enter="saveEdit(session.fyp_session_id)"
                      @keyup.esc="cancelEdit"
                      autoFocus
                    />
                  </div>
                </template>
                <template v-else>
                  <span
                    class="font-mono text-xs uppercase tracking-wider bg-gray-100 text-gray-600 px-2.5 py-1 rounded border border-gray-200 mr-2"
                    >Session ID: {{ session.fyp_session_id }}</span
                  >
                  <span class="text-gray-700">Academic Semester Term</span>
                </template>
              </div>

              <!-- Status Column -->
              <div class="flex-1 flex justify-center items-center">
                <span
                  v-if="session.is_active == 1"
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 uppercase tracking-wider"
                >
                  Active Session
                </span>
                <button
                  v-else
                  @click="setActiveSession(session.fyp_session_id)"
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-300 hover:bg-[#5c001f] hover:text-white hover:border-[#5c001f] transition-all duration-200 cursor-pointer uppercase tracking-wider"
                >
                  Archived
                </button>
              </div>

              <div class="flex-1 flex justify-center gap-4 text-sm font-semibold">
                <template v-if="editingId === session.fyp_session_id">
                  <button
                    @click="saveEdit(session.fyp_session_id)"
                    class="text-green-600 hover:text-green-800 transition-colors"
                  >
                    Save Changes
                  </button>
                  <span class="text-gray-300">|</span>
                  <button
                    @click="cancelEdit"
                    class="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </template>
                <template v-else>
                  <button
                    @click="startEdit(session)"
                    class="text-blue-600 hover:text-blue-805 transition-colors"
                  >
                    Rename
                  </button>
                  <span class="text-gray-300">|</span>
                  <button
                    @click="deleteSession(session.fyp_session_id)"
                    class="text-red-655 hover:text-red-800 transition-colors"
                  >
                    Archive
                  </button>
                </template>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="sessions.length === 0" class="p-12 text-center text-gray-500 bg-white">
              <div class="flex flex-col items-center justify-center space-y-3">
                <svg
                  class="w-10 h-10 text-gray-300 animate-bounce"
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
                <p class="font-medium text-sm">No academic sessions found in directory.</p>
              </div>
            </div>
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
