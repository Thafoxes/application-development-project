<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ClipboardCheck, Loader2, Search } from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'
import RoleSidebar from '@/components/RoleSidebar.vue'
import { api } from '@/services/ifamousApi'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const projects = ref([])
const search = ref('')
const filtered = computed(() => projects.value.filter((p) => `${p.project_title} ${p.student_name} ${p.matric_no}`.toLowerCase().includes(search.value.toLowerCase())))

onMounted(async () => {
  try { projects.value = (await api.get('/examiner/projects')).data.projects || [] }
  catch (err) { error.value = err.response?.data?.error || err.message }
  finally { loading.value = false }
})
</script>

<template>
  <div class="min-h-screen bg-[#e7ded3]"><AppHeader /><div class="flex flex-col md:flex-row flex-1 w-full min-w-0"><RoleSidebar role="Staff" /><main class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 overflow-x-hidden">
    <section class="bg-[#5c001f] text-white rounded-2xl sm:rounded-[30px] p-5 sm:p-8 shadow-xl">
      <p class="text-[#f8be17] font-bold uppercase tracking-[0.2em] text-xs sm:text-sm">Examiner Module</p>
      <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2">Assigned Grading FYP</h1>
      <p class="text-white/90 font-medium mt-2">Only projects assigned to your examiner account are visible here.</p>
    </section>

    <div class="bg-white rounded-[20px] p-4 flex items-center gap-3 border-2 border-slate-200 shadow-sm focus-within:border-[#5c001f] transition-all">
      <Search class="w-5 h-5 text-slate-400" />
      <input
        v-model="search"
        class="flex-1 bg-transparent text-slate-900 font-bold placeholder:text-slate-400 outline-none text-base"
        placeholder="Search assigned project or student..."
      />
    </div>

    <div v-if="loading" class="bg-white rounded-2xl p-10 text-center"><Loader2 class="animate-spin mx-auto text-[#5c001f] w-8 h-8" /></div>
    <div v-else-if="error" class="bg-red-50 text-red-800 border border-red-200 p-5 rounded-2xl font-bold">{{ error }}</div>

    <section v-else class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <article
        v-for="item in filtered"
        :key="item.project_id"
        class="bg-white rounded-[24px] p-6 shadow-md border-2 border-slate-200/90 flex flex-col justify-between space-y-4 hover:border-[#5c001f] transition-all"
      >
        <div>
          <div class="flex justify-between items-center gap-3">
            <ClipboardCheck class="w-7 h-7 text-[#5c001f]" />
            <span
              class="px-3 py-1 rounded-full text-xs font-bold"
              :class="item.evaluation_status === 'Submitted' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'"
            >
              {{ item.evaluation_status || 'Pending Evaluation' }}
            </span>
          </div>
          <h2 class="text-xl font-extrabold text-slate-900 mt-4 leading-snug">{{ item.project_title }}</h2>
          <p class="text-base font-semibold text-slate-700 mt-1">{{ item.student_name }} <span class="text-slate-500 font-normal">({{ item.matric_no }})</span></p>
          <p class="text-sm font-medium text-slate-600 mt-2"><strong>Supervisor:</strong> {{ item.supervisor_name || 'Unassigned' }}</p>
        </div>

        <button
          @click="router.push({ path: '/examiner-review', query: { projectId: item.project_id } })"
          class="w-full bg-[#5c001f] hover:bg-[#430016] text-white rounded-xl px-5 py-3 font-bold shadow transition-all cursor-pointer"
        >
          {{ item.evaluation_status === 'Submitted' ? 'View evaluation' : 'Review and grade' }}
        </button>
      </article>
      <div v-if="!filtered.length" class="col-span-full bg-white rounded-2xl p-8 text-center text-slate-600 font-semibold border-2 border-slate-200 shadow-sm">
        No assigned examination projects found.
      </div>
    </section>
  </main></div></div>
</template>
