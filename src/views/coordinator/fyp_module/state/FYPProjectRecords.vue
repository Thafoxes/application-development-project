<script setup>
import { ref, computed } from 'vue'
import { Search, Loader2, AlertTriangle, ClipboardList } from 'lucide-vue-next'

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
        <h2 class="text-[28px] font-bold">FYP Project Records</h2>
      </div>

      <div class="flex gap-3 items-center">
        <button
          @click="handleRefresh"
          class="bg-[#5c001f] text-white px-5 py-3 rounded-lg font-bold hover:bg-[#4a0019] transition-colors border-none cursor-pointer"
        >
          Refresh
        </button>

        <div class="relative">
          <Search class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search project..."
            class="rounded-full border border-[#d8c9bd] pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f8be17]"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="rounded-lg border border-gray-300 p-8 text-center bg-white">
      <Loader2 class="w-10 h-10 animate-spin text-[#5c001f] mx-auto" />
      <p class="font-bold mt-4">Loading project records...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-lg bg-red-50 border border-red-200 p-6">
      <div class="flex gap-3">
        <AlertTriangle class="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <h3 class="font-bold text-red-700">Failed to Load Records</h3>
          <p class="text-sm text-red-600 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredRecords.length === 0"
      class="rounded-lg border border-gray-300 p-8 text-center bg-white"
    >
      <ClipboardList class="w-12 h-12 text-[#5c001f] mx-auto" />
      <h3 class="font-bold text-xl mt-4">No Project Records Found</h3>
      <p class="text-gray-600 mt-2">
        No records match your filters or search criteria.
      </p>
    </div>

    <!-- Data Table -->
    <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table class="w-full text-left bg-white text-sm">
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
            v-for="project in filteredRecords"
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
                <span v-if="project.cgpa">· CGPA: {{ parseFloat(project.cgpa).toFixed(2) }}</span>
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
              <div class="flex flex-col gap-1">
                <span
                  class="px-3 py-1 rounded-full text-xs font-bold uppercase w-fit"
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
                <span v-if="project.status?.toLowerCase() === 'rejected' && project.coordinator_comments" class="text-xs text-red-600 max-w-[150px]">
                  <strong>Reason:</strong> {{ project.coordinator_comments }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
