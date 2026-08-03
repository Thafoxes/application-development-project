<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Loader2, Save, Send } from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'
import RoleSidebar from '@/components/RoleSidebar.vue'
import EmailActionConfirmModal from '@/components/EmailActionConfirmModal.vue'
import { api } from '@/services/ifamousApi'

const route = useRoute()
const router = useRouter()
const projectId = Number(route.query.projectId || 0)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const payload = ref({ project: {}, rubric: [], assessment: null, scores: [] })
const comments = ref('')
const scoreMap = reactive({})
const scoreComments = reactive({})
const showSubmitConfirm = ref(false)
const locked = computed(() => payload.value.assessment?.status === 'Submitted')
const total = computed(() => payload.value.rubric.reduce((sum, item) => sum + Number(scoreMap[item.rubric_item_id] || 0), 0))
const maximum = computed(() => payload.value.rubric.reduce((sum, item) => sum + Number(item.max_score || 0), 0))

async function load() {
  loading.value = true
  try {
    if (!projectId) throw new Error('Project ID is missing.')
    payload.value = (await api.get(`/supervisor/projects/${projectId}/assessment`)).data
    comments.value = payload.value.assessment?.comments || ''
    for (const item of payload.value.scores || []) {
      scoreMap[item.rubric_item_id] = Number(item.score)
      scoreComments[item.rubric_item_id] = item.comment || ''
    }
  } catch (err) { error.value = err.response?.data?.error || err.message }
  finally { loading.value = false }
}

async function save(submit, sendEmail = true) {
  saving.value = true; error.value = ''
  try {
    await api.put(`/supervisor/projects/${projectId}/assessment`, {
      comments: comments.value,
      submit,
      sendEmail,
      scores: payload.value.rubric.map((item) => ({
        rubricItemId: item.rubric_item_id,
        score: Number(scoreMap[item.rubric_item_id] || 0),
        comment: scoreComments[item.rubric_item_id] || '',
      })),
    })
    showSubmitConfirm.value = false
    await load()
  } catch (err) { error.value = err.response?.data?.error || err.message }
  finally { saving.value = false }
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-[#e7ded3]"><AppHeader /><div class="flex flex-col md:flex-row flex-1 w-full min-w-0"><RoleSidebar role="Staff" /><main class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 overflow-x-hidden">
    <button @click="router.push({path:'/project-journey',query:{projectId}})" class="font-bold text-[#5c001f] inline-flex gap-2"><ArrowLeft class="w-5 h-5" /> FYP Journey</button>
    <section class="bg-[#5c001f] text-white rounded-[30px] p-8 shadow-xl"><p class="text-[#f8be17] font-bold uppercase tracking-[0.2em]">Supervisor Assessment</p><h1 class="text-3xl font-bold mt-2">{{ payload.project.project_title || 'Grade Student' }}</h1><p class="text-white/75 mt-2">Supervisor and examiner assessments remain separate. Final weighting is configured later using the official faculty rules.</p></section>
    <div v-if="loading" class="bg-white rounded-2xl p-10"><Loader2 class="animate-spin mx-auto text-[#5c001f]" /></div><div v-else-if="error && !payload.project.project_id" class="bg-red-50 text-red-800 rounded-2xl p-5 font-bold">{{ error }}</div>
    <template v-else>
      <div v-if="error" class="bg-red-50 text-red-800 rounded-2xl p-4 font-bold">{{ error }}</div>
      <section class="bg-white rounded-[26px] p-6 shadow">
        <div class="flex justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-900">Assessment rubric</h2>
            <p class="text-slate-500 font-medium">Maximum scores are enforced.</p>
          </div>
          <p class="text-3xl font-extrabold text-[#5c001f]">{{ total }} / {{ maximum }}</p>
        </div>
        <div class="overflow-x-auto mt-5">
          <table class="w-full min-w-[760px]">
            <thead>
              <tr class="bg-[#f7f1ea] text-left text-slate-900 font-bold">
                <th class="p-3">Criterion</th>
                <th class="p-3">Description</th>
                <th class="p-3">Max</th>
                <th class="p-3">Score</th>
                <th class="p-3">Comment</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="item in payload.rubric" :key="item.rubric_item_id" class="hover:bg-slate-50/60">
                <td class="p-3 font-bold text-slate-900">{{ item.criterion }}</td>
                <td class="p-3 text-sm text-slate-600 font-medium">{{ item.description }}</td>
                <td class="p-3 font-bold text-slate-800">{{ item.max_score }}</td>
                <td class="p-3">
                  <input
                    v-model.number="scoreMap[item.rubric_item_id]"
                    :disabled="locked"
                    type="number"
                    min="0"
                    :max="item.max_score"
                    class="w-28 border-2 border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 disabled:bg-slate-100 disabled:text-slate-700 transition-all"
                  />
                </td>
                <td class="p-3">
                  <input
                    v-model="scoreComments[item.rubric_item_id]"
                    :disabled="locked"
                    class="w-full border-2 border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 disabled:bg-slate-100 disabled:text-slate-700 transition-all"
                    placeholder="Optional criterion feedback..."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <textarea
          v-model="comments"
          :disabled="locked"
          class="w-full border-2 border-slate-300 rounded-xl p-4 min-h-32 mt-5 font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 disabled:bg-slate-100 disabled:text-slate-700 transition-all"
          placeholder="Overall supervisor comments"
        />
        <div v-if="!locked" class="flex gap-3 mt-5">
          <button @click="save(false)" :disabled="saving" class="border-2 border-[#5c001f] text-[#5c001f] hover:bg-[#5c001f]/5 rounded-xl px-5 py-3 font-bold inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50">
            <Save class="w-5 h-5" /> Save draft
          </button>
          <button @click="showSubmitConfirm = true" :disabled="saving" class="bg-[#5c001f] hover:bg-[#430016] text-white rounded-xl px-5 py-3 font-bold inline-flex items-center gap-2 shadow transition-all cursor-pointer disabled:opacity-50">
            <Send class="w-5 h-5" /> Submit assessment
          </button>
        </div>
        <p v-else class="bg-green-50 text-green-800 p-4 rounded-xl font-bold mt-5 border border-green-200">
          Supervisor assessment submitted and locked.
        </p>
      </section>
    </template>
  </main></div>
    <EmailActionConfirmModal
      :open="showSubmitConfirm"
      title="Submit supervisor assessment?"
      description="The assessment will be locked and the coordinator will be notified that supervisor grading is complete."
      recipient="I-FAMOUS coordinator(s)"
      confirm-label="Submit assessment"
      :busy="saving"
      @cancel="showSubmitConfirm = false"
      @confirm="(sendEmail) => save(true, sendEmail)"
    />
  </div>
</template>
