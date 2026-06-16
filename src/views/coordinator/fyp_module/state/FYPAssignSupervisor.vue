<script setup>
import { ref, computed } from 'vue'
import { Search } from 'lucide-vue-next'
import AssignSupervisorPanel from '@/components/AssignSupervisorPanel.vue'

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
const expandedProjectId = ref(null)
const selectedProject = ref(null)

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

const toggleExpandRow = (project) => {
  if (expandedProjectId.value === project.project_id) {
    expandedProjectId.value = null
    selectedProject.value = null
  } else {
    expandedProjectId.value = project.project_id
    selectedProject.value = project
  }
}

const handleSupervisorAssigned = () => {
  expandedProjectId.value = null
  selectedProject.value = null
  emit('refresh')
}

const handleRefresh = () => {
  emit('refresh')
}
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
          <p class="text-sm text-red-650 mt-1 font-sans">{{ error }}</p>
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
                expandedProjectId === project.project_id
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
                  @click="toggleExpandRow(project)"
                  class="bg-[#5c001f] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#4a0019] transition-all cursor-pointer shadow-md active:scale-95 text-center font-sans border-none inline-flex items-center gap-1.5"
                >
                  <span>🟢 Assign Supervisor</span>
                </button>
                <button
                  v-else
                  @click="toggleExpandRow(project)"
                  class="bg-white text-[#5c001f] border border-[#5c001f] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#5c001f] hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 text-center font-sans inline-flex items-center gap-1.5"
                >
                  <span>🔄 Change Supervisor</span>
                </button>
              </td>
            </tr>

            <!-- Inline Dropdown Card Panel (Context Preservation) -->
            <tr v-if="expandedProjectId === project.project_id" class="bg-gray-55/70">
              <td colspan="100%" class="px-6 py-6 border-b border-gray-200">
                <AssignSupervisorPanel
                  :project="project"
                  :records="records"
                  @close="toggleExpandRow(project)"
                  @assigned="handleSupervisorAssigned"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
