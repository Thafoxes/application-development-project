<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Download, ExternalLink, FileText, Loader2, Save, Send } from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'
import RoleSidebar from '@/components/RoleSidebar.vue'
import EmailActionConfirmModal from '@/components/EmailActionConfirmModal.vue'
import { api, fileUrl } from '@/services/ifamousApi'
import RubricEvaluationTable from '@/components/staff/RubricEvaluationTable.vue'
import FeedbackFileUploadCard from '@/components/staff/FeedbackFileUploadCard.vue'

const route = useRoute()
const router = useRouter()
const projectId = Number(route.query.projectId || 0)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const payload = ref({ project: {}, submissions: [], rubric: [], evaluation: null, scores: [], feedback: [] })
const comments = reactive({ strengths: '', improvements: '', recommendations: '', overallComments: '' })
const scoreMap = reactive({})
const commentMap = reactive({})
const showSubmitConfirm = ref(false)
const locked = computed(() => payload.value.evaluation?.status === 'Submitted')

async function load() {
  try {
    if (!projectId) throw new Error('Project ID is missing.')
    const response = await api.get(`/examiner/projects/${projectId}`)
    payload.value = response.data
    const evaluation = response.data.evaluation || {}
    Object.assign(comments, {
      strengths: evaluation.strengths || '', improvements: evaluation.improvements || '',
      recommendations: evaluation.recommendations || '', overallComments: evaluation.overall_comments || '',
    })
    for (const item of response.data.scores || []) {
      scoreMap[item.rubric_item_id] = Number(item.score)
      commentMap[item.rubric_item_id] = item.comment || ''
    }
  } catch (err) { error.value = err.response?.data?.error || err.message }
  finally { loading.value = false }
}

