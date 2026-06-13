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

// Workspace State
const activeAssignmentProject = ref(null)
const candidates = ref([])
const isLoadingCandidates = ref(false)
const candidatesError = ref('')
const isAssigning = ref(false)
const hoveredCandidate = ref(null)

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
  // Loop through a non-student array (filtering academic staff where is_utm_staff: true or independent industry experts where affiliation: 'Industry')
  return candidates.value.filter(u => u.is_utm_staff || u.affiliation === 'Industry')
})

const isDisqualified = (project, candidate) => {
  if (!project.examiners || !Array.isArray(project.examiners)) return false
  return project.examiners.some(ex => Number(ex.user_id) === Number(candidate.user_id))
}

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
  
  // Custom mock rules matching backend suggestions
  if (candidate.user_id === 2) { // Dr. Sarah
    return {
      score: 95,
      reason: "High semantic match of 95% is driven by the alignment of your web technologies requirements with Dr. Sarah's publications in Web Engineering and Agile Methodologies."
    }
  } else if (candidate.user_id === 4) { // Prof. John Smith
    return {
      score: 82,
      reason: "Strong matching score of 82% is established due to overlap in software quality metrics and student dashboard validation scopes."
    }
  } else if (candidate.user_id === 3) { // Dr. Neo
    return {
      score: 75,
      reason: "Works in AI systems and intelligent databases, making them a solid technical fit for the system design components."
    }
  } else if (candidate.user_id === 10) { // Robert Chen
    return {
      score: 91,
      reason: "Industry relevance score of 91% is determined by the cybersecurity aspects of the project matching Robert's expertise in Network Auditing."
    }
  }
  
  let score = 60 + (candidate.user_id * 3) % 15
  if (matches.length > 0) {
    score = Math.min(85 + matches.length * 4, 98)
  }
  
  let reason = ''
  if (matches.length > 0) {
    reason = `Excellent alignment identified between the student's project scope and ${name}'s specialized expertise in ${matches.slice(0, 2).join(' & ')}.`
  } else {
    reason = `Suitable candidate matches general supervision profile for ${project.projectType} projects, with focus in ${expertiseList.slice(0, 2).join(', ') || 'related areas'}.`
  }
  
  return { score, reason }
}

const topMatchCandidate = computed(() => {
  if (!activeAssignmentProject.value || filteredCandidates.value.length === 0) return null
  
  let bestCand = null
  let maxScore = -1
  
  filteredCandidates.value.forEach(cand => {
    const payload = getAIEnginePayload(activeAssignmentProject.value, cand)
    if (payload.score > maxScore) {
      maxScore = payload.score
      bestCand = cand
    }
  })
  
  return bestCand
})

const activeAIBannerPayload = computed(() => {
  if (!activeAssignmentProject.value) return null
  
  const targetCandidate = hoveredCandidate.value || topMatchCandidate.value
  if (!targetCandidate) {
    return {
      score: 0,
      reason: "No suitable supervisor candidates found in directory."
    }
  }
  
  const payload = getAIEnginePayload(activeAssignmentProject.value, targetCandidate)
  return {
    candidateName: targetCandidate.full_name,
    isHovered: !!hoveredCandidate.value,
    score: payload.score,
    reason: payload.reason
  }
})

const openAssignmentWorkspace = (project) => {
  if (activeAssignmentProject.value?.project_id === project.project_id) {
    activeAssignmentProject.value = null
  } else {
    activeAssignmentProject.value = project
    hoveredCandidate.value = null
  }
}

const closeWorkspace = () => {
  activeAssignmentProject.value = null
  hoveredCandidate.value = null
}

