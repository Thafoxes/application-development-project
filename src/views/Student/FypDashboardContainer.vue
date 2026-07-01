<script setup>
import { ref, onMounted, computed } from 'vue'
import ProposalFormWizard from './ProposalFormWizard.vue'

const proposals = ref([])
const milestones = ref([])
const selectedProposalId = ref(null)
const loading = ref(true)

// Create proposal modal state
const showCreateModal = ref(false)
const newProposalTitle = ref('')
const isCreating = ref(false)
const createError = ref('')

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const fetchWorkflow = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${apiUrl}/api/projects/my-workflow`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (res.ok) {
      const data = await res.json()
      proposals.value = data.proposals || []
      milestones.value = data.milestones || []
    }
  } catch (error) {
    console.error('Failed to load workflow:', error)
  } finally {
    loading.value = false
  }
}

const selectedProposal = computed(() => {
  return proposals.value.find(p => p.project_id === selectedProposalId.value)
})

const handleCreateProposal = async () => {
  if (!newProposalTitle.value.trim()) {
    createError.value = 'Please enter a project title.'
    return
  }
  isCreating.value = true
  createError.value = ''
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${apiUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title: newProposalTitle.value.trim() })
    })
    if (res.ok) {
      const data = await res.json()
      newProposalTitle.value = ''
      showCreateModal.value = false
      await fetchWorkflow()
      // Open the workspace for the newly created proposal
      if (data.project_id) {
        selectedProposalId.value = data.project_id
      }
    } else {
      const data = await res.json()
      createError.value = data.error || 'Failed to create proposal.'
    }
  } catch (err) {
    createError.value = 'Failed to connect to the server.'
  } finally {
    isCreating.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Helpers for status classes
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Approved':
    case 'Accepted':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'Pending Review':
    case 'Reviewing':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

onMounted(fetchWorkflow)
</script>

<template>
  <div class="max-w-7xl mx-auto font-['Inter'] text-black p-2 md:p-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5c001f]"></div>
    </div>

    <div v-else>
      <!-- VIEW B: Detailed Workspace View -->
      <div v-if="selectedProposalId !== null && selectedProposal" class="space-y-6">
        <div class="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm">
          <button 
            @click="selectedProposalId = null"
            class="flex items-center gap-2 text-sm font-semibold text-[#5c001f] hover:text-[#7a0029] transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Proposals Dashboard
          </button>
          
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status:</span>
            <span 
              class="px-3 py-1 text-xs font-semibold rounded-full border"
              :class="getStatusBadgeClass(selectedProposal.status)"
            >
              {{ selectedProposal.status }}
            </span>
          </div>
        </div>

        <!-- Render the central ProposalFormWizard for the selected project -->
        <ProposalFormWizard 
          :project="selectedProposal" 
          :milestones="milestones" 
          @refresh="fetchWorkflow" 
        />
      </div>

      <!-- VIEW A: Dashboard Overview Grid -->
      <div v-else class="space-y-6">
        <!-- Banner Alert based on proposal limit -->
        <div 
          v-if="proposals.length === 0" 
          class="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl flex items-center justify-between flex-wrap gap-4"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg">ℹ️</span>
            <span class="text-sm font-medium">Proposals Submitted: 0/2. You must submit at least one proposal topic choice for this academic session.</span>
          </div>
          <button 
            @click="showCreateModal = true"
            class="px-4 py-2 bg-[#5c001f] hover:bg-[#7a0029] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow"
          >
            <span>+</span> Create New Proposal
          </button>
        </div>

        <div 
          v-else-if="proposals.length === 1" 
          class="p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl flex items-center justify-between flex-wrap gap-4"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg">ℹ️</span>
            <span class="text-sm font-medium">Proposals Submitted: 1/2. You can submit one more priority topic choice for this academic session.</span>
          </div>
          <button 
            @click="showCreateModal = true"
            class="px-4 py-2 bg-[#5c001f] hover:bg-[#7a0029] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow"
          >
            <span>+</span> Create New Proposal
          </button>
        </div>

        <div 
          v-else 
          class="p-4 bg-orange-50 text-orange-800 border border-orange-200 rounded-xl flex items-center justify-between flex-wrap gap-4"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg">⚠️</span>
            <span class="text-sm font-medium">Proposals Submitted: 2/2. Maximum capacity threshold hit for this session.</span>
          </div>
          <button 
            disabled
            class="px-4 py-2 bg-gray-200 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed flex items-center gap-1.5 border border-gray-300"
          >
            <span class="text-xs">⚠️</span> Create New Proposal
          </button>
        </div>

        <!-- Main Workspace Title Header -->
        <div class="border-b border-gray-200 pb-3 flex items-center justify-between">
          <h2 class="text-lg font-bold text-[#5c001f]">My Registered Proposals</h2>
          <span class="text-xs text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded">
            Limit: {{ proposals.length }}/2 Submitted
          </span>
        </div>

        <!-- Empty state block if no proposals -->
        <div v-if="proposals.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-base font-bold text-gray-700 mb-1">No Active Proposals</h3>
          <p class="text-sm text-gray-500 max-w-md mx-auto mb-5">Start by submitting your first research or system development topic proposal for reviewing.</p>
          <button 
            @click="showCreateModal = true"
            class="px-6 py-2.5 bg-[#5c001f] hover:bg-[#7a0029] text-white text-sm font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow"
          >
            <span>+</span> Create New Proposal
          </button>
        </div>

        <!-- Proposals Grid Matrix -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            v-for="(proposal, index) in proposals" 
            :key="proposal.project_id"
            class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <!-- Card Header -->
            <div class="bg-[#5c001f] px-6 py-3 border-b-2 border-[#eab308] flex items-center justify-between">
              <span class="text-xs font-bold text-white uppercase tracking-wider">
                {{ index === 0 ? 'Proposal No. 1 – Highest Priority' : 'Proposal No. 2' }}
              </span>
              <span 
                class="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-widest border bg-white"
                :class="getStatusBadgeClass(proposal.status)"
              >
                {{ proposal.status }}
              </span>
            </div>

            <!-- Details Body -->
            <div class="p-6 flex-1 flex flex-col justify-between gap-4">
              <div class="space-y-2">
                <h3 class="text-base font-bold text-gray-900 line-clamp-2 min-h-[3rem] leading-tight">
                  {{ proposal.title }}
                </h3>
                <div class="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>Registered:</span>
                  <span class="font-medium text-gray-700">{{ formatDate(proposal.created_at || new Date()) }}</span>
                </div>
              </div>

              <!-- Action button -->
              <button 
                @click="selectedProposalId = proposal.project_id"
                class="w-full py-2.5 bg-gray-50 hover:bg-[#5c001f]/5 border border-gray-200 text-gray-700 hover:text-[#5c001f] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
              >
                Open Proposal Workspace Details &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Proposal Dialog Modal -->
    <div 
      v-if="showCreateModal" 
      class="fixed inset-0 bg-[#0d0b26]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="bg-[#5c001f] px-6 py-4 border-b border-[#eab308]">
          <h3 class="text-base font-bold text-white">Create New Proposal Topic</h3>
          <p class="text-xs text-white/80 mt-0.5">Please specify the initial workspace project title below.</p>
        </div>

        <form @submit.prevent="handleCreateProposal" class="p-6 space-y-4">
          <div v-if="createError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {{ createError }}
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Project Title</label>
            <input 
              v-model="newProposalTitle"
              type="text"
              placeholder="e.g. AI-Driven Smart Traffic Flow System"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f]"
              required
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 hover:bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg transition-colors outline-none"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="isCreating"
              class="px-5 py-2 bg-[#5c001f] hover:bg-[#7a0029] text-white text-sm font-semibold rounded-lg transition-colors outline-none disabled:opacity-50"
            >
              {{ isCreating ? 'Creating...' : 'Create Draft' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
