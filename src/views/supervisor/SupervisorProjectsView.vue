<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileText,
  FolderKanban,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'
import RoleSidebar from '@/components/RoleSidebar.vue'
import StaffProjectCard from '@/components/staff/StaffProjectCard.vue'
import { api } from '@/services/ifamousApi'
import { openSupervisorProject } from '@/utils/supervisorProjectNavigation'
import { formatMalaysiaDate } from '@/utils/dateTime'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const projects = ref([])
const searchQuery = ref('')
const viewMode = ref('cards') // 'cards' | 'table'

const filteredProjects = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return projects.value
  return projects.value.filter((p) => {
    const title = String(p.projectTitle || p.project_title || '').toLowerCase()
    const student = String(p.studentName || p.student_name || '').toLowerCase()
    const matric = String(p.matricNo || p.matric_no || '').toLowerCase()
    return title.includes(q) || student.includes(q) || matric.includes(q)
  })
})

async function loadProjects() {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await api.get('/supervisor/projects')
    projects.value = res.data.projects || []
  } catch (error) {
    errorMessage.value = error.response?.data?.error || error.message
    projects.value = []
  } finally {
    loading.value = false
  }
}

function reviewProject(project) {
  openSupervisorProject(router, project)
}

onMounted(loadProjects)
</script>

<template>
  <div class="min-h-screen bg-[#e7ded3] text-black font-['Inter']">
    <AppHeader />

    <div class="flex flex-col md:flex-row flex-1 w-full min-w-0">
      <RoleSidebar role="Staff" />

      <main class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 overflow-x-hidden">
        <section class="rounded-2xl sm:rounded-[32px] bg-[#5c001f] text-white p-5 sm:p-8 shadow-xl relative overflow-hidden">
          <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#f8be17]/20"></div>
          <p class="text-[#f8be17] font-bold uppercase tracking-[0.2em] text-xs sm:text-sm">
            Assigned Projects
          </p>
          <h1 class="text-2xl sm:text-3xl lg:text-[36px] font-bold mt-2">Projects Assigned to Me</h1>
          <p class="text-white/90 font-medium mt-2">
            Review and grade active projects assigned to your supervisor account.
          </p>
        </section>

        <!-- Search & Control Bar -->
        <div class="bg-white rounded-[20px] p-4 flex flex-wrap items-center justify-between gap-4 border-2 border-slate-200 shadow-sm">
          <div class="flex-1 min-w-[260px] relative">
            <Search class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search supervised projects by title, student, or matric no..."
              class="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 outline-none focus:border-[#5c001f] focus:bg-white transition-all text-sm"
            />
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="viewMode = viewMode === 'cards' ? 'table' : 'cards'"
              class="px-4 py-2 rounded-xl border-2 border-slate-300 font-bold text-xs text-slate-800 hover:border-[#5c001f] transition-all cursor-pointer"
            >
              {{ viewMode === 'cards' ? 'Table View' : 'Card View' }}
            </button>
            <button
              @click="loadProjects"
              class="px-4 py-2 rounded-xl bg-[#f7f1ea] text-[#5c001f] font-bold border border-[#e1d5cc] flex items-center gap-2 hover:bg-[#efe4d9] text-xs cursor-pointer"
            >
              <RefreshCw class="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <section class="bg-white rounded-[28px] p-6 shadow-lg border border-slate-200/90 space-y-6">
          <div class="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 class="text-2xl font-extrabold text-slate-900">Assigned Supervised Projects</h2>
              <p class="text-slate-600 font-medium text-sm mt-0.5">
                Total {{ filteredProjects.length }} project(s) assigned.
              </p>
            </div>
          </div>

          <div
            v-if="loading"
            class="rounded-[20px] border border-slate-200 p-8 text-center text-[#5c001f] font-bold"
          >
            <Loader2 class="w-8 h-8 mx-auto animate-spin mb-3 text-[#5c001f]" />
            Loading assigned projects...
          </div>

          <div
            v-else-if="errorMessage"
            class="rounded-[20px] border border-red-200 bg-red-50 text-red-700 p-6 font-bold"
          >
            {{ errorMessage }}
          </div>

          <div
            v-else-if="filteredProjects.length === 0"
            class="rounded-[20px] border-2 border-slate-200 bg-slate-50/50 p-8 text-center"
          >
            <FileText class="w-12 h-12 mx-auto text-[#5c001f]" />
            <h3 class="font-extrabold text-slate-900 text-lg mt-3">No assigned projects found</h3>
            <p class="text-slate-600 font-medium text-sm mt-1">
              When a coordinator assigns an FYP project to you, it will appear here.
            </p>
          </div>

          <!-- Cards View -->
          <div v-else-if="viewMode === 'cards'" class="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <StaffProjectCard
              v-for="project in filteredProjects"
              :key="project.project_id || project.id"
              :project="project"
              role="supervisor"
              @click="reviewProject"
            />
          </div>

          <!-- Table View -->
          <div v-else class="overflow-x-auto rounded-[22px] border-2 border-slate-200">
            <table class="w-full text-sm">
              <thead class="bg-[#f7f1ea] text-slate-900 font-bold text-left border-b border-[#e1d5cc]">
                <tr>
                  <th class="px-5 py-4">Student</th>
                  <th>Project Title</th>
                  <th>Status</th>
                  <th>Match Score</th>
                  <th>Last Updated</th>
                  <th class="text-right pr-5">Action</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-200">
                <tr
                  v-for="project in filteredProjects"
                  :key="project.project_id || project.id"
                  class="hover:bg-slate-50/60"
                >
                  <td class="px-5 py-4 font-bold text-slate-900">
                    {{ project.studentName || project.student_name }}
                    <br />
                    <span class="text-xs text-slate-500 font-normal">{{ project.matricNo || project.matric_no }}</span>
                  </td>

                  <td class="font-bold text-slate-900 max-w-[320px]">
                    {{ project.projectTitle || project.project_title }}
                  </td>

                  <td>
                    <span
                      class="px-3 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800"
                    >
                      {{ project.status || 'Active' }}
                    </span>
                  </td>

                  <td class="font-bold text-slate-800">
                    {{ project.matchScore ? project.matchScore + '%' : '-' }}
                  </td>

                  <td class="text-xs font-semibold text-slate-600">{{ formatMalaysiaDate(project.lastUpdated || project.updated_at) }}</td>

                  <td class="text-right pr-5">
                    <button
                      @click="reviewProject(project)"
                      class="bg-[#5c001f] hover:bg-[#430016] text-white px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow cursor-pointer"
                    >
                      Open FYP
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>
