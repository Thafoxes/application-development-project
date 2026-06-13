<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/common_components/AppHeader.vue'
import AppSidebar from '@/components/common_components/AppSidebar.vue'
import AppFooter from '@/components/common_components/AppFooter.vue'
import WorkflowSteps from '@/components/common_components/WorkflowSteps.vue'
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  Search,
  Sparkles,
  ClipboardList,
  FolderKanban,
  Loader2,
  Check,
} from 'lucide-vue-next'

const router = useRouter()

const fypSteps = [
  {
    stepLabel: 'Step 1',
    title: 'Proposal Queue',
    description: 'Review proposal files submitted by students.',
    icon: UploadCloud,
  },
  {
    stepLabel: 'Step 2',
    title: 'Review Details',
    description: 'Check proposal title, NABC components, and objectives.',
    icon: FileText,
  },
  {
    stepLabel: 'Step 3',
    title: 'Approve / Reject',
    description: 'Approve or reject student-submitted FYP proposals.',
    icon: Check,
  },
  {
    stepLabel: 'Step 4',
    title: 'Track Records',
    description: 'Assignment and approval status are monitored from one workspace.',
    icon: ClipboardList,
  },
]

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const activeTab = ref('queue')
const isLoadingRecords = ref(false)
const recordsError = ref('')
const projectRecords = ref([])
const submittedProposals = ref([])
const isLoadingQueue = ref(false)
const queueError = ref('')
const selectedQueueProjectId = ref(null)

// Filters
const selectedTypeFilter = ref('all')
const selectedStatusFilter = ref('pending') // Filter the not approved (Pending/Submitted) proposals by default

