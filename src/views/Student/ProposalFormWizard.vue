<script setup>
import { ref, computed, onMounted } from 'vue'
import CreateFypProposalView from './CreateFypProposalView.vue'
import DocumentMilestoneUpload from './DocumentMilestoneUpload.vue'
import FinalSubmissionWorkspace from './FinalSubmissionWorkspace.vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  milestones: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['refresh'])

// Tabs selection: 'proposal', 'nabc', 'usecase', 'milestones', 'final'
const activeTab = ref('proposal')

// Global editing state toggle
const isEditing = ref(false)

const isApproved = computed(() => {
  return props.project.status === 'Approved' || props.project.status === 'Accepted'
})

const currentStepSequence = computed(() => {
  return props.project.current_step || 1
})

const currentStepMeta = computed(() => {
  return props.milestones.find(m => m.step_sequence === currentStepSequence.value)
})

// Shortcut navigation controls
const goToNabc = () => {
  activeTab.value = 'nabc'
}

const goToUseCase = () => {
  activeTab.value = 'usecase'
}

const parsedProposal = computed(() => {
  if (!props.project.initial_proposal_json) return null
  try {
    return typeof props.project.initial_proposal_json === 'string'
      ? JSON.parse(props.project.initial_proposal_json)
      : props.project.initial_proposal_json
  } catch (e) {
    return null
  }
})

const projectType = computed(() => {
  return parsedProposal.value?.project_meta?.project_type || 'System Development'
})

// NABC Canvas 7 Card Fields
const nabcNeed = ref('')
const nabcApproach = ref('')
const nabcBenefits = ref('')
const nabcCompetition = ref('')
const nabcStakeholders = ref('')
const nabcDataRespondents = ref('')
const nabcReferences = ref('')

const isSavingNabc = ref(false)
const saveError = ref('')

// Image upload overrides
const overrideShowDropzone = ref(false)
const isUploadingImage = ref(false)

// Credits Obtained and Supervisor Candidates nomination states
const creditsObtained = ref(0)
const supervisors = ref([])
const isLoadingSupervisors = ref(false)
const isSavingCredits = ref(false)
const creditsError = ref('')

const parsedNabc = computed(() => {
  if (!props.project.nabc_canvas_json) return null
  try {
    return typeof props.project.nabc_canvas_json === 'string'
      ? JSON.parse(props.project.nabc_canvas_json)
      : props.project.nabc_canvas_json
  } catch (e) {
    return null
  }
})

onMounted(async () => {
  if (parsedNabc.value) {
    nabcNeed.value = parsedNabc.value.need || ''
    nabcApproach.value = parsedNabc.value.approach || ''
    nabcBenefits.value = parsedNabc.value.benefits || ''
    nabcCompetition.value = parsedNabc.value.competition || ''
    nabcStakeholders.value = parsedNabc.value.stakeholders || ''
    nabcDataRespondents.value = parsedNabc.value.data_respondents || ''
    nabcReferences.value = parsedNabc.value.references || ''
  }

  // Set initial credits obtained
  if (parsedProposal.value?.student_meta?.credits_obtained !== undefined) {
    creditsObtained.value = parsedProposal.value.student_meta.credits_obtained
  } else {
    creditsObtained.value = 35 // fallback baseline SECJH1H1 mock structure
  }

  // Retrieve shared supervisor candidates
  isLoadingSupervisors.value = true
  const token = localStorage.getItem('token')
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${apiUrl}/api/lookups/supervisor-candidates`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const data = await res.json()
    if (data.success) {
      supervisors.value = data.candidates || []
    }
  } catch (err) {
    console.error("Failed to load supervisor candidates:", err)
  } finally {
    isLoadingSupervisors.value = false
  }
})

const isTabDisabled = computed(() => {
  return !isEditing.value || isApproved.value
})

const nominatedSupervisor = computed(() => {
  if (!supervisors.value.length) return props.project.supervisor
  return supervisors.value.find(s => s.user_id === props.project.supervisor_id) || props.project.supervisor
})

const saveCredits = async () => {
  isSavingCredits.value = true
  creditsError.value = ''
  const token = localStorage.getItem('token')
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${apiUrl}/api/projects/${props.project.project_id}/credits`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ credits: creditsObtained.value })
    })
    if (res.ok) {
      alert('Credit Obtained count updated successfully!')
      emit('refresh')
    } else {
      const data = await res.json()
      creditsError.value = data.error || 'Failed to update credits.'
    }
  } catch (err) {
    creditsError.value = 'Failed to connect to the server.'
  } finally {
    isSavingCredits.value = false
  }
}

