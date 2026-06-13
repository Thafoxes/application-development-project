<script setup>
import { ref, onMounted } from 'vue'
import AppHeader from '@/components/common_components/AppHeader.vue'
import AppSidebar from '@/components/common_components/AppSidebar.vue'
import AppFooter from '@/components/common_components/AppFooter.vue'
import WorkflowSteps from '@/components/common_components/WorkflowSteps.vue'
import SubmittedProposalQueue from './state/SubmittedProposalQueue.vue'
import FYPProjectRecords from './state/FYPProjectRecords.vue'
import {
  UploadCloud,
  ClipboardList,
  FolderKanban,
  Check,
  FileText,
} from 'lucide-vue-next'

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

const updateStatus = async ({ projectId, status }) => {
  let feedback = null
  if (status === 'rejected') {
    feedback = prompt('Please provide feedback on why this proposal is rejected:')
    if (feedback === null) return // user canceled
    if (!feedback.trim()) {
      alert('Feedback is required to reject a proposal.')
      return
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator/fyp-status/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, coordinator_comments: feedback }),
    })
    const data = await response.json()
    if (response.ok && data.success) {
      await loadSubmittedProposalQueue()
      await loadProjectRecords() // Reload database records as well to keep them in sync
    } else {
      alert(data.error || 'Failed to update proposal status.')
    }
  } catch (error) {
    console.error('Update status error:', error)
    alert('Failed to connect to the server to update status.')
  }
}

const setActiveTab = async (tabName) => {
  activeTab.value = tabName

  if (tabName === 'records') {
    await loadProjectRecords()
  } else {
    await loadSubmittedProposalQueue()
  }
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
                  'px-5 py-3 rounded-t-lg font-bold flex items-center gap-2 transition-colors border-none cursor-pointer',
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
                  'px-5 py-3 rounded-t-lg font-bold flex items-center gap-2 transition-colors border-none cursor-pointer',
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
          <SubmittedProposalQueue
            v-if="activeTab === 'queue'"
            :proposals="submittedProposals"
            :isLoading="isLoadingQueue"
            :error="queueError"
            @refresh="loadSubmittedProposalQueue"
            @update-status="updateStatus"
          />

          <!-- Records Tab -->
          <FYPProjectRecords
            v-if="activeTab === 'records'"
            :records="projectRecords"
            :isLoading="isLoadingRecords"
            :error="recordsError"
            @refresh="loadProjectRecords"
          />
        </section>
      </main>
    </div>

    <AppFooter class="mt-auto -mb-[30px]" />
  </div>
</template>