const handleAssign = async (project, candidate) => {
  const isOverCapacity = candidate.max_capacity > 0 && candidate.current_capacity >= candidate.max_capacity
  
  if (isOverCapacity) {
    const confirmOverride = confirm(
      `⚠️ CAPACITY THRESHOLD EXCEEDED\n\n` +
      `Supervisor: ${candidate.full_name}\n` +
      `Current Capacity: ${candidate.current_capacity} student(s)\n` +
      `Maximum Quota: ${candidate.max_capacity} student(s)\n\n` +
      `You are manually superseding the maximum operational capacity thresholds for this staff member.\n\n` +
      `Do you wish to force override this assignment?`
    )
    if (!confirmOverride) return
  }
  
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
      activeAssignmentProject.value = null
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
            <th class="px-5 py-4 text-sm font-bold font-sans">Status</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="project in filteredRecords" :key="project.project_id">
            <!-- Normal Row -->
            <tr
              class="border-b border-gray-100 transition-colors"
              :class="[
                activeAssignmentProject?.project_id === project.project_id
                  ? 'bg-[#fff8df] hover:bg-[#fff8df]'
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
                <div v-else class="flex flex-col gap-1.5">
                  <p class="text-gray-400 font-medium italic text-xs font-sans">Not Assigned Yet</p>
                  <button
                    v-if="project.status?.toLowerCase() === 'approved'"
                    @click="openAssignmentWorkspace(project)"
                    class="bg-[#5c001f] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4a0019] transition-all border-none cursor-pointer flex items-center justify-center gap-1 shadow-md w-fit active:scale-95 text-center font-sans"
                  >
                    <UserPlus class="w-3.5 h-3.5" />
                    Assign Supervisor
                  </button>
                </div>
              </td>

              <td class="px-5 py-4">
                <div class="flex flex-col gap-1">
                  <span
                    class="px-3 py-1 rounded-full text-xs font-bold uppercase w-fit font-sans"
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
                  <span v-if="project.status?.toLowerCase() === 'rejected' && project.coordinator_comments" class="text-xs text-red-600 max-w-[150px] font-sans">
                    <strong>Reason:</strong> {{ project.coordinator_comments }}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Expanded Workspace Panel Row (Inline Context Preservation) -->
            <tr v-if="activeAssignmentProject?.project_id === project.project_id" class="bg-gray-50">
              <td colspan="6" class="px-8 py-6 border-b border-gray-200">
                <div class="border border-[#5c001f]/20 rounded-xl bg-white shadow-xl overflow-hidden animate-fadeIn">
                  
                  <!-- Workspace Header -->
                  <div class="bg-[#5c001f] text-white px-6 py-4 flex justify-between items-center border-b border-[#f8be17]/30">
                    <div>
                      <span class="text-[10px] uppercase tracking-[0.2em] text-[#f8be17] font-bold font-sans">
                        Supervisor Assignment Workspace
                      </span>
                      <h3 class="text-base font-bold text-white mt-0.5 leading-tight flex items-center gap-2 font-sans">
                        <span>{{ project.projectTitle }}</span>
                      </h3>
                      <div class="flex items-center gap-2 mt-1.5 text-xs text-white/90 font-sans">
                        <span class="bg-[#f8be17] text-[#5c001f] font-bold px-2 py-0.5 rounded">
                          Student: {{ project.studentName }}
                        </span>
                        <span>·</span>
                        <span class="bg-white/20 px-2 py-0.5 rounded">
                          Matric: {{ project.matricNo }}
                        </span>
                        <span v-if="project.cgpa">·</span>
                        <span v-if="project.cgpa" class="bg-white/20 px-2 py-0.5 rounded">
                          CGPA: {{ parseFloat(project.cgpa).toFixed(2) }}
                        </span>
                      </div>
                    </div>
                    <button
                      @click="closeWorkspace"
                      class="text-white/80 hover:text-[#f8be17] font-bold text-xs bg-transparent border border-white/20 hover:border-[#f8be17]/40 px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 self-start font-sans"
                    >
                      <X class="w-4 h-4" />
                      ✕ Close Workspace
                    </button>
                  </div>

                  <!-- Gemma 4 AI Matching Banner -->
                  <div class="bg-[#f8be17]/10 border-b border-[#f8be17]/25 px-6 py-4 flex items-start gap-4">
                    <div class="bg-[#f8be17] text-[#5c001f] rounded-lg px-3 py-2 font-bold text-center shrink-0 flex flex-col items-center justify-center min-w-[70px] shadow-sm font-sans">
                      <span class="text-[9px] uppercase tracking-wider leading-none">Match</span>
                      <span class="text-2xl leading-none mt-1 font-extrabold font-mono text-[#5c001f]">{{ activeAIBannerPayload?.score }}%</span>
                    </div>
                    
                    <div class="flex-1">
                      <div class="flex items-center gap-2 font-sans">
                        <span class="bg-[#5c001f] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          Gemma 4 AI Insight
                        </span>
                        <span class="text-xs text-[#5c001f] font-bold">
                          {{ activeAIBannerPayload?.isHovered ? '⚡ Live Previewing:' : '🏆 Best AI Match:' }}
                        </span>
                        <span class="text-xs font-bold text-[#5c001f]">
                          {{ activeAIBannerPayload?.candidateName }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-700 mt-1.5 italic font-medium leading-relaxed font-sans">
                        "{{ activeAIBannerPayload?.reason }}"
                      </p>
                    </div>
                  </div>

                  <!-- Candidate Directory Section -->
                  <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                      <div>
                        <h4 class="text-sm font-bold text-[#5c001f] uppercase tracking-wider font-sans">
                          Supervisor Candidates Directory
                        </h4>
                        <p class="text-xs text-gray-500 mt-0.5 font-sans">
                          List of university faculty staff and verified industry professionals. Hover on any candidate to see details and AI match score.
                        </p>
                      </div>
                      
                      <div v-if="isLoadingCandidates" class="flex items-center gap-1.5 text-xs text-gray-500 font-medium font-sans">
                        <Loader2 class="w-3.5 h-3.5 animate-spin text-[#5c001f]" />
                        <span>Fetching capacities...</span>
                      </div>
                    </div>

                    <!-- Loader inside directory -->
                    <div v-if="isLoadingCandidates && candidates.length === 0" class="py-12 text-center border rounded-lg bg-gray-50 border-gray-200">
                      <Loader2 class="w-8 h-8 animate-spin text-[#5c001f] mx-auto" />
                      <p class="text-xs font-bold text-gray-550 mt-2 font-sans">Loading candidate directory...</p>
                    </div>

                    <div v-else-if="candidatesError" class="p-4 border border-red-200 bg-red-50 rounded-lg text-red-700 text-xs font-sans">
                      <p class="font-bold">Failed to load candidates directory:</p>
                      <p class="mt-1">{{ candidatesError }}</p>
                    </div>

                    <!-- Candidate Table -->
                    <div v-else class="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
                      <table class="w-full text-left text-xs bg-white">
                        <thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
                          <tr>
                            <th class="px-4 py-3 text-[11px] font-bold uppercase tracking-wider font-sans">Full Name & Affiliation</th>
                            <th class="px-4 py-3 text-[11px] font-bold uppercase tracking-wider font-sans">Contact Email</th>
                            <th class="px-4 py-3 text-[11px] font-bold uppercase tracking-wider font-sans">Expertise Tags</th>
                            <th class="px-4 py-3 text-[11px] font-bold uppercase tracking-wider font-sans">Load Capacity Allocation</th>
                            <th class="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-right font-sans">Action</th>
                          </tr>
                        </thead>
                        
                        <tbody class="divide-y divide-gray-100">
                          <tr
                            v-for="candidate in filteredCandidates"
                            :key="candidate.user_id"
                            @mouseenter="hoveredCandidate = candidate"
                            @mouseleave="hoveredCandidate = null"
                            class="transition-colors group"
                            :class="[
                              isDisqualified(project, candidate)
                                ? 'bg-gray-100 text-gray-400/80 opacity-65'
                                : 'bg-white hover:bg-[#fff8df]/25 text-gray-700'
                            ]"
                          >
                            <!-- Name & Affiliation Badge -->
                            <td class="px-4 py-3 font-semibold text-gray-900 font-sans">
                              <div class="flex items-center gap-1 flex-wrap">
                                <span class="font-bold text-gray-800 text-sm" :class="{ 'text-gray-400': isDisqualified(project, candidate) }">
                                  {{ candidate.full_name }}
                                </span>
                                
                                <span
                                  v-if="candidate.affiliation?.toLowerCase() === 'industry'"
                                  class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 transition-all font-sans"
                                  :class="[
                                    isDisqualified(project, candidate)
                                      ? 'bg-gray-200 text-gray-400'
                                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                                  ]"
                                >
                                  Industry
                                </span>
                                <span
                                  v-else
                                  class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 transition-all font-sans"
                                  :class="[
                                    isDisqualified(project, candidate)
                                      ? 'bg-gray-200 text-gray-400'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  ]"
                                >
                                  Staff
                                </span>
                              </div>
                              <div v-if="candidate.co_org_name" class="text-[10px] text-gray-400 font-normal mt-0.5 font-sans">
                                {{ candidate.co_org_name }}
                              </div>
                            </td>

                            <!-- Contact Email -->
                            <td class="px-4 py-3 font-mono text-gray-500 select-all">
                              {{ candidate.email }}
                            </td>

                            <!-- Expertise Tag Badges -->
                            <td class="px-4 py-3">
                              <div class="flex flex-wrap gap-1 max-w-[280px]">
                                <span
                                  v-for="tag in candidate.expertise"
                                  :key="tag"
                                  class="px-2 py-0.5 rounded text-[10px] font-medium border transition-colors font-sans"
                                  :class="[
                                    isDisqualified(project, candidate)
                                      ? 'bg-gray-100 border-gray-200 text-gray-400'
                                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-650'
                                  ]"
                                >
                                  {{ tag }}
                                </span>
                                <span v-if="!candidate.expertise || candidate.expertise.length === 0" class="text-gray-450 italic font-sans text-[11px]">
                                  No tags
                                </span>
                              </div>
                            </td>

                            <!-- Load Capacity Allocation -->
                            <td class="px-4 py-3">
                              <div class="flex items-center gap-1.5 font-sans">
                                <span
                                  v-if="candidate.max_capacity === 0 || candidate.max_capacity == null"
                                  class="font-extrabold text-green-700 font-mono text-sm"
                                >
                                  {{ candidate.current_capacity || 0 }} / ∞ (No Limit)
                                </span>
                                <span
                                  v-else-if="candidate.current_capacity >= candidate.max_capacity"
                                  class="font-extrabold text-red-600 font-mono text-sm bg-red-50 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1"
                                >
                                  {{ candidate.current_capacity }} / {{ candidate.max_capacity }}
                                </span>
                                <span
                                  v-else
                                  class="font-extrabold text-gray-700 font-mono text-sm"
                                >
                                  {{ candidate.current_capacity }} / {{ candidate.max_capacity }}
                                </span>
                              </div>
                            </td>

                            <!-- Action Button -->
                            <td class="px-4 py-3 text-right">
                              <div class="flex items-center justify-end gap-2 font-sans">
                                <span
                                  v-if="isDisqualified(project, candidate)"
                                  class="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded inline-flex items-center gap-0.5 uppercase tracking-wide font-sans shrink-0"
                                >
                                  ⚠️ Disqualified: User is Examiner
                                </span>
                                
                                <button
                                  v-if="isDisqualified(project, candidate)"
                                  disabled
                                  class="bg-gray-100 text-gray-400 px-3 py-1.5 rounded font-bold text-xs cursor-not-allowed border border-gray-200 shadow-none uppercase flex items-center gap-1 select-none font-sans shrink-0"
                                >
                                  Assign Proposal
                                </button>
                                
                                <button
                                  v-else-if="candidate.max_capacity === 0 || candidate.max_capacity === null || candidate.current_capacity < candidate.max_capacity"
                                  @click="handleAssign(project, candidate)"
                                  :disabled="isAssigning"
                                  class="bg-[#5c001f] text-white hover:bg-[#4a0019] px-4 py-1.5 rounded-lg font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border-none flex items-center gap-1.5 font-sans shrink-0"
                                >
                                  <Loader2 v-if="isAssigning" class="w-3 h-3 animate-spin text-white" />
                                  Assign Proposal
                                </button>
                                
                                <button
                                  v-else
                                  @click="handleAssign(project, candidate)"
                                  :disabled="isAssigning"
                                  class="bg-[#f8be17] text-[#5c001f] hover:bg-[#e0ab12] px-4 py-1.5 rounded-lg font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border-none flex items-center gap-1.5 font-bold font-sans shrink-0"
                                >
                                  <Loader2 v-if="isAssigning" class="w-3 h-3 animate-spin text-[#5c001f]" />
                                  ⚠️ Force Override
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
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
