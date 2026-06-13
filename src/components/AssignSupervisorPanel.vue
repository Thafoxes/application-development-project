<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Loader2, AlertTriangle, Sparkles } from 'lucide-vue-next'
import { getAISuggestedSupervisor } from '@/utils/assistant.js'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  records: {
    type: Array,
    required: true
  },
  layoutMode: {
    type: String,
    default: 'inline' // 'inline' or 'drawer'
  }
})

const emit = defineEmits(['close', 'assigned'])

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const candidates = ref([])
const isLoadingCandidates = ref(false)
const candidatesError = ref('')
const isAssigning = ref(false)

const rosterSearchQuery = ref('')
const isAnalyzing = ref(false)
const drawerAIRecommendation = ref(null)

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

const triggerDrawerAISuggest = async () => {
  if (!props.project) return
  isAnalyzing.value = true
  drawerAIRecommendation.value = null
  
  try {
    const candidatesList = filteredLecturers.value
    
    // Create a context copy with dynamic fyp_title to satisfy requirements
    const fypProjectContext = {
      ...props.project,
      fyp_title: props.project.projectTitle || props.project.title || ''
    }
    
    const rec = await getAISuggestedSupervisor(fypProjectContext, candidatesList)
    drawerAIRecommendation.value = rec
  } catch (err) {
    console.error('Error in AI Suggest:', err)
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
  if (!props.project) return
  
  if (isWorkloadFull(candidate)) {
    const ok = confirm(
      `⚠️ CAPACITY THRESHOLD EXCEEDED\n\n` +
      `Supervisor: ${candidate.full_name}\n` +
      `You are manually superseding the maximum operational capacity thresholds for this staff member.\n\n` +
      `Do you wish to force override this assignment?`
    )
    if (!ok) return
  }
  
  isAssigning.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/api/supervisor-matching/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: props.project.project_id,
        supervisor: {
          supervisor_id: candidate.user_id,
          name: candidate.full_name,
          email: candidate.email
        }
      })
    })
    
    const data = await response.json()
    if (response.ok && data.success) {
      alert(`🎉 Supervisor successfully assigned!\n\n${candidate.full_name} is now the supervisor.`)
      emit('assigned', { supervisor: candidate })
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

const filteredLecturers = computed(() => {
  // Filter out student rows: keep is_utm_staff === true or affiliation === 'UTM' or affiliation === 'Industry'
  let list = candidates.value.filter(
    u => u.is_utm_staff === true || u.affiliation === 'UTM' || u.affiliation === 'Industry'
  )
  
  // Apply Search Query
  if (rosterSearchQuery.value.trim()) {
    const query = rosterSearchQuery.value.toLowerCase()
    list = list.filter(u => {
      const nameMatch = u.full_name?.toLowerCase().includes(query)
      const tagMatch = u.expertise?.some(tag => tag.toLowerCase().includes(query))
      return nameMatch || tagMatch
    })
  }

  // Sort AI recommended supervisor to the top if present
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
  
  return list
})

onMounted(() => {
  loadCandidates()
})
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-lg p-6 font-sans">
    
    <!-- Workspace Header -->
    <div class="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
      <h3 class="text-sm font-bold text-[#5c001f] uppercase tracking-wider">
        Assign Mentor Workspace
      </h3>
      <button 
        @click="$emit('close')" 
        class="text-[#5c001f] hover:text-[#4a0019] bg-transparent border-none cursor-pointer font-bold text-xs font-sans"
      >
        ✕ Close Panel
      </button>
    </div>

    <!-- Loading candidates state -->
    <div v-if="isLoadingCandidates && candidates.length === 0" class="flex flex-col items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-[#5c001f] mb-2" />
      <p class="text-xs text-gray-500 font-semibold">Loading available candidates...</p>
    </div>

    <!-- Error candidates state -->
    <div v-else-if="candidatesError" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
      <div class="flex gap-2">
        <AlertTriangle class="w-5 h-5 text-red-600 shrink-0" />
        <p class="text-xs text-red-650 font-medium">{{ candidatesError }}</p>
      </div>
    </div>

    <div v-else class="flex flex-col gap-4">
      <!-- AI Banner Box Container -->
      <div class="bg-gray-55 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
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
          class="bg-[#5c001f] hover:bg-[#4a0019] text-white py-2 px-4 rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer disabled:opacity-50 w-fit"
        >
          <Loader2 v-if="isAnalyzing" class="w-3.5 h-3.5 animate-spin text-[#f8be17]" />
          <Sparkles v-else class="w-3.5 h-3.5 text-[#f8be17]" />
          <span>⚡ Let AI Help Me Choose</span>
        </button>
      </div>

      <!-- Roster Search input -->
      <div class="relative">
        <Search class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          v-model="rosterSearchQuery" 
          type="text" 
          placeholder="Search candidate by name or tags..." 
          class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#5c001f] bg-white text-gray-800"
        />
      </div>

      <!-- Candidate list roster -->
      <div class="flex flex-col">
        <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Available Candidates (Max 10)
        </h5>

        <!-- Empty notice gray notice card -->
        <div 
          v-if="filteredLecturers.length === 0" 
          class="flex flex-col items-center justify-center py-10 text-center text-gray-550 bg-gray-50 border border-dashed border-gray-200 rounded-xl"
        >
          <AlertTriangle class="w-8 h-8 text-gray-400 mb-2" />
          <p class="text-xs font-medium">⚠️ No users found</p>
        </div>

        <!-- Roster Grid List -->
        <div v-else :class="['grid gap-4', layoutMode === 'drawer' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2']">
          <div 
            v-for="candidate in filteredLecturers.slice(0, 10)" 
            :key="candidate.user_id"
            class="border border-gray-200 rounded-xl p-4 bg-white transition-all hover:shadow-md flex flex-col gap-2.5"
            :class="{
              'opacity-45 pointer-events-none bg-gray-50': isExaminerConflict(project, candidate)
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
                    class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200 font-sans"
                  >
                    Industry
                  </span>
                  <span 
                    v-else 
                    class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200 font-sans"
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
              <!-- Examiner conflict disabled state -->
              <span 
                v-if="isExaminerConflict(project, candidate)"
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
