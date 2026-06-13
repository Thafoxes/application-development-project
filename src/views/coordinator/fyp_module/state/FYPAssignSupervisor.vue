<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Search,
  Loader2,
  AlertTriangle,
  ClipboardList,
  UserPlus,
  X,
  Sparkles,
  UserCheck,
  ShieldAlert,
  CheckCircle2
} from 'lucide-vue-next'
import { getAISuggestedSupervisor } from '@/utils/assistant.js'

const props = defineProps({
  records: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['refresh'])

const searchQuery = ref('')
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Roster & Assignment Drawer States
const candidates = ref([])
const isLoadingCandidates = ref(false)
const candidatesError = ref('')
const isAssigning = ref(false)

const isDrawerOpen = ref(false)
const selectedProject = ref(null)
const drawerSearchQuery = ref('')
const isAnalyzing = ref(false)
const drawerAIRecommendation = ref(null)

const filteredRecords = computed(() => {
  if (!searchQuery.value.trim()) return props.records
  const query = searchQuery.value.toLowerCase()
  return props.records.filter((project) => {
    return (
      project.studentName?.toLowerCase().includes(query) ||
      project.matricNo?.toLowerCase().includes(query) ||
      project.projectTitle?.toLowerCase().includes(query) ||
      project.projectType?.toLowerCase().includes(query) ||
      project.supervisorName?.toLowerCase().includes(query)
    )
  })
})

const loadCandidates = async () => {
  isLoadingCandidates.value = true
  candidatesError.value = ''
  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator/supervisor-candidates`)
    const data = await response.json()
    if (response.ok && data.success) {
      candidates.value = data.candidates || []
    } else {
      throw new Error(data.error || 'Failed to load supervisor candidates.')
    }
  } catch (err) {
    console.error('Error loading candidates:', err)
    candidatesError.value = err.message
  } finally {
    isLoadingCandidates.value = false
  }
}

const filteredCandidates = computed(() => {
  return candidates.value.filter(u => u.is_utm_staff || u.affiliation === 'UTM' || u.affiliation === 'Industry')
})

const getAIEnginePayload = (project, candidate) => {
  if (!project || !candidate) return { score: 50, reason: 'N/A' }
  
  const title = (project.projectTitle || '').toLowerCase()
  const abstract = (project.abstract || '').toLowerCase()
  const keywords = (project.keywords || '').toLowerCase()
  const combinedText = `${title} ${abstract} ${keywords}`
  
  const name = candidate.full_name
  const expertiseList = candidate.expertise || []
  
  let matches = []
  expertiseList.forEach(exp => {
    if (combinedText.includes(exp.toLowerCase())) {
      matches.push(exp)
    }
  })
  
  const score = matches.length > 0 ? Math.min(60 + matches.length * 10, 95) : 50
  const reason = matches.length > 0 
    ? `Matches expertise in ${matches.slice(0, 2).join(', ')}.` 
    : 'Matches general supervision requirements.'
  return { score, reason }
}

const openAssignmentDrawer = (project) => {
  selectedProject.value = project
  drawerSearchQuery.value = ''
  drawerAIRecommendation.value = null
  isDrawerOpen.value = true
  
  // Lazy parse locally on drawer opening
  candidates.value = JSON.parse(JSON.stringify(mockUserData))
  
  // Async call server to sync dynamic workload data
  loadCandidates()
}

const triggerDrawerAISuggest = async () => {
  if (!selectedProject.value) return
  isAnalyzing.value = true
  drawerAIRecommendation.value = null
  
  try {
    const candidatesList = filteredDrawerCandidates.value
    
    // Create a context copy with dynamic fyp_title to satisfy requirements
    const fypProjectContext = {
      ...selectedProject.value,
      fyp_title: selectedProject.value.projectTitle || selectedProject.value.title || ''
    }
    
    const rec = await getAISuggestedSupervisor(fypProjectContext, candidatesList)
    drawerAIRecommendation.value = rec
  } catch (err) {
    console.error('Error in drawer AI Suggest:', err)
    alert('AI Assistant is currently unavailable.')
  } finally {
    isAnalyzing.value = false
  }
}

const isExaminerConflict = (project, candidate) => {
  if (!project || !project.examiners || !Array.isArray(project.examiners)) return false
  return project.examiners.some(ex => Number(ex.user_id) === Number(candidate.user_id))
}

const getWorkloadRatio = (candidate) => {
  const cap = candidate.sv_capacity !== undefined ? candidate.sv_capacity : candidate.sv_vapacity
  if (cap === 0 || cap === null || cap === undefined) {
    return '0 / ∞ (No Limit)'
  }
  const current = props.records.filter(
    p => p.supervisor && Number(p.supervisor.supervisor_id || p.supervisor.user_id) === Number(candidate.user_id)
  ).length
  return `${current} / ${cap}`
}

const isWorkloadFull = (candidate) => {
  const cap = candidate.sv_capacity !== undefined ? candidate.sv_capacity : candidate.sv_vapacity
  if (cap === 0 || cap === null || cap === undefined) {
    return false
  }
  const current = props.records.filter(
    p => p.supervisor && Number(p.supervisor.supervisor_id || p.supervisor.user_id) === Number(candidate.user_id)
  ).length
  return current >= cap
}

const confirmAssignment = async (candidate) => {
  if (!selectedProject.value) return
  
  if (isWorkloadFull(candidate)) {
    const ok = confirm(
      `⚠️ CAPACITY THRESHOLD EXCEEDED\n\n` +
      `Supervisor: ${candidate.full_name}\n` +
      `You are manually superseding the maximum operational capacity thresholds for this staff member.\n\n` +
      `Do you wish to force override this assignment?`
    )
    if (!ok) return
  }
  
  // Decoupled State Persistence: strictly update nested supervisor object
  selectedProject.value.supervisor = {
    user_id: candidate.user_id,
    full_name: candidate.full_name,
    email: candidate.email
  }
  // Make sure we also update the supervisorName and supervisorEmail computed references used in other components
  selectedProject.value.supervisorName = candidate.full_name
  selectedProject.value.supervisorEmail = candidate.email
  
  await handleAssign(selectedProject.value, candidate)
  isDrawerOpen.value = false
}

const filteredDrawerCandidates = computed(() => {
  // Filter out student profiles. Include if is_utm_staff === true or affiliation === 'UTM' or affiliation === 'Industry'.
  let list = candidates.value.filter(u => u.is_utm_staff || u.affiliation === 'UTM' || u.affiliation === 'Industry')
  
  if (drawerSearchQuery.value.trim()) {
    const query = drawerSearchQuery.value.toLowerCase()
    list = list.filter(u => {
      const nameMatch = u.full_name?.toLowerCase().includes(query)
      const tagMatch = u.expertise?.some(tag => tag.toLowerCase().includes(query))
      return nameMatch || tagMatch
    })
  }

  // Sort AI recommended supervisor to the top
  if (drawerAIRecommendation.value && drawerAIRecommendation.value.suggested_user_id) {
    const recId = Number(drawerAIRecommendation.value.suggested_user_id)
    list.sort((a, b) => {
      const aIsRec = Number(a.user_id) === recId
      const bIsRec = Number(b.user_id) === recId
      if (aIsRec && !bIsRec) return -1
      if (!aIsRec && bIsRec) return 1
      return 0
    })
  }
  
  // Limit to first 10
  return list.slice(0, 10)
})

const handleAssign = async (project, candidate) => {
  isAssigning.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/api/supervisor-matching/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: project.project_id,
        supervisor: {
          supervisor_id: candidate.user_id,
          name: candidate.full_name,
          email: candidate.email
        }
      })
    })
    
    const data = await response.json()
    if (response.ok && data.success) {
      alert(`🎉 Supervisor successfully assigned!\n\n${candidate.full_name} is now the supervisor for "${project.projectTitle}".`)
      emit('refresh')
      await loadCandidates()
    } else {
      alert(data.error || 'Failed to assign supervisor.')
    }
  } catch (err) {
    console.error('Assignment error:', err)
    alert('Failed to connect to the server to assign supervisor.')
  } finally {
    isAssigning.value = false
  }
}

const handleRefresh = () => {
  emit('refresh')
  loadCandidates()
}

onMounted(() => {
  loadCandidates()
})
</script>

<template>
  <div class="p-7">
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
          Project Database
        </p>
        <h2 class="text-[28px] font-bold text-gray-900">FYP Assign Supervisor</h2>
      </div>

      <div class="flex gap-3 items-center">
        <button
          @click="handleRefresh"
          class="bg-[#5c001f] text-white px-5 py-3 rounded-lg font-bold hover:bg-[#4a0019] transition-colors border-none cursor-pointer active:scale-95 shadow-md font-sans text-sm"
        >
          Refresh
        </button>

        <div class="relative">
          <Search class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search project..."
            class="rounded-full border border-[#d8c9bd] pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f8be17] text-sm text-gray-800 bg-white font-sans"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="rounded-lg border border-gray-300 p-8 text-center bg-white">
      <Loader2 class="w-10 h-10 animate-spin text-[#5c001f] mx-auto" />
      <p class="font-bold mt-4 text-gray-700 font-sans">Loading project records...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-lg bg-red-50 border border-red-200 p-6">
      <div class="flex gap-3">
        <AlertTriangle class="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <h3 class="font-bold text-red-700 font-sans">Failed to Load Records</h3>
          <p class="text-sm text-red-600 mt-1 font-sans">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredRecords.length === 0"
      class="rounded-lg border border-gray-300 p-8 text-center bg-white"
    >
      <ClipboardList class="w-12 h-12 text-[#5c001f] mx-auto" />
      <h3 class="font-bold text-xl mt-4 text-gray-800 font-sans">No Project Records Found</h3>
      <p class="text-gray-600 mt-2 font-sans">
        No records match your filters or search criteria.
      </p>
    </div>

    <!-- Data Table -->
    <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
      <table class="w-full text-left bg-white text-sm">
        <thead class="bg-[#5c001f] text-white">
          <tr>
            <th class="px-5 py-4 text-sm font-bold font-sans">No.</th>
            <th class="px-5 py-4 text-sm font-bold font-sans">Student</th>
            <th class="px-5 py-4 text-sm font-bold font-sans">Project Title</th>
            <th class="px-5 py-4 text-sm font-bold font-sans">Project Type</th>
            <th class="px-5 py-4 text-sm font-bold font-sans">Supervisor</th>
            <th class="px-5 py-4 text-sm font-bold font-sans">Supervisor Assignment</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="project in filteredRecords" :key="project.project_id">
            <!-- Normal Row -->
            <tr
              class="border-b border-gray-100 transition-colors"
              :class="[
                isDrawerOpen && selectedProject?.project_id === project.project_id
                  ? 'bg-[#fff8df]'
                  : 'bg-white hover:bg-[#fff8df]/40'
              ]"
            >
              <td class="px-5 py-4 font-semibold text-gray-700 font-sans">
                {{ project.project_id }}
              </td>

              <td class="px-5 py-4 font-bold text-gray-900 font-sans text-sm">
                {{ project.studentName }}
                <br />
                <span class="text-xs text-gray-500 font-medium font-sans">
                  {{ project.matricNo }}
                  <span v-if="project.cgpa">· CGPA: {{ parseFloat(project.cgpa).toFixed(2) }}</span>
                </span>
              </td>

              <td class="px-5 py-4 text-gray-700 max-w-[360px] font-medium font-sans text-sm">
                {{ project.projectTitle }}
              </td>

              <td class="px-5 py-4 font-medium text-gray-600 font-sans text-sm">
                {{ project.projectType }}
              </td>

              <td class="px-5 py-4 text-gray-700">
                <div v-if="project.supervisorName">
                  <p class="font-bold text-gray-900 font-sans text-sm">{{ project.supervisorName }}</p>
                  <p class="text-xs text-gray-500 font-sans">{{ project.supervisorEmail }}</p>
                </div>
                <div v-else>
                  <p class="text-gray-400 font-medium italic text-xs font-sans">Not Assigned Yet</p>
                </div>
              </td>
              <td class="px-5 py-4">
                <button
                  v-if="project.supervisor === null || !project.supervisor"
                  @click="openAssignmentDrawer(project)"
                  class="bg-[#5c001f] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#4a0019] transition-all cursor-pointer shadow-md active:scale-95 text-center font-sans border-none inline-flex items-center gap-1.5"
                >
                  <span>🟢 Assign Supervisor</span>
                </button>
                <button
                  v-else
                  @click="openAssignmentDrawer(project)"
                  class="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-55 transition-all cursor-pointer shadow-sm active:scale-95 text-center font-sans inline-flex items-center gap-1.5"
                >
                  <span>🔄 Change Supervisor</span>
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Backdrop Scrim Mask Layer -->
    <div 
      v-if="isDrawerOpen"
      @click="isDrawerOpen = false" 
      class="fixed inset-0 bg-black/40 z-40 transition-opacity backdrop-blur-xs"
    ></div>
    
    <!-- Right-Side Surface Sheet Box Canvas -->
    <div 
      v-if="isDrawerOpen"
      class="fixed right-0 top-0 h-full w-[520px] bg-white z-50 shadow-2xl flex flex-col border-l border-gray-200 overflow-y-auto p-6"
    >
      <!-- Drawer Header -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
        <h3 class="text-sm font-bold text-[#5c001f] uppercase tracking-wider">
          Assign Mentor Workspace
        </h3>
        <button 
          @click="isDrawerOpen = false" 
          class="text-[#5c001f] hover:text-[#4a0019] bg-transparent border-none cursor-pointer font-bold text-xs font-sans flex items-center"
        >
          ✕ Close Drawer
        </button>
      </div>

      <!-- Active Project Details Box -->
      <div v-if="selectedProject" class="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
        <span class="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Selected Project</span>
        <h4 class="font-bold text-gray-800 text-sm mt-0.5">{{ selectedProject.projectTitle }}</h4>
        <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <span>Student: {{ selectedProject.studentName }}</span>
          <span>·</span>
          <span>Matric: {{ selectedProject.matricNo }}</span>
        </div>
      </div>

      <!-- AI Banner Box Container -->
      <div class="bg-gray-55 border border-gray-200 rounded-xl p-4 mb-5 flex flex-col gap-3">
        <div class="flex items-start gap-3">
          <Sparkles class="w-5 h-5 text-[#5c001f] shrink-0 mt-0.5" />
          <div>
            <h5 class="text-xs font-bold text-[#5c001f] uppercase tracking-wide">AI Recommendation Assistant</h5>
            <p class="text-xs text-gray-700 mt-1 leading-relaxed">
              Let Gemma AI analyze this project's title and find the best matching supervisor candidate from the sliced directory list.
            </p>
          </div>
        </div>
        <button 
          @click="triggerDrawerAISuggest"
          :disabled="isAnalyzing"
          class="bg-[#5c001f] hover:bg-[#4a0019] text-white py-2 px-4 rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
        >
          <Loader2 v-if="isAnalyzing" class="w-3.5 h-3.5 animate-spin text-[#f8be17]" />
          <Sparkles v-else class="w-3.5 h-3.5 text-[#f8be17]" />
          <span>⚡ Let AI Help Me Choose</span>
        </button>
      </div>

      <!-- Roster Search input -->
      <div class="relative mb-4">
        <Search class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          v-model="drawerSearchQuery" 
          type="text" 
          placeholder="Search candidate by name or tags..." 
          class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#5c001f] bg-white text-gray-800"
        />
      </div>

      <!-- Candidate list roster -->
      <div class="flex-1 flex flex-col">
        <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Available Candidates (Max 10)
        </h5>

        <!-- Empty fallback notice gray card -->
        <div 
          v-if="filteredDrawerCandidates.length === 0" 
          class="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl"
        >
          <AlertTriangle class="w-8 h-8 text-gray-400 mb-2" />
          <p class="text-xs font-medium">⚠️ No users found</p>
        </div>

        <!-- Roster List -->
        <div v-else class="space-y-3">
          <div 
            v-for="candidate in filteredDrawerCandidates" 
            :key="candidate.user_id"
            class="border border-gray-200 rounded-xl p-4 bg-white transition-all hover:shadow-md flex flex-col gap-2.5"
            :class="{
              'opacity-45 pointer-events-none bg-gray-50': isExaminerConflict(selectedProject, candidate)
            }"
          >
            <!-- Info Row -->
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-bold text-gray-800 text-sm">
                    {{ candidate.full_name }}
                  </span>
                  <!-- Specialty Badges -->
                  <span 
                    v-if="candidate.affiliation === 'Industry'" 
                    class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-100 font-sans"
                  >
                    Industry
                  </span>
                  <span 
                    v-else 
                    class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-100 font-sans"
                  >
                    Faculty
                  </span>
                </div>
                <p class="text-[10px] text-gray-400 font-mono mt-0.5">{{ candidate.email }}</p>
              </div>

              <!-- Load Capacity -->
              <div class="text-right shrink-0">
                <span class="text-[10px] text-gray-400 block uppercase tracking-wider font-bold">Capacity</span>
                <span class="font-extrabold text-xs text-gray-700 font-mono">
                  {{ getWorkloadRatio(candidate) }}
                </span>
              </div>
            </div>

            <!-- Expertise list -->
            <div class="flex flex-wrap gap-1">
              <span 
                v-for="tag in candidate.expertise" 
                :key="tag" 
                class="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[9px] text-gray-600 font-medium font-sans"
              >
                {{ tag }}
              </span>
            </div>

            <!-- AI recommendation layout -->
            <div 
              v-if="drawerAIRecommendation && Number(drawerAIRecommendation.suggested_user_id) === Number(candidate.user_id)" 
              class="bg-[#f8be17]/10 border border-[#f8be17]/30 rounded-lg p-3 text-xs flex flex-col gap-1.5 mt-1 animate-fadeIn"
            >
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-extrabold text-[#5c001f] flex items-center gap-1">
                  <Sparkles class="w-3 h-3 text-[#5c001f]" />
                  AI Selection Match Recommendation
                </span>
                <span class="bg-[#f8be17] text-[#5c001f] font-extrabold text-[9px] px-2 py-0.5 rounded-full font-sans">
                  {{ drawerAIRecommendation.score }}% Match
                </span>
              </div>
              <p class="text-gray-700 leading-relaxed italic">
                "{{ drawerAIRecommendation.reason }}"
              </p>
            </div>

            <!-- Action button inside candidate block -->
            <div class="flex items-center justify-end mt-1 border-t border-gray-100 pt-2">
              <!-- Examiner conflict disabled state - Gray Warning Badge -->
              <span 
                v-if="isExaminerConflict(selectedProject, candidate)"
                class="text-[10px] font-extrabold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 font-sans"
              >
                🚫 Disqualified: User is Examiner
              </span>
              
              <!-- Force override warning action -->
              <button 
                v-else-if="isWorkloadFull(candidate)"
                @click="confirmAssignment(candidate)"
                class="bg-[#f8be17] text-[#5c001f] hover:bg-[#e0ab12] py-1.5 px-4 rounded-lg font-bold text-xs shadow-md border-none cursor-pointer active:scale-95 transition-colors uppercase tracking-wider flex items-center gap-1 font-sans"
              >
                <span>⚠️ Force Override</span>
              </button>

              <!-- Regular Assignment button -->
              <button 
                v-else
                @click="confirmAssignment(candidate)"
                class="bg-[#5c001f] hover:bg-[#4a0019] text-white py-1.5 px-4 rounded-lg font-bold text-xs shadow-md border-none cursor-pointer active:scale-95 transition-colors uppercase tracking-wider font-sans"
              >
                <span>Select & Allocate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.25s ease-out forwards;
}
</style>