const loadSubmittedProposalQueue = async () => {
  isLoadingQueue.value = true
  queueError.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator/fyp-queue`)
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to load submitted proposal queue.')
    }

    submittedProposals.value = data.projects || []
  } catch (error) {
    console.error('Load submitted proposal queue error:', error)
    queueError.value = error.message || 'Failed to load submitted proposal queue.'
  } finally {
    isLoadingQueue.value = false
  }
}

const filteredProposals = computed(() => {
  return submittedProposals.value.filter((p) => {
    // Type Filter
    const typeMatch =
      selectedTypeFilter.value === 'all' ||
      p.projectType?.toLowerCase() === selectedTypeFilter.value.toLowerCase()

    // Status Filter
    let statusMatch = true
    if (selectedStatusFilter.value === 'pending') {
      statusMatch = p.status?.toLowerCase() === 'submitted' || p.status?.toLowerCase() === 'pending'
    } else if (selectedStatusFilter.value !== 'all') {
      statusMatch = p.status?.toLowerCase() === selectedStatusFilter.value.toLowerCase()
    }

    return typeMatch && statusMatch
  })
})

const setActiveTab = async (tabName) => {
  activeTab.value = tabName

  if (tabName === 'records') {
    await loadProjectRecords()
  }
}

const updateStatus = async (projectId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator/fyp-status/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
    const data = await response.json()
    if (response.ok && data.success) {
      await loadSubmittedProposalQueue()
    } else {
      alert(data.error || 'Failed to update proposal status.')
    }
  } catch (error) {
    console.error('Update status error:', error)
    alert('Failed to connect to the server to update status.')
  }
}

const loadProjectRecords = async () => {
  recordsError.value = ''

  try {
    isLoadingRecords.value = true

    const response = await fetch(`${API_BASE_URL}/api/supervisor-matching/projects`)
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to load project records.')
    }

    projectRecords.value = data.projects || []
  } catch (error) {
    console.error('Load project records error:', error)
    recordsError.value = error.message || 'Failed to load project records.'
  } finally {
    isLoadingRecords.value = false
  }
}

const goToDashboard = () => {
  router.push('/dashboard')
}

onMounted(async () => {
  await loadSubmittedProposalQueue()
  await loadProjectRecords()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black">
    <AppHeader />

    <div class="flex flex-1 w-full relative">
      <AppSidebar />

      <main class="flex-1 flex flex-col px-[50px] py-[30px] gap-8 overflow-y-auto">
        <!-- Breadcrumbs -->
        <div class="text-[#5c001f] text-sm">
          <router-link to="/dashboard" class="hover:underline font-semibold text-[#5c001f]">
            Dashboard
          </router-link>
          <span class="mx-2 text-gray-500">&gt;</span>
          <span class="font-bold underline text-[#5c001f]">Manage FYP Proposals</span>
        </div>

        <!-- Page Header -->
        <section
          class="relative overflow-hidden rounded-lg bg-[#5c001f] text-white shadow-xl border border-black/10"
        >
          <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#f8be17]/20"></div>
          <div class="absolute right-20 bottom-[-70px] w-40 h-40 rounded-full bg-white/10"></div>

          <div
            class="relative p-8 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6"
          >
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="w-12 h-12 rounded-lg bg-[#f8be17] flex items-center justify-center shadow-md"
                >
                  <FolderKanban class="w-7 h-7 text-[#5c001f]" />
                </div>

                <div>
                  <p class="text-[#f8be17] font-bold text-sm uppercase tracking-[0.2em]">
                    Coordinator Module
                  </p>
                  <h1 class="font-bold text-[36px] leading-tight">Manage FYP Proposals</h1>
                </div>
              </div>

              <p class="text-white/80 max-w-3xl text-[16px] leading-relaxed">
                Review student-submitted proposal records, run AI supervisor matching, assign
                supervisors and examiners, and monitor project status.
              </p>
            </div>
          </div>
        </section>

        <!-- Workflow Cards -->
        <WorkflowSteps :steps="fypSteps" />

        <!-- Main Panel -->
        <section class="bg-white rounded-lg shadow-lg border border-black/10 overflow-hidden">
          <!-- Tabs -->
          <div class="bg-gray-50 px-7 pt-7 border-b border-gray-300">
            <div class="flex flex-wrap gap-3">
              <button
                @click="setActiveTab('queue')"
                :class="[
                  'px-5 py-3 rounded-t-lg font-bold flex items-center gap-2 transition-colors',
                  activeTab === 'queue'
                    ? 'bg-[#5c001f] text-white'
                    : 'bg-white text-[#5c001f] hover:bg-[#fff8df]',
                ]"
              >
                <UploadCloud class="w-5 h-5" />
                Submitted Proposal Queue
              </button>

              <button
                @click="setActiveTab('records')"
                :class="[
                  'px-5 py-3 rounded-t-lg font-bold flex items-center gap-2 transition-colors',
                  activeTab === 'records'
                    ? 'bg-[#5c001f] text-white'
                    : 'bg-white text-[#5c001f] hover:bg-[#fff8df]',
                ]"
              >
                <ClipboardList class="w-5 h-5" />
                Project Records
              </button>
            </div>
          </div>

          <!-- Submitted Proposal Queue Tab -->
          <div v-if="activeTab === 'queue'" class="p-7">
            <div class="flex items-center justify-between gap-4 mb-6">
              <div>
                <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
                  Coordinator Review
                </p>
                <h2 class="text-[28px] font-bold">Submitted Proposal Queue</h2>
                <p class="text-gray-600 mt-2 max-w-3xl">
                  Proposals are uploaded by students from the Student Document Submission Center.
                  Coordinator reviews each proposal, and assigns the most suitable supervisor.
                </p>
              </div>

              <button
                @click="loadSubmittedProposalQueue"
                class="bg-yellow-50 text-[#5c001f] px-5 py-2.5 rounded-lg font-bold hover:bg-[#f8be17] transition-colors border-none flex items-center gap-2"
              >
                <Sparkles class="w-4 h-4" />
                Refresh Queue
              </button>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-7">
              <div class="rounded-lg bg-gray-50 border border-gray-300 p-6">
                <p class="text-sm text-gray-500 font-bold">Submitted Proposals</p>
                <p class="text-[34px] font-bold text-[#5c001f] mt-1">12</p>
                <p class="text-xs text-gray-500 mt-1">Waiting in coordinator queue</p>
              </div>
              <div class="rounded-lg bg-gray-50 border border-gray-300 p-6">
                <p class="text-sm text-gray-500 font-bold">Pending Review</p>
                <p class="text-[34px] font-bold text-[#5c001f] mt-1">8</p>
                <p class="text-xs text-gray-500 mt-1">Ready for status check</p>
              </div>
              <div class="rounded-lg bg-gray-50 border border-gray-300 p-6">
                <p class="text-sm text-gray-500 font-bold">Pending Supervisor Approval</p>
                <p class="text-[34px] font-bold text-[#5c001f] mt-1">3</p>
                <p class="text-xs text-gray-500 mt-1">Assigned but waiting response</p>
              </div>
            </div>

            <!-- Filters Section -->
            <div
              class="flex flex-col md:flex-row gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-300"
            >
              <div class="flex-1 flex flex-col md:flex-row gap-4">
                <div class="flex flex-col gap-1.5 min-w-[200px]">
                  <label class="text-xs font-bold text-[#5c001f] uppercase tracking-wider"
                    >Project Type</label
                  >
                  <select
                    v-model="selectedTypeFilter"
                    class="rounded-lg border border-[#d8c9bd] px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f8be17]"
                  >
                    <option value="all">All Types</option>
                    <option value="System Development">System Development</option>
                    <option value="Research">Research</option>
                  </select>
                </div>

                <div class="flex flex-col gap-1.5 min-w-[200px]">
                  <label class="text-xs font-bold text-[#5c001f] uppercase tracking-wider"
                    >Approval Status</label
                  >
                  <select
                    v-model="selectedStatusFilter"
                    class="rounded-lg border border-[#d8c9bd] px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f8be17]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Not Approved (Pending/Submitted)</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="overflow-x-auto rounded-lg border border-gray-300">
              <table class="w-full text-sm bg-white">
                <thead class="bg-[#5c001f] text-white">
                  <tr class="text-left">
                    <th class="px-5 py-4">Student</th>
                    <th class="px-5 py-4">Project Title</th>
                    <th class="px-5 py-4">Project Type</th>
                    <th class="px-5 py-4">Proposal Status</th>
                    <th class="px-5 py-4">Supervisor Email</th>
                    <th class="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoadingQueue">
                    <td colspan="6" class="px-5 py-8 text-center font-bold text-[#5c001f]">
                      Loading submitted proposals...
                    </td>
                  </tr>

                  <tr v-else-if="queueError">
                    <td colspan="6" class="px-5 py-8 text-center font-bold text-red-700">
                      {{ queueError }}
                    </td>
                  </tr>

                  <tr v-else-if="filteredProposals.length === 0">
                    <td colspan="6" class="px-5 py-8 text-center text-gray-600">
                      No student-submitted proposals found matching the filters.
                    </td>
                  </tr>

                  <tr
                    v-for="project in filteredProposals"
                    v-else
                    :key="project.project_id"
                    class="border-t border-gray-300"
                    :class="
                      String(selectedQueueProjectId) === String(project.project_id)
                        ? 'bg-yellow-50'
                        : ''
                    "
                  >
                    <td class="px-5 py-4 font-bold">
                      {{ project.studentName }}
                      <br />
                      <span class="text-xs text-gray-500 font-medium">
                        {{ project.matricNo }}
                        <span v-if="project.cgpa"
                          >· CGPA: {{ parseFloat(project.cgpa).toFixed(2) }}</span
                        >
                      </span>
                    </td>

                    <td class="px-5 py-4 font-bold max-w-[240px]">
                      {{ project.projectTitle }}
                    </td>

                    <td class="px-5 py-4 font-medium text-gray-700">
                      {{ project.projectType }}
                    </td>

                    <td class="px-5 py-4">
                      <span
                        class="px-3 py-1 rounded-full font-bold text-xs uppercase"
                        :class="{
                          'bg-yellow-100 text-yellow-800':
                            project.status?.toLowerCase() === 'submitted' ||
                            project.status?.toLowerCase() === 'pending',
                          'bg-green-100 text-green-800':
                            project.status?.toLowerCase() === 'approved',
                          'bg-red-100 text-red-800': project.status?.toLowerCase() === 'rejected',
                        }"
                      >
                        {{ project.status }}
                      </span>
                    </td>

                    <td class="px-5 py-4 font-medium text-gray-700">
                      {{ project.supervisorEmail || 'Not Assigned Yet' }}
                    </td>

                    <td class="px-5 py-4 text-right flex justify-end gap-2 items-center">
                      <router-link
                        :to="`/manage-fyp/${project.project_id}`"
                        class="bg-[#5c001f] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#4a0019] transition-all text-xs inline-block"
                      >
                        Check FYP
                      </router-link>
                      <button
                        v-if="
                          project.status?.toLowerCase() === 'submitted' ||
                          project.status?.toLowerCase() === 'pending'
                        "
                        @click="updateStatus(project.project_id, 'approved')"
                        class="bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-800 transition-all text-xs"
                      >
                        Approve
                      </button>
                      <button
                        v-if="
                          project.status?.toLowerCase() === 'submitted' ||
                          project.status?.toLowerCase() === 'pending'
                        "
                        @click="updateStatus(project.project_id, 'rejected')"
                        class="bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-800 transition-all text-xs"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-6 rounded-lg bg-yellow-50 border border-yellow-400 p-5 text-[#5c001f]">
              <p class="font-bold">Updated workflow reminder</p>
              <p class="text-sm mt-1">
                Student uploads proposal first. Coordinator only reviews submitted proposals,
                approves or rejects, and tracks status.
              </p>
            </div>
          </div>

          <!-- Records Tab -->
          <div v-if="activeTab === 'records'" class="p-7">
            <div class="flex items-center justify-between gap-4 mb-6">
              <div>
                <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
                  Project Database
                </p>
                <h2 class="text-[28px] font-bold">FYP Project Records</h2>
              </div>

              <div class="flex gap-3 items-center">
                <button
                  @click="loadProjectRecords"
                  class="bg-[#5c001f] text-white px-5 py-3 rounded-lg font-bold hover:bg-[#4a0019] transition-colors border-none"
                >
                  Refresh
                </button>

                <div class="relative">
                  <Search class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search project..."
                    class="rounded-full border border-[#d8c9bd] pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f8be17]"
                  />
                </div>
              </div>
            </div>

            <div v-if="isLoadingRecords" class="rounded-lg border border-gray-300 p-8 text-center">
              <Loader2 class="w-10 h-10 animate-spin text-[#5c001f] mx-auto" />
              <p class="font-bold mt-4">Loading project records...</p>
            </div>

            <div v-else-if="recordsError" class="rounded-lg bg-red-50 border border-red-200 p-6">
              <div class="flex gap-3">
                <AlertTriangle class="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <h3 class="font-bold text-red-700">Failed to Load Records</h3>
                  <p class="text-sm text-red-600 mt-1">{{ recordsError }}</p>
                </div>
              </div>
            </div>

            <div
              v-else-if="projectRecords.length === 0"
              class="rounded-lg border border-gray-300 p-8 text-center"
            >
              <ClipboardList class="w-12 h-12 text-[#5c001f] mx-auto" />
              <h3 class="font-bold text-xl mt-4">No Assigned Projects Yet</h3>
              <p class="text-gray-600 mt-2">
                Assigned projects will appear here after the coordinator confirms a supervisor.
              </p>
            </div>

            <div v-else class="overflow-hidden rounded-lg border border-gray-200">
              <table class="w-full text-left bg-white">
                <thead class="bg-[#5c001f] text-white">
                  <tr>
                    <th class="px-5 py-4 text-sm font-bold">No.</th>
                    <th class="px-5 py-4 text-sm font-bold">Student</th>
                    <th class="px-5 py-4 text-sm font-bold">Project Title</th>
                    <th class="px-5 py-4 text-sm font-bold">Project Type</th>
                    <th class="px-5 py-4 text-sm font-bold">Supervisor</th>
                    <th class="px-5 py-4 text-sm font-bold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="project in projectRecords"
                    :key="project.project_id"
                    class="border-b border-gray-100 bg-white hover:bg-[#fff8df] transition-colors"
                  >
                    <td class="px-5 py-4 font-semibold">
                      {{ project.project_id }}
                    </td>

                    <td class="px-5 py-4 font-bold">
                      {{ project.studentName }}
                      <br />
                      <span class="text-xs text-gray-500 font-medium">
                        {{ project.matricNo }}
                        <span v-if="project.cgpa"
                          >· CGPA: {{ parseFloat(project.cgpa).toFixed(2) }}</span
                        >
                      </span>
                    </td>

                    <td class="px-5 py-4 text-gray-700 max-w-[360px]">
                      {{ project.projectTitle }}
                    </td>

                    <td class="px-5 py-4 font-medium text-gray-700">
                      {{ project.projectType }}
                    </td>

                    <td class="px-5 py-4 text-gray-700">
                      <div v-if="project.supervisorName">
                        <p class="font-bold">{{ project.supervisorName }}</p>
                        <p class="text-xs text-gray-500">{{ project.supervisorEmail }}</p>
                      </div>
                      <div v-else>
                        <p class="text-gray-500 font-medium italic">Not Assigned Yet</p>
                      </div>
                    </td>

                    <td class="px-5 py-4">
                      <span
                        class="px-3 py-1 rounded-full text-xs font-bold font-bold text-xs uppercase"
                        :class="{
                          'bg-yellow-100 text-yellow-800':
                            project.status?.toLowerCase() === 'submitted' ||
                            project.status?.toLowerCase() === 'pending',
                          'bg-green-100 text-green-800':
                            project.status?.toLowerCase() === 'approved',
                          'bg-red-100 text-red-800': project.status?.toLowerCase() === 'rejected',
                        }"
                      >
                        {{ project.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>

    <AppFooter class="mt-auto -mb-[30px]" />
  </div>
</template>
