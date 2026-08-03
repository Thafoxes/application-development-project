<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ClipboardCheck, FolderKanban, Loader2, UsersRound } from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'
import RoleSidebar from '@/components/RoleSidebar.vue'
import { api } from '@/services/ifamousApi'
import { openSupervisorProject } from '@/utils/supervisorProjectNavigation'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const dashboard = ref({ stats: {}, supervised: [], examinations: [] })

onMounted(async () => {
  try {
    dashboard.value = (await api.get('/staff/dashboard')).data
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#e7ded3]">
    <AppHeader />
    <div class="flex flex-col md:flex-row flex-1 w-full min-w-0">
      <RoleSidebar role="Staff" />
      <main class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 overflow-x-hidden">
        <section class="rounded-2xl sm:rounded-[30px] bg-[#5c001f] text-white p-5 sm:p-8 shadow-xl">
          <p class="text-[#f8be17] uppercase tracking-[0.2em] font-bold text-xs sm:text-sm">Combined Staff Workspace</p>
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2">Supervision and Examination</h1>
          <p class="text-white/90 font-medium mt-2">One account can supervise and examine different FYP projects without exposing unrelated projects.</p>
        </section>

        <div v-if="loading" class="bg-white rounded-2xl p-10 text-center"><Loader2 class="w-8 h-8 animate-spin mx-auto text-[#5c001f]" /></div>
        <div v-else-if="error" class="bg-red-50 text-red-800 border border-red-200 p-5 rounded-2xl font-bold">{{ error }}</div>
        <template v-else>
          <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-[22px] p-5 shadow border border-slate-200/80">
              <FolderKanban class="w-7 h-7 text-[#5c001f]" />
              <p class="text-sm font-semibold text-slate-600 mt-3">Supervised FYPs</p>
              <p class="text-3xl font-extrabold text-slate-900 mt-1">{{ dashboard.stats.supervised || 0 }}</p>
            </div>
            <div class="bg-white rounded-[22px] p-5 shadow border border-slate-200/80">
              <ClipboardCheck class="w-7 h-7 text-[#5c001f]" />
              <p class="text-sm font-semibold text-slate-600 mt-3">Pending examinations</p>
              <p class="text-3xl font-extrabold text-slate-900 mt-1">{{ dashboard.stats.pendingExaminations || 0 }}</p>
            </div>
            <div class="bg-white rounded-[22px] p-5 shadow border border-slate-200/80">
              <UsersRound class="w-7 h-7 text-[#5c001f]" />
              <p class="text-sm font-semibold text-slate-600 mt-3">Completed examinations</p>
              <p class="text-3xl font-extrabold text-slate-900 mt-1">{{ dashboard.stats.completedExaminations || 0 }}</p>
            </div>
          </section>

          <section class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div class="bg-white rounded-[26px] p-6 shadow border border-slate-200/80">
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-extrabold text-slate-900">Your supervised FYP</h2>
                <button @click="router.push('/supervisor-projects')" class="text-[#5c001f] hover:text-[#430016] font-bold underline cursor-pointer">View all</button>
              </div>
              <div class="space-y-3 mt-5">
                <button
                  v-for="item in dashboard.supervised.slice(0,5)"
                  :key="item.project_id"
                  @click="openSupervisorProject(router, item)"
                  class="w-full border-2 border-slate-200 rounded-2xl p-4 text-left bg-slate-50/50 hover:bg-[#f7f1ea] hover:border-[#5c001f] transition-all cursor-pointer space-y-1.5"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="font-bold text-slate-900 text-base">{{ item.project_title }}</p>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex-shrink-0">
                      {{ item.status || 'Active' }}
                    </span>
                  </div>
                  <p class="text-sm text-slate-600 font-medium">{{ item.student_name }}</p>
                </button>
                <p v-if="!dashboard.supervised.length" class="text-slate-500 font-medium py-3">No supervised projects.</p>
              </div>
            </div>

            <div class="bg-white rounded-[26px] p-6 shadow border border-slate-200/80">
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-extrabold text-slate-900">Pending examination FYP</h2>
                <button @click="router.push('/examiner-projects')" class="text-[#5c001f] hover:text-[#430016] font-bold underline cursor-pointer">View all</button>
              </div>
              <div class="space-y-3 mt-5">
                <button
                  v-for="item in dashboard.examinations.slice(0,5)"
                  :key="item.project_id"
                  @click="router.push({ path:'/examiner-review', query:{ projectId:item.project_id } })"
                  class="w-full border-2 border-slate-200 rounded-2xl p-4 text-left bg-slate-50/50 hover:bg-[#f7f1ea] hover:border-[#5c001f] transition-all cursor-pointer space-y-1.5"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="font-bold text-slate-900 text-base">{{ item.project_title }}</p>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                      :class="item.evaluation_status === 'Submitted' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'"
                    >
                      {{ item.evaluation_status || 'Pending' }}
                    </span>
                  </div>
                  <p class="text-sm text-slate-600 font-medium">{{ item.student_name }}</p>
                </button>
                <p v-if="!dashboard.examinations.length" class="text-slate-500 font-medium py-3">No examiner assignments.</p>
              </div>
            </div>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>
