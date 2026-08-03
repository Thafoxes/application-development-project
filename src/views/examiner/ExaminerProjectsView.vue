<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2, Search } from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'
import RoleSidebar from '@/components/RoleSidebar.vue'
import StaffProjectCard from '@/components/staff/StaffProjectCard.vue'
import { api } from '@/services/ifamousApi'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const projects = ref([])
const search = ref('')
const filtered = computed(() => projects.value.filter((p) => `${p.project_title} ${p.student_name} ${p.matric_no}`.toLowerCase().includes(search.value.toLowerCase())))

function openReview(project) {
  router.push({ path: '/examiner-review', query: { projectId: project.project_id } })
}

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
      <StaffProjectCard
        v-for="item in filtered"
        :key="item.project_id"
        :project="item"
        role="examiner"
        @click="openReview"
      />
      <div v-if="!filtered.length" class="col-span-full bg-white rounded-2xl p-8 text-center text-slate-600 font-semibold border-2 border-slate-200 shadow-sm">
        No assigned examination projects found.
      </div>
    </section>
  </main></div></div>
</template>
