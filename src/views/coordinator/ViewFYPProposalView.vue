<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/common_components/AppHeader.vue'
import AppSidebar from '@/components/common_components/AppSidebar.vue'
import AppFooter from '@/components/common_components/AppFooter.vue'
import {
  FileText,
  AlertTriangle,
  ArrowLeft,
  Check,
  X,
  User,
  Mail,
  Cpu,
  Terminal,
  Shield,
  Layers,
  Network,
  Tag,
  BookOpen,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const proposalId = route.params.id

const proposal = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')
const isActioning = ref(false)

const fetchProposalDetails = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator/fyp-proposal/${proposalId}`)
    const data = await response.json()
    if (response.ok && data.success) {
      proposal.value = data.proposal
    } else {
      errorMessage.value = data.error || 'Failed to load proposal details.'
    }
  } catch (err) {
    console.error('Fetch proposal details error:', err)
    errorMessage.value = 'Failed to connect to the server.'
  } finally {
    isLoading.value = false
  }
}

const handleStatusUpdate = async (status) => {
  if (isActioning.value) return
  isActioning.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator/fyp-status/${proposalId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
    const data = await response.json()
    if (response.ok && data.success) {
      await fetchProposalDetails()
    } else {
      alert(data.error || 'Failed to update proposal status.')
    }
  } catch (err) {
    console.error('Update status error:', err)
    alert('Failed to connect to the server to update status.')
  } finally {
    isActioning.value = false
  }
}

onMounted(() => {
  fetchProposalDetails()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black">
    <AppHeader />

    <div class="flex flex-1 w-full relative">
      <AppSidebar />

      <main
        class="flex-1 flex flex-col px-[50px] py-[30px] gap-6 overflow-y-auto max-w-7xl mx-auto w-full"
      >
        <!-- Breadcrumbs -->
        <div class="text-[#5c001f] text-sm">
          <router-link to="/dashboard" class="hover:underline font-semibold text-[#5c001f]">
            Dashboard
          </router-link>
          <span class="mx-2 text-gray-500">&gt;</span>
          <router-link to="/manage-fyp" class="hover:underline font-semibold text-[#5c001f]">
            Manage FYP Proposals
          </router-link>
          <span class="mx-2 text-gray-500">&gt;</span>
          <span class="font-bold underline text-[#5c001f]">FYP Proposal Details</span>
        </div>

        <!-- Back Button -->
        <div class="flex items-center justify-between">
          <button
            @click="router.push('/manage-fyp')"
            class="flex items-center gap-2 text-[#5c001f] hover:text-[#4a0019] font-bold transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
            Back to Queue
          </button>
        </div>

        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="flex flex-col items-center justify-center py-20 bg-white border border-gray-300 rounded-2xl shadow-sm"
        >
          <div
            class="w-12 h-12 border-4 border-gray-200 border-t-[#5c001f] rounded-full animate-spin"
          ></div>
          <p class="mt-4 text-gray-600 font-semibold">Loading proposal details...</p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="errorMessage"
          class="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm flex flex-col items-center"
        >
          <AlertTriangle class="w-16 h-16 text-red-500 mb-3" />
          <h3 class="text-xl font-bold text-red-800 mb-2">Error Loading Proposal</h3>
          <p class="text-red-600 text-center mb-4">{{ errorMessage }}</p>
          <button
            @click="router.push('/manage-fyp')"
            class="bg-gray-800 text-white px-5 py-2 rounded-lg font-bold hover:bg-gray-700 transition"
          >
            Back to Proposals Queue
          </button>
        </div>

        <!-- Main Details Content -->
        <div v-else-if="proposal" class="flex flex-col gap-6">
          <!-- Main Title Banner Card -->
          <div
            class="bg-white border border-gray-300 rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div
              class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#5c001f] to-[#f8be17]"
            ></div>

            <div class="flex-1 flex flex-col gap-2">
              <span
                class="px-3 py-1 rounded-full text-xs font-bold uppercase w-fit"
                :class="
                  proposal.projectType === 'Research'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                "
              >
                {{ proposal.projectType }}
              </span>
              <h2 class="text-2xl font-bold text-[#5c001f] mt-1">{{ proposal.projectTitle }}</h2>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                <span class="flex items-center gap-1 font-semibold text-black">
                  <User class="w-4 h-4 text-gray-400" />
                  {{ proposal.studentName }} ({{ proposal.matricNo }})
                </span>
                <span class="hidden md:inline">|</span>
                <span class="flex items-center gap-1 text-gray-500">
                  <Mail class="w-4 h-4 text-gray-400" />
                  {{ proposal.studentEmail || 'No email provided' }}
                </span>
                <span class="hidden md:inline" v-if="proposal.cgpa">|</span>
                <span class="flex items-center gap-1 text-gray-800" v-if="proposal.cgpa">
                  <span class="text-xs font-bold uppercase text-gray-400">CGPA:</span>
                  <span class="font-bold text-[#5c001f]">{{
                    parseFloat(proposal.cgpa).toFixed(2)
                  }}</span>
                </span>
              </div>
              <div
                v-if="proposal.github_link || proposal.drive_link"
                class="flex flex-col gap-2 mt-3 text-xs"
              >
                <div
                  v-if="proposal.github_link"
                  class="flex flex-col sm:flex-row sm:items-center gap-2"
                >
                  <a
                    :href="proposal.github_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition inline-flex items-center gap-1.5 shadow-sm w-fit shrink-0"
                  >
                    GitHub Repository
                  </a>
                  <a
                    :href="proposal.github_link"
                    target="_blank"
                    class="text-gray-500 hover:text-gray-800 hover:underline break-all"
                  >
                    {{ proposal.github_link }}
                  </a>
                </div>
                <div
                  v-if="proposal.drive_link"
                  class="flex flex-col sm:flex-row sm:items-center gap-2"
                >
                  <a
                    :href="proposal.drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-4 py-2 bg-blue-800 text-white rounded-lg font-bold hover:bg-blue-700 transition inline-flex items-center gap-1.5 shadow-sm w-fit shrink-0"
                  >
                    Project Files (Drive)
                  </a>
                  <a
                    :href="proposal.drive_link"
                    target="_blank"
                    class="text-blue-500 hover:text-blue-800 hover:underline break-all"
                  >
                    {{ proposal.drive_link }}
                  </a>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3 min-w-[200px] border-l pl-0 md:pl-6 border-gray-200">
              <div>
                <span class="text-xs text-gray-400 uppercase font-bold block mb-1"
                  >Proposal Status</span
                >
                <span
                  class="px-3.5 py-1.5 rounded-full font-bold text-xs uppercase"
                  :class="{
                    'bg-yellow-100 text-yellow-800':
                      proposal.status?.toLowerCase() === 'submitted' ||
                      proposal.status?.toLowerCase() === 'pending',
                    'bg-green-100 text-green-800': proposal.status?.toLowerCase() === 'approved',
                    'bg-red-100 text-red-800': proposal.status?.toLowerCase() === 'rejected',
                  }"
                >
                  {{ proposal.status }}
                </span>
              </div>
              <div class="mt-1">
                <span class="text-xs text-gray-400 uppercase font-bold block mb-1">Supervisor</span>
                <span class="font-semibold text-sm">
                  {{ proposal.supervisorName || 'Not Assigned Yet' }}
                </span>
                <span v-if="proposal.supervisorEmail" class="block text-xs text-gray-500 mt-0.5">
                  {{ proposal.supervisorEmail }}
                </span>
              </div>
            </div>
          </div>

          <!-- Proposal Approval/Rejection Actions -->
          <div
            v-if="
              proposal.status?.toLowerCase() === 'submitted' ||
              proposal.status?.toLowerCase() === 'pending'
            "
            class="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div>
              <h3 class="font-bold text-yellow-900">Pending Coordinator Action</h3>
              <p class="text-sm text-yellow-800 mt-0.5">
                Review the requirements and sections below, then approve or reject this proposal.
              </p>
            </div>
            <div class="flex gap-3 shrink-0">
              <button
                @click="handleStatusUpdate('approved')"
                :disabled="isActioning"
                class="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg font-bold transition shadow flex items-center gap-1.5"
              >
                <Check class="w-4 h-4" />
                Approve Proposal
              </button>
              <button
                @click="handleStatusUpdate('rejected')"
                :disabled="isActioning"
                class="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg font-bold transition shadow flex items-center gap-1.5"
              >
                <X class="w-4 h-4" />
                Reject Proposal
              </button>
            </div>
          </div>

          <!-- Project Description / Abstract -->
          <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
            <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-4 flex items-center gap-2">
              <FileText class="w-5 h-5 text-gray-500" />
              Project Abstract / Summary
            </h3>
            <p class="text-gray-700 leading-relaxed whitespace-pre-line">{{ proposal.abstract }}</p>
            <div class="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2 items-center">
              <span class="text-xs font-bold text-gray-400 uppercase">Keywords:</span>
              <span
                v-for="kw in proposal.keywords?.split(',').map((k) => k.trim())"
                :key="kw"
                class="bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-xs"
              >
                {{ kw }}
              </span>
            </div>
          </div>

          <!-- Project Proposal Section -->
          <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
            <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-6 flex items-center gap-2">
              <FileText class="w-5 h-5 text-gray-500" />
              Project Proposal Details
            </h3>

            <div class="flex flex-col gap-6">
              <div>
                <h4 class="font-bold text-gray-900 mb-2">
                  Problem Background and Proposed Solution:
                </h4>
                <div
                  class="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                >
                  {{ proposal.details?.project_proposal?.problem_background_solution || 'N/A' }}
                </div>
              </div>

              <div>
                <h4 class="font-bold text-gray-900 mb-2">Objectives:</h4>
                <div
                  class="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                >
                  {{ proposal.details?.project_proposal?.objectives || 'N/A' }}
                </div>
              </div>

              <div>
                <h4 class="font-bold text-gray-900 mb-2">Scopes:</h4>
                <div
                  class="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                >
                  {{ proposal.details?.project_proposal?.scopes || 'N/A' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Project Requirements Grid -->
          <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
            <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-6 flex items-center gap-2">
              <Cpu class="w-5 h-5 text-gray-500" />
              Project Technical Requirements
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex gap-4 items-start p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Terminal class="w-8 h-8 text-[#5c001f] shrink-0 mt-1" />
                <div>
                  <span class="text-xs font-bold text-gray-400 uppercase block mb-0.5"
                    >Software</span
                  >
                  <p class="text-sm font-semibold text-gray-800">
                    {{ proposal.details?.project_proposal?.requirements?.software || 'N/A' }}
                  </p>
                </div>
              </div>

              <div class="flex gap-4 items-start p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Cpu class="w-8 h-8 text-[#5c001f] shrink-0 mt-1" />
                <div>
                  <span class="text-xs font-bold text-gray-400 uppercase block mb-0.5"
                    >Hardware</span
                  >
                  <p class="text-sm font-semibold text-gray-800">
                    {{ proposal.details?.project_proposal?.requirements?.hardware || 'N/A' }}
                  </p>
                </div>
              </div>

              <div class="flex gap-4 items-start p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Layers class="w-8 h-8 text-[#5c001f] shrink-0 mt-1" />
                <div>
                  <span class="text-xs font-bold text-gray-400 uppercase block mb-0.5"
                    >Technology/Technique/Method/Algorithm</span
                  >
                  <p class="text-sm font-semibold text-gray-800">
                    {{ proposal.details?.project_proposal?.requirements?.technology || 'N/A' }}
                  </p>
                </div>
              </div>

              <div class="flex gap-4 items-start p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Network class="w-8 h-8 text-[#5c001f] shrink-0 mt-1" />
                <div>
                  <span class="text-xs font-bold text-gray-400 uppercase block mb-0.5"
                    >Network Elements</span
                  >
                  <p class="text-sm font-semibold text-gray-800">
                    {{
                      proposal.details?.project_proposal?.requirements?.network_elements || 'N/A'
                    }}
                  </p>
                </div>
              </div>

              <div class="flex gap-4 items-start p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Shield class="w-8 h-8 text-[#5c001f] shrink-0 mt-1" />
                <div>
                  <span class="text-xs font-bold text-gray-400 uppercase block mb-0.5"
                    >Security Elements</span
                  >
                  <p class="text-sm font-semibold text-gray-800">
                    {{
                      proposal.details?.project_proposal?.requirements?.security_elements || 'N/A'
                    }}
                  </p>
                </div>
              </div>

              <div class="flex gap-4 items-start p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Tag class="w-8 h-8 text-[#5c001f] shrink-0 mt-1" />
                <div>
                  <span class="text-xs font-bold text-gray-400 uppercase block mb-0.5"
                    >Project Area</span
                  >
                  <p class="text-sm font-semibold text-gray-800">
                    {{ proposal.details?.project_proposal?.requirements?.project_area || 'N/A' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- NABC Section -->
          <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
            <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-6 flex items-center gap-2">
              <BookOpen class="w-5 h-5 text-gray-500" />
              NABC Framework Analysis
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <span class="text-xs font-bold text-red-800 uppercase tracking-wider block mb-1"
                  >Need (N)</span
                >
                <p class="text-sm text-gray-700 leading-relaxed">
                  {{ proposal.details?.nabc?.need || 'N/A' }}
                </p>
              </div>

              <div class="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <span class="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-1"
                  >Approach (A)</span
                >
                <p class="text-sm text-gray-700 leading-relaxed">
                  {{ proposal.details?.nabc?.approach || 'N/A' }}
                </p>
              </div>

              <div class="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <span class="text-xs font-bold text-green-800 uppercase tracking-wider block mb-1"
                  >Benefits (B)</span
                >
                <p class="text-sm text-gray-700 leading-relaxed">
                  {{ proposal.details?.nabc?.benefits || 'N/A' }}
                </p>
              </div>

              <div class="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <span class="text-xs font-bold text-orange-800 uppercase tracking-wider block mb-1"
                  >Competition (C)</span
                >
                <p class="text-sm text-gray-700 leading-relaxed">
                  {{ proposal.details?.nabc?.competition || 'N/A' }}
                </p>
              </div>

              <!-- Potential Stakeholders (System Development ONLY) -->
              <div
                v-if="proposal.projectType === 'System Development'"
                class="bg-blue-50/50 p-5 rounded-xl border border-blue-200 col-span-1 md:col-span-2"
              >
                <span class="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1"
                  >Potential Stakeholders (System Development-based ONLY)</span
                >
                <p class="text-sm text-gray-700 leading-relaxed">
                  {{ proposal.details?.nabc?.potential_stakeholders || 'N/A' }}
                </p>
              </div>

              <!-- Potential Data or Respondents (Research ONLY) -->
              <div
                v-if="proposal.projectType === 'Research'"
                class="bg-purple-50/50 p-5 rounded-xl border border-purple-200 col-span-1 md:col-span-2"
              >
                <span class="text-xs font-bold text-purple-900 uppercase tracking-wider block mb-1"
                  >Potential Data or Respondents (Research-based ONLY)</span
                >
                <p class="text-sm text-gray-700 leading-relaxed">
                  {{ proposal.details?.nabc?.potential_data_respondents || 'N/A' }}
                </p>
              </div>

              <!-- References -->
              <div
                class="bg-gray-50 p-5 rounded-xl border border-gray-200 col-span-1 md:col-span-2"
              >
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1"
                  >References</span
                >
                <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {{ proposal.details?.nabc?.references || 'N/A' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <AppFooter />
  </div>
</template>