async function save(submit = false, sendEmail = true) {
  saving.value = true; error.value = ''
  try {
    const scores = payload.value.rubric.map((item) => ({
      rubricItemId: item.rubric_item_id,
      score: Number(scoreMap[item.rubric_item_id] || 0),
      comment: commentMap[item.rubric_item_id] || '',
    }))
    await api.put(`/examiner/projects/${projectId}/evaluation`, { ...comments, scores, submit, sendEmail })
    showSubmitConfirm.value = false
    await load()
  } catch (err) { error.value = err.response?.data?.error || err.message }
  finally { saving.value = false }
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-[#e7ded3]"><AppHeader /><div class="flex flex-col md:flex-row flex-1 w-full min-w-0"><RoleSidebar role="Staff" /><main class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 overflow-x-hidden">
    <button @click="router.push('/examiner-projects')" class="font-bold text-[#5c001f] inline-flex items-center gap-2"><ArrowLeft class="w-5 h-5" /> Assigned Grading FYP</button>
    <div v-if="loading" class="bg-white rounded-2xl p-10"><Loader2 class="animate-spin mx-auto text-[#5c001f]" /></div><div v-else-if="error && !payload.project.project_id" class="bg-red-50 text-red-800 rounded-2xl p-5 font-bold">{{ error }}</div>
    <template v-else>
      <section class="bg-[#5c001f] text-white rounded-[30px] p-8 shadow-xl">
        <p class="text-[#f8be17] font-bold uppercase tracking-[0.2em]">Formal Examination</p>
        <h1 class="text-3xl font-bold mt-2">{{ payload.project.project_title }}</h1>
        <p class="text-white/90 font-medium mt-2">{{ payload.project.student_name }} · <strong>Supervisor:</strong> {{ payload.project.supervisor_name || 'Unassigned' }}</p>
      </section>
      <div v-if="error" class="bg-red-50 text-red-800 rounded-2xl p-4 font-bold border border-red-200">{{ error }}</div>

      <section class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="xl:col-span-2 bg-white rounded-[26px] p-6 shadow border border-slate-200/90 space-y-4">
          <h2 class="text-2xl font-extrabold text-slate-900">Approved examination package</h2>
          <div class="space-y-3 mt-4">
            <div
              v-for="item in payload.submissions"
              :key="item.submission_id"
              class="border-2 border-slate-200 bg-slate-50/50 rounded-2xl p-4 flex justify-between items-center gap-4 flex-wrap hover:border-slate-300 transition-all"
            >
              <div class="flex items-center gap-3">
                <FileText class="w-7 h-7 text-[#5c001f] flex-shrink-0" />
                <div>
                  <p class="font-bold text-slate-900 text-base">{{ item.original_file_name || item.submission_title }}</p>
                  <p class="text-sm font-semibold text-slate-600 mt-0.5">Version {{ item.version_number }} · {{ item.is_locked ? 'Locked approved copy' : item.status }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <a
                  :href="fileUrl(projectId, item.submission_id)"
                  target="_blank"
                  rel="noopener"
                  class="border-2 border-slate-300 hover:border-[#5c001f] text-slate-800 hover:text-[#5c001f] rounded-xl px-4 py-2 font-bold transition-all cursor-pointer"
                >
                  Preview
                </a>
                <a
                  :href="fileUrl(projectId, item.submission_id, true)"
                  class="bg-[#5c001f] hover:bg-[#430016] text-white rounded-xl px-4 py-2 font-bold inline-flex items-center gap-2 shadow transition-all cursor-pointer"
                >
                  <Download class="w-4 h-4" /> Download
                </a>
              </div>
            </div>
          </div>
        </div>

        <aside class="bg-white rounded-[26px] p-6 shadow border border-slate-200/90 space-y-4 h-fit">
          <h2 class="text-xl font-extrabold text-slate-900">Project resources</h2>
          <p class="text-sm text-slate-700 font-medium"><strong>Type:</strong> {{ payload.project.project_type || '-' }}</p>
          <p class="text-sm text-slate-700 font-medium"><strong>Keywords:</strong> {{ payload.project.keywords || '-' }}</p>
          <a
            v-if="payload.project.github_url"
            :href="payload.project.github_url"
            target="_blank"
            rel="noopener"
            class="w-full border-2 border-[#5c001f] text-[#5c001f] hover:bg-[#5c001f]/5 rounded-xl px-4 py-3 font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ExternalLink class="w-4 h-4" /> Open GitHub
          </a>
          <a
            v-if="payload.project.google_drive_url"
            :href="payload.project.google_drive_url"
            target="_blank"
            rel="noopener"
            class="w-full border-2 border-[#5c001f] text-[#5c001f] hover:bg-[#5c001f]/5 rounded-xl px-4 py-3 font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ExternalLink class="w-4 h-4" /> Open Google Drive
          </a>
          <button
            @click="router.push({ path: '/project-journey', query: { projectId } })"
            class="w-full bg-[#f7f1ea] hover:bg-[#ebdccb] text-[#5c001f] rounded-xl px-4 py-3 font-bold border border-[#e1d5cc] transition-all cursor-pointer"
          >
            View allowed journey evidence
          </button>
        </aside>
      </section>

      <!-- Reusable Rubric Table Component -->
      <RubricEvaluationTable
        :rubric="payload.rubric"
        :score-map="scoreMap"
        :comment-map="commentMap"
        :locked="locked"
      />

      <!-- Examiner Feedback Section -->
      <section class="bg-white rounded-[26px] p-6 shadow border border-slate-200/90 space-y-4">
        <h2 class="text-2xl font-bold text-slate-900">Examiner qualitative feedback</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
          <textarea
            v-model="comments.strengths"
            :disabled="locked"
            class="border-2 border-slate-300 rounded-xl p-4 min-h-28 font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 disabled:bg-slate-100 disabled:text-slate-700 transition-all"
            placeholder="Strengths"
          />
          <textarea
            v-model="comments.improvements"
            :disabled="locked"
            class="border-2 border-slate-300 rounded-xl p-4 min-h-28 font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 disabled:bg-slate-100 disabled:text-slate-700 transition-all"
            placeholder="Areas requiring improvement"
          />
          <textarea
            v-model="comments.recommendations"
            :disabled="locked"
            class="border-2 border-slate-300 rounded-xl p-4 min-h-28 font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 disabled:bg-slate-100 disabled:text-slate-700 transition-all"
            placeholder="Recommendations"
          />
          <textarea
            v-model="comments.overallComments"
            :disabled="locked"
            class="border-2 border-slate-300 rounded-xl p-4 min-h-28 font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 disabled:bg-slate-100 disabled:text-slate-700 transition-all"
            placeholder="Overall comments"
          />
        </div>
        <div v-if="!locked" class="flex flex-wrap gap-3 pt-2">
          <button @click="save(false)" :disabled="saving" class="border-2 border-[#5c001f] text-[#5c001f] hover:bg-[#5c001f]/5 rounded-xl px-5 py-3 font-bold inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50">
            <Save class="w-5 h-5" /> Save draft
          </button>
          <button @click="showSubmitConfirm = true" :disabled="saving" class="bg-[#5c001f] hover:bg-[#430016] text-white rounded-xl px-5 py-3 font-bold inline-flex items-center gap-2 shadow transition-all cursor-pointer disabled:opacity-50">
            <Send class="w-5 h-5" /> Submit final evaluation
          </button>
        </div>
        <p v-else class="bg-green-50 text-green-800 rounded-xl p-4 font-bold border border-green-200">
          Evaluation submitted and locked. The coordinator can now review and release the result.
        </p>
      </section>

      <!-- Reusable Feedback & Correction Attachment Upload Card -->
      <FeedbackFileUploadCard
        :project-id="projectId"
        :feedback-list="payload.feedback || []"
        role-label="Examiner"
        @updated="load"
      />
    </template>
  </main></div>
    <EmailActionConfirmModal
      :open="showSubmitConfirm"
      title="Submit final examiner evaluation?"
      description="The evaluation will be locked and the coordinator will be notified that grading is complete."
      recipient="I-FAMOUS coordinator(s)"
      confirm-label="Submit final evaluation"
      :busy="saving"
      @cancel="showSubmitConfirm = false"
      @confirm="(sendEmail) => save(true, sendEmail)"
    />
  </div>
</template>