const nominateSupervisor = async (supervisorId) => {
  const token = localStorage.getItem('token')
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${apiUrl}/api/projects/${props.project.project_id}/nominate-supervisor`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ supervisor_id: supervisorId })
    })
    if (res.ok) {
      alert('Nominated supervisor updated successfully!')
      emit('refresh')
    } else {
      alert('Failed to save supervisor nomination.')
    }
  } catch (err) {
    console.error(err)
  }
}

const saveNabcCanvas = async () => {
  isSavingNabc.value = true
  saveError.value = ''
  const token = localStorage.getItem('token')

  const payload = {
    need: nabcNeed.value,
    approach: nabcApproach.value,
    benefits: nabcBenefits.value,
    competition: nabcCompetition.value,
    stakeholders: nabcStakeholders.value,
    data_respondents: nabcDataRespondents.value,
    references: nabcReferences.value
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${apiUrl}/api/projects/${props.project.project_id}/nabc`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      alert('NABC Canvas framework matrix successfully saved!')
      emit('refresh')
    } else {
      const data = await res.json()
      saveError.value = data.error || 'Failed to update NABC canvas.'
    }
  } catch (err) {
    saveError.value = 'Failed to connect to the server.'
  } finally {
    isSavingNabc.value = false
  }
}

// Diagram upload handlers
const handleImageUpload = async (file) => {
  isUploadingImage.value = true
  const token = localStorage.getItem('token')
  const payload = new FormData()
  payload.append('use_case_image', file)

  try {
    const res = await fetch(`${apiUrl}/api/projects/${props.project.project_id}/nabc`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: payload
    })
    if (res.ok) {
      overrideShowDropzone.value = false
      alert('Use Case Diagram successfully uploaded!')
      emit('refresh')
    } else {
      alert('Image upload failed. Please try again.')
    }
  } catch (err) {
    console.error(err)
  } finally {
    isUploadingImage.value = false
  }
}

const onDropFile = (e) => {
  if (isApproved.value) return
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    handleImageUpload(file)
  }
}

const onSelectFile = (e) => {
  if (isApproved.value) return
  const file = e.target.files[0]
  if (file) {
    handleImageUpload(file)
  }
}

