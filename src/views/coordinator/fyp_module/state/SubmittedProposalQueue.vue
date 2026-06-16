<script setup>
import { ref, computed } from 'vue'
import { Sparkles, UploadCloud, AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  proposals: {
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

const emit = defineEmits(['refresh', 'update-status'])

// Local Filters State
const selectedTypeFilter = ref('all')
const selectedStatusFilter = ref('pending')

// Local Computeds
const submittedCount = computed(() => props.proposals.length)
const pendingReviewCount = computed(() => {
  return props.proposals.filter(
    (p) => p.status?.toLowerCase() === 'submitted' || p.status?.toLowerCase() === 'pending',
  ).length
})

const filteredProposals = computed(() => {
  return props.proposals.filter((p) => {
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

const handleRefresh = () => {
  emit('refresh')
}

const handleStatusUpdate = (projectId, status) => {
  emit('update-status', { projectId, status })
}
</script>

<template>
  <div class="p-7">
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
        @click="handleRefresh"
        class="bg-yellow-50 text-[#5c001f] px-5 py-2.5 rounded-lg font-bold hover:bg-[#f8be17] transition-colors border-none flex items-center gap-2"
      >
        <Sparkles class="w-4 h-4" />
        Refresh Queue
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-7">
      <div class="rounded-lg bg-gray-50 border border-gray-300 p-6">
        <p class="text-sm text-gray-500 font-bold">Submitted Proposals</p>
        <p class="text-[34px] font-bold text-[#5c001f] mt-1">{{ submittedCount }}</p>
        <p class="text-xs text-gray-500 mt-1">Waiting in coordinator queue</p>
      </div>
      <div class="rounded-lg bg-gray-50 border border-gray-300 p-6">
        <p class="text-sm text-gray-500 font-bold">Pending Review</p>
        <p class="text-[34px] font-bold text-[#5c001f] mt-1">{{ pendingReviewCount }}</p>
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
          <label class="text-xs font-bold text-[#5c001f] uppercase tracking-wider">Project Type</label>
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
          <label class="text-xs font-bold text-[#5c001f] uppercase tracking-wider">Approval Status</label>
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

    <!-- Table -->
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
          <tr v-if="isLoading">
            <td colspan="6" class="px-5 py-8 text-center font-bold text-[#5c001f]">
              Loading submitted proposals...
            </td>
          </tr>

          <tr v-else-if="error">
            <td colspan="6" class="px-5 py-8 text-center font-bold text-red-700">
              {{ error }}
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
            class="border-t border-gray-300 bg-white"
          >
            <td class="px-5 py-4 font-bold">
              {{ project.studentName }}
              <br />
              <span class="text-xs text-gray-500 font-medium">
                {{ project.matricNo }}
                <span v-if="project.cgpa">· CGPA: {{ parseFloat(project.cgpa).toFixed(2) }}</span>
              </span>
            </td>

            <td class="px-5 py-4 font-bold max-w-[240px]">
              {{ project.projectTitle }}
            </td>

            <td class="px-5 py-4 font-medium text-gray-700">
              {{ project.projectType }}
            </td>

            <td class="px-5 py-4">
              <div class="flex flex-col gap-1">
                <span
                  class="px-3 py-1 rounded-full font-bold text-xs uppercase w-fit"
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
                <span v-if="project.status?.toLowerCase() === 'rejected' && project.coordinator_comments" class="text-xs text-red-600 max-w-[200px]">
                  <strong>Reason:</strong> {{ project.coordinator_comments }}
                </span>
              </div>
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
                @click="handleStatusUpdate(project.project_id, 'approved')"
                class="bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-800 transition-all text-xs border-none cursor-pointer"
              >
                Approve
              </button>
              <button
                v-if="
                  project.status?.toLowerCase() === 'submitted' ||
                  project.status?.toLowerCase() === 'pending'
                "
                @click="handleStatusUpdate(project.project_id, 'rejected')"
                class="bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-800 transition-all text-xs border-none cursor-pointer"
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
</template>
