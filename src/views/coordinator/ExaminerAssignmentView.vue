<script setup>
import { computed, onMounted, ref } from 'vue'
import { Sparkles, Loader2, RefreshCw, Search, UserRoundCheck } from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import EmailActionConfirmModal from '@/components/EmailActionConfirmModal.vue'
import { api } from '@/services/ifamousApi'

const loading = ref(true)
const matching = ref(false)
const error = ref('')
const projects = ref([])
const selected = ref(null)
const candidates = ref([])
const search = ref('')
const weights = ref({ supervisorWeight: '', examinerWeight: '' })
const weightsConfigured = ref(false)
const emailConfirmation = ref(null)
const actionBusy = ref(false)

const filtered = computed(() =>
  projects.value.filter((item) =>
    `${item.project_title} ${item.student_name} ${item.supervisor_name}`
      .toLowerCase()
      .includes(search.value.toLowerCase()),
  ),
)

async function loadQueue() {
  loading.value = true
  error.value = ''
  try {
    const response = (await api.get('/coordinator/examiner-queue')).data
    projects.value = response.projects || []
    const settings = response.assessmentSettings || {}
    weights.value = {
      supervisorWeight: settings.supervisor_weight ?? '',
      examinerWeight: settings.examiner_weight ?? '',
    }
    weightsConfigured.value = Boolean(response.weightsConfigured)
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    loading.value = false
  }
}

async function match(project) {
  selected.value = project
  matching.value = true
  candidates.value = []
  error.value = ''
  try {
    candidates.value = (
      await api.get(`/coordinator/examiner-match/${project.project_id}`)
    ).data.candidates || []
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    matching.value = false
  }
}

function requestAssignment(candidate) {
  emailConfirmation.value = {
    kind: 'assign',
    candidate,
    title: 'Assign this examiner?',
    description: `${candidate.full_name} will be assigned to examine “${selected.value?.project_title || 'this project'}”.`,
    recipient: candidate.email || candidate.full_name || 'Selected examiner',
    confirmLabel: 'Assign examiner',
  }
}

function requestRelease(project) {
  emailConfirmation.value = {
    kind: 'release',
    project,
    title: 'Release this result?',
    description: 'The student will gain access to the released marks, rubric breakdown and feedback.',
    recipient: project.student_email || project.student_name || 'Project student',
    confirmLabel: 'Release result',
  }
}

async function confirmEmailAction(sendEmail) {
  const pending = emailConfirmation.value
  if (!pending) return
  actionBusy.value = true
  error.value = ''
  try {
    if (pending.kind === 'assign') {
      await api.post(`/coordinator/projects/${selected.value.project_id}/assign-examiner`, {
        examinerUserId: pending.candidate.user_id,
        matchScore: pending.candidate.matchScore,
        reason: pending.candidate.reason,
        sendEmail,
      })
      selected.value = null
      candidates.value = []
    } else if (pending.kind === 'release') {
      await api.post(`/coordinator/projects/${pending.project.project_id}/release-result`, {
        sendEmail,
      })
    }
    emailConfirmation.value = null
    await loadQueue()
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    actionBusy.value = false
  }
}

async function remove(project) {
  if (!confirm(`Remove the examiner assignment for “${project.project_title}”?`)) return
  try {
    await api.delete(`/coordinator/projects/${project.project_id}/examiner`)
    await loadQueue()
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  }
}

async function saveWeights() {
  try {
    await api.put('/coordinator/assessment-settings', weights.value)
    await loadQueue()
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  }
}

onMounted(loadQueue)
</script>