const handleSaved = () => {
  isEditing.value = false
  emit('refresh')
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
</script>

<template>
  <div class="space-y-6 font-['Inter'] text-black">
    <!-- 1. ACTION REGISTRY HEADER BAR (Global Area) -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold text-gray-[#5c001f] tracking-tight">{{ project.title || 'Untitled Proposal' }}</h2>
          <span class="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded">ID: #{{ project.project_id }}</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">Cohort Academic Workspace — Managed choices preference list</p>
      </div>

      <div class="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-end">
        <!-- Status Badge -->
        <span 
          class="px-3 py-1.5 text-xs font-semibold rounded-lg border uppercase tracking-wider shadow-sm"
          :class="getStatusBadgeClass(project.status)"
        >
          {{ project.status }}
        </span>

        <!-- Edit Toggle Button (Hidden/Disabled if Approved/Accepted) -->
        <button 
          v-if="!isApproved"
          @click="isEditing = !isEditing"
          class="px-4 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm"
          :class="isEditing 
            ? 'bg-yellow-50 text-yellow-800 border-yellow-300 hover:bg-yellow-100' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
        >
          <span>✏️</span>
          {{ isEditing ? 'Lock Information' : 'Edit Information' }}
        </button>

        <!-- Navigation Quick Links -->
        <!-- <button 
          @click="goToNabc"
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 transition-all flex items-center gap-1.5 shadow-sm"
        >
          Go to NABC Workspace
        </button>
        <button 
          @click="goToUseCase"
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 transition-all flex items-center gap-1.5 shadow-sm"
        >
          View Use Case Section
        </button> -->
      </div>
    </div>

    <!-- 2. CORE SYSTEM TABBED MATRICES LAYOUT -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <!-- Tabs Selector Headers -->
      <div class="bg-gray-50 border-b border-gray-200 flex flex-wrap">
         <button 
          @click="activeTab = 'credits'"
          class="px-6 py-4 text-sm font-bold border-b-2 transition-all outline-none"
          :class="activeTab === 'credits' ? 'border-[#5c001f] text-[#5c001f] bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'"
        >
          Credit Obtained
        </button>
        <button 
          @click="activeTab = 'proposal'"
          class="px-6 py-4 text-sm font-bold border-b-2 transition-all outline-none"
          :class="activeTab === 'proposal' ? 'border-[#5c001f] text-[#5c001f] bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'"
        >
          Project Baseline Proposal
        </button>
        <button 
          @click="activeTab = 'nabc'"
          class="px-6 py-4 text-sm font-bold border-b-2 transition-all outline-none"
          :class="activeTab === 'nabc' ? 'border-[#5c001f] text-[#5c001f] bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'"
        >
          NABC Supplementary Canvas
        </button>
        <button 
          @click="activeTab = 'usecase'"
          class="px-6 py-4 text-sm font-bold border-b-2 transition-all outline-none"
          :class="activeTab === 'usecase' ? 'border-[#5c001f] text-[#5c001f] bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'"
        >
          Use Case Specification Artifact
        </button>
       
        <button 
          @click="activeTab = 'supervisor'"
          class="px-6 py-4 text-sm font-bold border-b-2 transition-all outline-none"
          :class="activeTab === 'supervisor' ? 'border-[#5c001f] text-[#5c001f] bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'"
        >
          Supervisor Nomination
        </button>
        <button 
          @click="activeTab = 'milestones'"
          class="px-6 py-4 text-sm font-bold border-b-2 transition-all outline-none"
          :class="activeTab === 'milestones' ? 'border-[#5c001f] text-[#5c001f] bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'"
        >
          Milestone Submissions
        </button>
        <button 
          @click="activeTab = 'final'"
          class="px-6 py-4 text-sm font-bold border-b-2 transition-all outline-none"
          :class="activeTab === 'final' ? 'border-[#5c001f] text-[#5c001f] bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'"
        >
          Final Deliverables
        </button>
      </div>

      <!-- Tab Display Contents -->
      <div class="p-6 md:p-8 bg-white">
        <!-- TAB MODULE 1: Project Baseline Proposal -->
        <div v-if="activeTab === 'proposal'">
          <CreateFypProposalView 
            :project="project" 
            :is-editing="isEditing" 
            @created="handleSaved" 
          />
        </div>

        <!-- TAB MODULE 2: NABC Supplementary Canvas -->
        <div v-else-if="activeTab === 'nabc'" class="space-y-6">
          <div class="flex items-center justify-between border-b border-gray-150 pb-3">
            <div>
              <h3 class="text-lg font-bold text-[#5c001f]">MJIIT Faculty NABC Canvas Matrix</h3>
              <p class="text-xs text-gray-500 mt-0.5">Please populate the structured content cards below to describe your system requirements.</p>
            </div>
            <!-- Global save matric button -->
            <button 
              v-if="!isApproved && isEditing"
              @click="saveNabcCanvas"
              :disabled="isSavingNabc"
              class="px-5 py-2.5 bg-[#5c001f] hover:bg-[#7a0029] text-white text-xs font-bold rounded-lg shadow transition-colors disabled:opacity-50"
            >
              {{ isSavingNabc ? 'Saving Canvas...' : 'Save NABC Canvas Framework' }}
            </button>
          </div>

          <!-- Lock state warning banner -->
          <div v-if="isApproved" class="p-4 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200 flex items-start gap-2.5">
            <span class="text-base leading-none">🔒</span>
            <div>
              <span class="font-bold">Locked Document:</span> This proposal and NABC canvas framework has been formally accepted by your Coordinator and Supervisor. Modifications are locked.
            </div>
          </div>
          
          

          <div v-else-if="!isEditing" class="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-150 flex items-start gap-2">
            <div>
              To submit modifications to this canvas, please toggle the global <span class="font-bold">✏️ Edit Information</span> button at the top right of the workspace.
            </div>
          </div>
          <!-- CANVAS LEGEND NOTES ELEMENT (Sticky Form Footer Area) -->
          <div class="mt-8 bg-gray-50 rounded-xl border border-gray-250 p-6 shadow-sm">
            <h4 class="text-sm font-bold text-[#5c001f] mb-3 flex items-center gap-1">
              <span>💡</span> NABC Canvas Operational Field Guidelines & Definitions
            </h4>
            <ul class="space-y-2.5 text-xs text-gray-600 leading-relaxed list-disc pl-5">
              <li><strong>Need (N):</strong> Specific need or problem that the proposed system addresses within the given domain. Provides strong and relevant evidence to support the need.</li>
              <li><strong>Approach (A):</strong> Clearly laid-out plan for how the proposed system will work (eg: mobile app, cross-platforms, cloud-based, or uses AI/smart technology etc.), explaining how its main features operate in detail.</li>
              <li><strong>Benefit (B):</strong> Significant benefits the proposed system offers to the specific users.</li>
              <li><strong>Competitor (C):</strong> Other similar products or solutions already available, emphasizing how the proposed system is different.</li>
              <li><strong>Potential Stakeholder:</strong> Individual/person, group of people, or an organisation that can affect or be affected by the project //Evidence of stakeholder agreement/willingness.</li>
              <li><strong>Potential Data/Respondent:</strong> Evidence of data sources or respondents are relevant and aligned with the research objectives.</li>
              <li><strong>References:</strong> References to other documents, books or related online resources must be properly cited in the text.</li>
            </ul>
          </div>

          <div v-if="saveError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {{ saveError }}
          </div>

          <!-- Fixed Stack of 7 Cards -->
          <div class="space-y-6">
            <!-- 1. Need -->
            <div class="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 class="text-sm font-bold text-gray-900">1. Need (N)</h4>
                <span class="text-[10px] uppercase font-bold text-[#5c001f]">Checklist Option</span>
              </div>
              <textarea 
                v-model="nabcNeed" 
                rows="4" 
                :disabled="isTabDisabled"
                placeholder="Describe the specific need or gap in detail..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
              ></textarea>
            </div>

            <!-- 2. Approach -->
            <div class="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 class="text-sm font-bold text-gray-900">2. Approach (A)</h4>
                <span class="text-[10px] uppercase font-bold text-[#5c001f]">Checklist Option</span>
              </div>
              <textarea 
                v-model="nabcApproach" 
                rows="4" 
                :disabled="isTabDisabled"
                placeholder="Describe your technical and project architecture approach..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
              ></textarea>
            </div>

            <!-- 3. Benefits -->
            <div class="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 class="text-sm font-bold text-gray-900">3. Benefits (B)</h4>
                <span class="text-[10px] uppercase font-bold text-[#5c001f]">Checklist Option</span>
              </div>
              <textarea 
                v-model="nabcBenefits" 
                rows="4" 
                :disabled="isTabDisabled"
                placeholder="Detail the quantifiable benefits and metrics..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
              ></textarea>
            </div>

            <!-- 4. Competition -->
            <div class="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 class="text-sm font-bold text-gray-900">4. Competition (C)</h4>
                <span class="text-[10px] uppercase font-bold text-[#5c001f]">Checklist Option</span>
              </div>
              <textarea 
                v-model="nabcCompetition" 
                rows="4" 
                :disabled="isTabDisabled"
                placeholder="List existing alternatives and describe differentiation..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
              ></textarea>
            </div>

            <!-- 5. Potential Stakeholders (System Development-based ONLY) -->
            <div 
              v-if="projectType !== 'Research'" 
              class="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4"
            >
              <div class="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 class="text-sm font-bold text-gray-900">5. Potential Stakeholders</h4>
                <span class="text-[10px] uppercase font-bold text-[#5c001f]">Development-based Only</span>
              </div>
              <textarea 
                v-model="nabcStakeholders" 
                rows="4" 
                :disabled="isTabDisabled"
                placeholder="Identify target users, target organizations, and proof of stakeholder willingness..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
              ></textarea>
            </div>

            <!-- 6. Potential Data or Respondents (Research-based ONLY) -->
            <div 
              v-if="projectType === 'Research'" 
              class="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4"
            >
              <div class="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 class="text-sm font-bold text-gray-900">6. Potential Data or Respondents</h4>
                <span class="text-[10px] uppercase font-bold text-[#5c001f]">Research-based Only</span>
              </div>
              <textarea 
                v-model="nabcDataRespondents" 
                rows="4" 
                :disabled="isTabDisabled"
                placeholder="Describe your data sources, survey target respondents, or test datasets..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
              ></textarea>
            </div>

            <!-- 7. References -->
            <div class="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 class="text-sm font-bold text-gray-900">7. References</h4>
                <span class="text-[10px] uppercase font-bold text-[#5c001f]">Bibliography</span>
              </div>
              <textarea 
                v-model="nabcReferences" 
                rows="4" 
                :disabled="isTabDisabled"
                placeholder="Enter APA-formatted bibliography references here..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
              ></textarea>
            </div>
          </div>

          
        </div>

        <!-- TAB MODULE 3: Use Case Specification Artifact -->
        <div v-else-if="activeTab === 'usecase'" class="space-y-6">
          <div class="border-b border-gray-150 pb-3">
            <h3 class="text-lg font-bold text-[#5c001f]">Use Case Diagram Artifact Repository</h3>
            <p class="text-xs text-gray-500 mt-0.5">Maintain system diagram model links straight inside the active cohort session workspace.</p>
          </div>

          <!-- Live Image Prev Window Screen -->
          <div 
            v-if="parsedNabc && parsedNabc.use_case_diagram_url && !overrideShowDropzone"
            class="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-xl"
          >
            <div class="bg-white rounded-lg border border-gray-300 p-3 shadow-md max-w-3xl overflow-hidden flex flex-col items-center">
              <img 
                :src="`${apiUrl}${parsedNabc.use_case_diagram_url}`" 
                alt="MJIIT Use Case Diagram" 
                class="max-h-[26rem] rounded object-contain"
              />
              <p class="text-xs font-semibold text-gray-500 mt-3 italic">
                Fig 1.1: System Use Case Diagram Configuration Model Grid Mapping
              </p>
            </div>

            <!-- Replace trigger if not locked -->
            <button 
              v-if="!isApproved"
              @click="overrideShowDropzone = true"
              class="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Change Diagram Graphic Artifact
            </button>
          </div>

          <!-- Interactive Dropzone -->
          <div v-else class="space-y-4">
            <div v-if="isApproved" class="p-4 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200 flex items-start gap-2.5">
              <span class="text-base leading-none">🔒</span>
              <div>
                <span class="font-bold">Locked File Zone:</span> Visual diagram configuration model submissions are locked.
              </div>
            </div>

            <div 
              v-else
              @dragover.prevent
              @drop.prevent="onDropFile"
              class="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer group p-12 text-center"
            >
              <input 
                type="file" 
                @change="onSelectFile" 
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept="image/*"
              />
              <div class="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 group-hover:text-[#5c001f] mb-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="text-sm text-gray-700 font-bold">
                  {{ isUploadingImage ? 'Uploading diagram...' : 'Drag and drop your Proposed System Use Case Diagram artifact graphic file here (.png, .jpeg)' }}
                </p>
                <p class="text-xs text-gray-400 mt-1">or Select Local Files to search system storage</p>
              </div>
            </div>

            <!-- Cancel override trigger -->
            <div v-if="overrideShowDropzone" class="flex justify-start">
              <button 
                @click="overrideShowDropzone = false"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel Re-upload
              </button>
            </div>
          </div>
        </div>

        <!-- TAB MODULE: Credit Obtained -->
        <div v-else-if="activeTab === 'credits'" class="space-y-6">
          <div class="border-b border-gray-150 pb-3 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-[#5c001f]">Course Credit Progress</h3>
              <p class="text-xs text-gray-500 mt-0.5">Please confirm the total academic credit points you have taken and passed.</p>
            </div>
            
            <button 
              v-if="!isApproved && isEditing"
              @click="saveCredits"
              :disabled="isSavingCredits"
              class="px-5 py-2.5 bg-[#5c001f] hover:bg-[#7a0029] text-white text-xs font-bold rounded-lg shadow transition-colors disabled:opacity-50"
            >
              {{ isSavingCredits ? 'Saving Credits...' : 'Save Credits Count' }}
            </button>
          </div>

          <div v-if="creditsError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {{ creditsError }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Visual Credit Gauge Card -->
            <div class="bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col justify-center items-center text-center shadow-sm">
              <span class="text-[10px] uppercase font-bold text-[#5c001f] tracking-wider mb-2">Graduation Progress Meter</span>
              <div class="text-3xl font-extrabold text-gray-900 mb-1">
                {{ creditsObtained || 0 }} <span class="text-sm font-semibold text-gray-400">/ 128</span>
              </div>
              <p class="text-[11px] font-bold text-gray-500 mb-4">Course Credits Obtained (SECJH1H1 Cohort)</p>
              
              <!-- Progress Bar -->
              <div class="w-full bg-gray-200 rounded-full h-3 max-w-xs shadow-inner overflow-hidden">
                <div 
                  class="bg-[#5c001f] h-3 rounded-full transition-all duration-500" 
                  :style="`width: ${Math.min(100, ((creditsObtained || 0) / 128) * 100)}%`"
                ></div>
              </div>
            </div>

            <!-- Input Fields -->
            <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
              <label class="block text-sm font-bold text-gray-900">
                Credit Obtained <span class="text-red-500">*</span>
              </label>
              <p class="text-xs text-gray-500 leading-normal mb-2">
                * Include only credits that you had taken & passed
              </p>
              <input 
                v-model.number="creditsObtained" 
                type="number" 
                min="0"
                max="150"
                :disabled="isTabDisabled"
                placeholder="Your answer"
                class="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
          </div>
        </div>

        <!-- TAB MODULE: Supervisor Nomination -->
        <div v-else-if="activeTab === 'supervisor'" class="space-y-6">
          <div class="border-b border-gray-150 pb-3">
            <h3 class="text-lg font-bold text-[#5c001f]">Supervisor Nomination Panel</h3>
            <p class="text-xs text-gray-500 mt-0.5">Browse academic experts and nominate a supervisor to oversee your project choice.</p>
          </div>

          <!-- Nominated Supervisor banner -->
          <div class="bg-[#5c001f] text-white rounded-xl p-6 shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span class="text-[10px] uppercase font-bold text-[#F8BE17] tracking-widest block mb-1">Active Preference</span>
              <h4 class="text-lg font-bold">
                {{ nominatedSupervisor ? nominatedSupervisor.full_name : 'No Supervisor Nominated Yet' }}
              </h4>
              <p class="text-xs text-white/80 mt-1">
                {{ nominatedSupervisor ? nominatedSupervisor.email : 'Nominate one of the candidate experts listed below.' }}
              </p>
            </div>
            <div class="px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 text-xs font-semibold uppercase tracking-wider">
              Status: {{ project.supervisor_id ? 'Nomination Active' : 'Unassigned' }}
            </div>
          </div>

          <!-- Supervisor grid -->
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <h4 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Academic Roster Candidates</h4>
              <div v-if="isLoadingSupervisors" class="text-xs text-gray-500">Loading roster...</div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div 
                v-for="sv in supervisors" 
                :key="sv.user_id" 
                class="bg-white rounded-xl border p-5 space-y-4 flex flex-col justify-between shadow-sm transition-all hover:shadow-md"
                :class="project.supervisor_id === sv.user_id ? 'border-[#5c001f] ring-1 ring-[#5c001f]' : 'border-gray-200'"
              >
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <h5 class="font-bold text-gray-900 text-sm leading-tight">{{ sv.full_name }}</h5>
                    <span 
                      class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider"
                      :class="sv.is_utm_staff ? 'bg-[#5c001f]/10 text-[#5c001f]' : 'bg-[#eab308]/15 text-[#854d0e]'"
                    >
                      {{ sv.affiliation }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1 truncate">{{ sv.email }}</p>
                  <p v-if="sv.phone_number" class="text-[10px] text-gray-400 mt-0.5">{{ sv.phone_number }}</p>

                  <!-- Expertise list -->
                  <div class="flex flex-wrap gap-1 mt-3">
                    <span 
                      v-for="exp in sv.expertise" 
                      :key="exp" 
                      class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium"
                    >
                      {{ exp }}
                    </span>
                  </div>
                </div>

                <div class="pt-3 border-t border-gray-100 space-y-3">
                  <!-- Slots occupancy indicator -->
                  <div class="flex justify-between items-center text-[10px] text-gray-500">
                    <span>Supervisor Slots Occupied:</span>
                    <span class="font-bold text-gray-700">
                      {{ sv.current_capacity }} / {{ sv.max_capacity }}
                    </span>
                  </div>
                  
                  <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      class="h-1.5 rounded-full transition-all duration-300"
                      :class="sv.current_capacity >= sv.max_capacity ? 'bg-red-500' : 'bg-green-600'"
                      :style="`width: ${Math.min(100, (sv.current_capacity / sv.max_capacity) * 100)}%`"
                    ></div>
                  </div>

                  <!-- Nominate button -->
                  <button 
                    v-if="!isApproved"
                    @click="nominateSupervisor(sv.user_id)"
                    :disabled="project.supervisor_id === sv.user_id || sv.current_capacity >= sv.max_capacity"
                    class="w-full py-2 text-xs font-bold rounded-lg border transition-all shadow-sm flex items-center justify-center gap-1.5"
                    :class="project.supervisor_id === sv.user_id 
                      ? 'bg-green-50 text-green-700 border-green-300' 
                      : sv.current_capacity >= sv.max_capacity 
                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white hover:bg-gray-50 text-[#5c001f] border-[#5c001f]/35'"
                  >
                    <span>{{ project.supervisor_id === sv.user_id ? '✓ Nominated' : 'Nominate Supervisor' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB MODULE 4: Milestone Submissions -->
        <div v-else-if="activeTab === 'milestones'">
          <div v-if="currentStepMeta">
            <DocumentMilestoneUpload 
              :project="project"
              :step-meta="currentStepMeta"
              @refresh="emit('refresh')"
            />
          </div>
          <div v-else class="text-center py-12 border border-gray-200 rounded-xl bg-gray-50">
            <span class="text-3xl">🎉</span>
            <h4 class="text-base font-bold text-gray-700 mt-2">All Milestones Completed!</h4>
            <p class="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Your draft chapters have been successfully logged. Please check final submission slots.</p>
          </div>
        </div>

        <!-- TAB MODULE 5: Final Deliverables -->
        <div v-else-if="activeTab === 'final'">
          <FinalSubmissionWorkspace 
            :project="project" 
            @refresh="emit('refresh')" 
          />
        </div>
      </div>
    </div>
  </div>
</template>