<template>
  <div class="min-h-screen bg-[#e7ded3]">
    <AppHeader />
    <div class="flex flex-col md:flex-row flex-1 w-full min-w-0">
      <AppSidebar />
      <main class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 overflow-x-hidden">
        <section class="bg-[#5c001f] text-white rounded-2xl sm:rounded-[30px] p-5 sm:p-8 shadow-xl">
          <p class="text-[#f8be17] font-bold uppercase tracking-[0.2em] text-xs sm:text-sm flex items-center gap-2">
            <Sparkles class="w-5 h-5" /> Coordinator AI Matching
          </p>
          <h1 class="text-4xl font-bold mt-2">Assign Examiner</h1>
          <p class="text-white/75 mt-2">
            Projects enter this queue only after the supervisor approves the final deliverables for examination.
          </p>
        </section>

        <div v-if="error" class="bg-red-50 text-red-800 border border-red-200 rounded-2xl p-4 font-bold">
          {{ error }}
        </div>

        <section class="bg-white rounded-[22px] p-5 sm:p-6 shadow border border-slate-200">
          <div class="flex items-end gap-4 flex-wrap">
            <div>
              <h2 class="text-xl font-bold text-slate-900">Official assessment weighting</h2>
              <p class="text-sm font-medium text-slate-600">Set this only when the official faculty percentage is confirmed. It must total 100%.</p>
            </div>
            <label class="ml-auto">
              <span class="text-sm font-bold text-slate-900">Supervisor %</span>
              <input
                v-model.number="weights.supervisorWeight"
                type="number"
                min="0"
                max="100"
                class="block w-32 mt-1 px-3.5 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-[#5c001f] focus:bg-white transition-colors"
              />
            </label>
            <label>
              <span class="text-sm font-bold text-slate-900">Examiner %</span>
              <input
                v-model.number="weights.examinerWeight"
                type="number"
                min="0"
                max="100"
                class="block w-32 mt-1 px-3.5 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-[#5c001f] focus:bg-white transition-colors"
              />
            </label>
            <button @click="saveWeights" class="bg-[#5c001f] hover:bg-[#4a0019] text-white rounded-xl px-5 py-2.5 font-bold transition-colors cursor-pointer shadow-sm">
              Save weights
            </button>
            <span class="font-bold text-sm px-3 py-1.5 rounded-lg border" :class="weightsConfigured ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'">
              {{ weightsConfigured ? '✓ Configured' : '⚠ Not configured' }}
            </span>
          </div>
        </section>

        <div class="bg-white rounded-[20px] p-4 flex items-center gap-3 border-2 border-slate-200 shadow-sm focus-within:border-[#5c001f]">
          <Search class="w-5 h-5 text-slate-500 shrink-0" />
          <input
            v-model="search"
            class="flex-1 outline-none text-slate-900 font-semibold placeholder-slate-400 bg-transparent text-base"
            placeholder="Search project, student or supervisor..."
          />
          <button @click="loadQueue" class="font-bold text-[#5c001f] hover:text-[#4a0019] inline-flex items-center gap-2 cursor-pointer">
            <RefreshCw class="w-4 h-4" /> Refresh
          </button>
        </div>

        <div v-if="loading" class="bg-white rounded-2xl p-10 text-center">
          <Loader2 class="animate-spin mx-auto text-[#5c001f] w-8 h-8" />
        </div>

        <section v-else class="bg-white rounded-[26px] shadow-md overflow-hidden border border-slate-200">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[1000px]">
              <thead>
                <tr class="bg-[#f7f1ea] text-slate-900 text-left border-b-2 border-slate-300">
                  <th class="p-4 font-bold text-sm uppercase tracking-wider">FYP</th>
                  <th class="p-4 font-bold text-sm uppercase tracking-wider">Student</th>
                  <th class="p-4 font-bold text-sm uppercase tracking-wider">Supervisor</th>
                  <th class="p-4 font-bold text-sm uppercase tracking-wider">Status</th>
                  <th class="p-4 font-bold text-sm uppercase tracking-wider">Examiner</th>
                  <th class="p-4 font-bold text-sm uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="project in filtered" :key="project.project_id" class="border-t border-slate-200 hover:bg-slate-50/80 transition-colors">
                  <td class="p-4">
                    <p class="font-bold text-slate-900 text-base">{{ project.project_title }}</p>
                    <p class="text-sm font-semibold text-slate-600">{{ project.project_type }}</p>
                  </td>
                  <td class="p-4">
                    <span class="font-bold text-slate-900">{{ project.student_name }}</span><br />
                    <span class="text-sm font-medium text-slate-600">{{ project.matric_no }}</span>
                  </td>
                  <td class="p-4 font-bold text-slate-900">{{ project.supervisor_name }}</td>
                  <td class="p-4">
                    <span class="bg-amber-100 text-amber-900 border border-amber-300 rounded-full px-3 py-1 text-xs font-bold">{{ project.status }}</span>
                  </td>
                  <td class="p-4">
                    <p class="font-bold text-slate-900" :class="{ 'text-amber-700 italic': !project.examiner_name }">
                      {{ project.examiner_name || 'Not assigned' }}
                    </p>
                    <p class="text-sm font-medium text-slate-600">{{ project.examiner_email || '' }}</p>
                    <div v-if="project.supervisor_percentage != null || project.examiner_percentage != null" class="text-xs mt-2 bg-slate-100 border border-slate-200 p-2 rounded-lg text-slate-900">
                      <span class="font-semibold text-slate-700">Supervisor:</span> <strong class="text-slate-900">{{ project.supervisor_percentage ?? '-' }}%</strong> ·
                      <span class="font-semibold text-slate-700">Examiner:</span> <strong class="text-slate-900">{{ project.examiner_percentage ?? '-' }}%</strong><br />
                      <strong class="text-[#5c001f] text-sm mt-0.5 block">Combined: {{ project.combined_score ?? 'Waiting for weights/marks' }}</strong>
                    </div>
                  </td>
                  <td class="p-4">
                    <div class="flex flex-wrap gap-2">
                      <button v-if="!project.examiner_user_id" @click="match(project)" class="bg-[#5c001f] hover:bg-[#4a0019] text-white rounded-xl px-4 py-2 font-bold transition-colors cursor-pointer shadow-sm">AI Match</button>
                      <button v-else-if="project.evaluation_status !== 'Submitted'" @click="match(project)" class="border-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 rounded-xl px-4 py-2 font-bold transition-colors cursor-pointer">Change</button>
                      <button v-if="project.examiner_user_id && project.evaluation_status !== 'Submitted'" @click="remove(project)" class="border-2 border-red-300 bg-red-50 text-red-800 hover:bg-red-100 rounded-xl px-4 py-2 font-bold transition-colors cursor-pointer">Remove</button>
                      <button v-if="project.evaluation_status === 'Submitted' && project.status !== 'Result Released'" @click="requestRelease(project)" class="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-4 py-2 font-bold transition-colors cursor-pointer shadow-sm">Release result</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="!filtered.length" class="p-8 text-slate-600 font-medium">No projects are waiting in the examination workflow.</p>
        </section>

        <!-- AI Match Modal -->
        <div v-if="selected" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 p-4 sm:p-6 flex items-center justify-center" @click.self="selected = null">
          <section class="bg-white rounded-[28px] w-full max-w-4xl max-h-[90vh] overflow-auto p-6 sm:p-8 shadow-2xl border-2 border-slate-200">
            <div class="flex justify-between items-start gap-4 pb-4 border-b border-slate-200">
              <div>
                <p class="text-[#5c001f] font-bold uppercase tracking-[0.16em] text-xs sm:text-sm">AI Examiner Recommendation</p>
                <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{{ selected.project_title }}</h2>
                <p class="text-sm font-medium text-slate-600 mt-1">The supervisor is automatically excluded. AI recommends; the coordinator decides.</p>
              </div>
              <button @click="selected = null" class="text-slate-500 hover:text-slate-900 text-2xl font-bold p-1 cursor-pointer">✕</button>
            </div>

            <div v-if="matching" class="p-10 text-center">
              <Loader2 class="animate-spin mx-auto text-[#5c001f] w-8 h-8" />
              <p class="font-bold text-slate-900 mt-3">Analysing expertise, workload and availability…</p>
            </div>

            <div v-else class="space-y-4 mt-6">
              <article v-for="(candidate, index) in candidates" :key="candidate.user_id" class="bg-slate-50 border-2 border-slate-200 rounded-[18px] p-5 flex justify-between items-center gap-4 flex-wrap hover:border-slate-300 transition-all">
                <div class="space-y-1">
                  <p class="font-bold text-lg text-slate-900">{{ index + 1 }}. {{ candidate.full_name }} — <span class="text-[#5c001f] font-extrabold">{{ candidate.matchScore }}% match</span></p>
                  <p class="text-sm font-semibold text-slate-700">{{ candidate.expertise || candidate.industry_background || 'General expertise' }}</p>
                  <p class="text-sm font-medium text-slate-600">Pending grading: <strong class="text-slate-900">{{ candidate.pending_examinations }}</strong> · {{ candidate.department || candidate.organisation || candidate.affiliation || 'No department provided' }}</p>
                </div>
                <button @click="requestAssignment(candidate)" :disabled="!candidate.eligible" class="rounded-xl px-5 py-2.5 font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm transition-colors" :class="candidate.eligible ? 'bg-[#5c001f] hover:bg-[#4a0019] text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'">
                  <UserRoundCheck class="w-5 h-5" /> Assign
                </button>
              </article>
              <p v-if="!candidates.length" class="text-slate-600 font-medium p-4">No eligible examiner profiles are available.</p>
            </div>
          </section>
        </div>
      </main>
    </div>

    <EmailActionConfirmModal
      :open="Boolean(emailConfirmation)"
      :title="emailConfirmation?.title || 'Confirm action'"
      :description="emailConfirmation?.description || ''"
      :recipient="emailConfirmation?.recipient || ''"
      :confirm-label="emailConfirmation?.confirmLabel || 'Confirm'"
      :busy="actionBusy"
      @cancel="emailConfirmation = null"
      @confirm="confirmEmailAction"
    />
  </div>
</template>
