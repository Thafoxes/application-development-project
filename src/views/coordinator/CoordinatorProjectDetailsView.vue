<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  UserCheck,
  Edit3,
  Trash2,
  AlertTriangle,
  Send,
} from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import EmailActionConfirmModal from '@/components/EmailActionConfirmModal.vue'
import { api, fileUrl } from '@/services/ifamousApi'
import { formatMalaysiaDateTime } from '@/utils/dateTime'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const data = ref(null)
const nominationAction = ref(0)
const actionMessage = ref('')
const pendingNomination = ref(null)

const decisionLoading = ref(false)
const showRevisionModal = ref(false)
const revisionFeedback = ref('')
const showDeleteModal = ref(false)
const deleteConfirmTitle = ref('')
const deleteError = ref('')

const projectId = computed(() => Number(route.query.projectId || 0))
const project = computed(() => data.value?.project || {})
const submissions = computed(() => data.value?.submissions || [])
const nominations = computed(() => data.value?.nominations || [])
const assignmentHistory = computed(() => data.value?.assignmentHistory || [])
const proposalDocuments = computed(() =>
  submissions.value.filter((item) => String(item.submission_type || '').toLowerCase() === 'proposal'),
)

const isDeleteTitleMatching = computed(() => {
  const target = (project.value?.project_title || '').trim().toLowerCase()
  const entered = (deleteConfirmTitle.value || '').trim().toLowerCase()
  return target.length > 0 && target === entered
})

const loadProject = async () => {
  loading.value = true
  error.value = ''
  try {
    if (!projectId.value) throw new Error('Missing project ID.')
    data.value = (await api.get(`/projects/${projectId.value}/journey`)).data
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    loading.value = false
  }
}

const runAi = () => {
  router.push({ path: '/manage-fyp', query: { projectId: projectId.value, action: 'ai' } })
}

const approveFYP = async () => {
  if (!confirm('Are you sure you want to approve this FYP proposal?')) return
  decisionLoading.value = true
  actionMessage.value = ''
  try {
    const targetStatus = project.value.supervisor_user_id ? 'Active' : 'Pending AI Matching'
    await api.patch(`/coordinator/fyp-status/${projectId.value}`, {
      status: targetStatus,
    })
    actionMessage.value = `FYP proposal was successfully approved! Status set to ${targetStatus === 'Active' ? 'Active / Approved' : 'Pending AI Matching'}.`
    await loadProject()
  } catch (err) {
    actionMessage.value = err.response?.data?.error || err.message
  } finally {
    decisionLoading.value = false
  }
}

const openRevisionModal = () => {
  revisionFeedback.value = ''
  showRevisionModal.value = true
}

const submitRevisionRequest = async () => {
  if (!revisionFeedback.value.trim()) return
  decisionLoading.value = true
  actionMessage.value = ''
  try {
    await api.patch(`/coordinator/fyp-status/${projectId.value}`, {
      status: 'Revision Required',
      feedback: revisionFeedback.value.trim(),
    })
    actionMessage.value = 'FYP status set to Revision Required. Update request feedback sent to student.'
    showRevisionModal.value = false
    await loadProject()
  } catch (err) {
    actionMessage.value = err.response?.data?.error || err.message
  } finally {
    decisionLoading.value = false
  }
}

const openDeleteModal = () => {
  deleteConfirmTitle.value = ''
  deleteError.value = ''
  showDeleteModal.value = true
}

const confirmDeleteFYP = async () => {
  if (!isDeleteTitleMatching.value) {
    deleteError.value = 'The entered title does not match the FYP title.'
    return
  }
  decisionLoading.value = true
  deleteError.value = ''
  try {
    await api.delete(`/coordinator/fyp-projects/${projectId.value}`)
    showDeleteModal.value = false
    router.push({ path: '/manage-fyp', query: { deleted: 'true' } })
  } catch (err) {
    deleteError.value = err.response?.data?.error || err.message
  } finally {
    decisionLoading.value = false
  }
}

const setNominationStatus = async (item, status) => {
  await api.patch(`/projects/${projectId.value}/supervisor-nominations/${item.nomination_id}`, { status })
}

const rejectNomination = async (item) => {
  nominationAction.value = Number(item.nomination_id)
  actionMessage.value = ''
  try {
    await setNominationStatus(item, 'Not Selected')
    actionMessage.value = `${item.supervisor_name} was marked as not selected.`
    pendingNomination.value = null
    await loadProject()
  } catch (err) {
    actionMessage.value = err.response?.data?.error || err.message
  } finally {
    nominationAction.value = 0
  }
}

const requestAcceptNomination = (item) => {
  pendingNomination.value = item
}

const acceptNomination = async (item, sendEmail = true) => {
  nominationAction.value = Number(item.nomination_id)
  actionMessage.value = ''
  try {
    await api.post('/supervisor-matching/assign', {
      projectId: projectId.value,
      project: {
        projectTitle: project.value.project_title,
        projectType: project.value.project_type,
        abstract: project.value.abstract,
        keywords: project.value.keywords,
        members: [{ name: project.value.student_name, matricNo: project.value.matric_no }],
      },
      sendEmail,
      supervisor: {
        user_id: item.supervisor_user_id,
        name: item.supervisor_name,
        email: item.supervisor_email,
        expertise: item.research_expertise || 'General academic supervision',
        score: project.value.match_score || 0,
      },
    })
    await setNominationStatus(item, 'Accepted')
    actionMessage.value = `${item.supervisor_name} was assigned as the project supervisor.`
    pendingNomination.value = null
    await loadProject()
  } catch (err) {
    actionMessage.value = err.response?.data?.error || err.message
  } finally {
    nominationAction.value = 0
  }
}

// Supervisor Assignment / Change Modal state
const showSupervisorModal = ref(false)
const supervisorCandidates = ref([])
const loadingSupervisors = ref(false)
const supervisorModalError = ref('')
const assignSupervisorLoading = ref(false)

const openSupervisorModal = async () => {
  showSupervisorModal.value = true
  loadingSupervisors.value = true
  supervisorModalError.value = ''
  try {
    const res = await api.get(`/projects/${projectId.value}/supervisor-candidates`)
    supervisorCandidates.value = res.data.candidates || res.data.lecturers || []
  } catch (err) {
    supervisorModalError.value = err.response?.data?.error || err.message
  } finally {
    loadingSupervisors.value = false
  }
}

const assignSupervisor = async (cand) => {
  assignSupervisorLoading.value = true
  actionMessage.value = ''
  try {
    await api.post('/supervisor-matching/assign', {
      projectId: projectId.value,
      project: {
        projectTitle: project.value.project_title,
        projectType: project.value.project_type,
        abstract: project.value.abstract,
        keywords: project.value.keywords,
      },
      supervisor: {
        user_id: cand.user_id,
        name: cand.full_name || cand.name,
        email: cand.email,
        expertise: cand.expertise || 'General academic supervision',
      },
      sendEmail: true,
    })
    actionMessage.value = `${cand.full_name || cand.name} has been assigned as Supervisor!`
    showSupervisorModal.value = false
    await loadProject()
  } catch (err) {
    supervisorModalError.value = err.response?.data?.error || err.message
  } finally {
    assignSupervisorLoading.value = false
  }
}

// Examiner Assignment / Change Modal state
const showExaminerModal = ref(false)
const examinerCandidates = ref([])
const loadingExaminers = ref(false)
const examinerModalError = ref('')
const assignExaminerLoading = ref(false)

const openExaminerModal = async () => {
  showExaminerModal.value = true
  loadingExaminers.value = true
  examinerModalError.value = ''
  try {
    const res = await api.get(`/coordinator/examiner-match/${projectId.value}`)
    examinerCandidates.value = res.data.candidates || []
  } catch (err) {
    examinerModalError.value = err.response?.data?.error || err.message
  } finally {
    loadingExaminers.value = false
  }
}

const assignExaminer = async (cand) => {
  assignExaminerLoading.value = true
  actionMessage.value = ''
  try {
    await api.post(`/coordinator/projects/${projectId.value}/assign-examiner`, {
      examinerUserId: cand.user_id,
      matchScore: cand.matchScore || 80,
      reason: 'Coordinator Assignment',
      sendEmail: true,
    })
    actionMessage.value = `${cand.full_name || cand.name} has been assigned as Examiner!`
    showExaminerModal.value = false
    await loadProject()
  } catch (err) {
    examinerModalError.value = err.response?.data?.error || err.message
  } finally {
    assignExaminerLoading.value = false
  }
}

onMounted(loadProject)
</script>

<template>
  <div class="min-h-screen bg-[#e7ded3] text-[#241616]">
    <AppHeader />
    <div class="flex flex-col md:flex-row flex-1 w-full min-w-0">
      <AppSidebar />
      <main class="flex-1 p-4 sm:p-6 lg:p-9 space-y-6 min-w-0 overflow-x-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <button
            @click="router.push('/manage-fyp')"
            class="inline-flex items-center gap-2 font-bold text-[#5c001f]"
          >
            <ArrowLeft class="w-5 h-5" /> Back to Manage FYP
          </button>
          <button
            @click="runAi"
            class="inline-flex items-center gap-2 rounded-xl bg-[#5c001f] px-5 py-3 font-bold text-white"
          >
            <Sparkles class="w-5 h-5 text-[#f8be17]" /> Run AI Matching
          </button>
        </div>

        <section class="rounded-[30px] bg-[#5c001f] text-white p-8 shadow-xl relative overflow-hidden">
          <div class="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-[#f8be17]/20" />
          <div class="relative">
            <p class="text-[#f8be17] font-bold uppercase tracking-[0.2em]">Coordinator Project Review</p>
            <h1 class="text-3xl lg:text-4xl font-bold mt-2">{{ project.project_title || 'Project Details' }}</h1>
            <p class="text-white/75 mt-2">Review the proposal record and open or download the exact submitted file before running AI matching.</p>
          </div>
        </section>

        <section v-if="loading" class="bg-white rounded-[26px] p-10 text-center shadow">
          <Loader2 class="w-9 h-9 mx-auto animate-spin text-[#5c001f]" />
          <p class="font-bold mt-3">Loading project details...</p>
        </section>

        <section v-else-if="error" class="bg-red-50 border border-red-200 text-red-800 rounded-[24px] p-6 font-bold">
          {{ error }}
        </section>

        <template v-else-if="data">
          <!-- Coordinator Decision & Action Bar -->
          <section class="bg-white rounded-[26px] p-6 shadow border border-black/5">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 class="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 class="w-6 h-6 text-[#5c001f]" /> Coordinator FYP Decision Options
                </h2>
                <p class="text-sm text-gray-500 mt-1">
                  Approve the proposal for AI/supervisor matching, request student updates/revisions, or delete this FYP.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <!-- 1. Option for Approval -->
                <button
                  @click="approveFYP"
                  :disabled="decisionLoading"
                  class="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 font-bold shadow-md disabled:opacity-50 transition-all"
                >
                  <CheckCircle2 class="w-5 h-5" /> Approve FYP
                </button>

                <!-- 2. Option to Request Update -->
                <button
                  @click="openRevisionModal"
                  :disabled="decisionLoading"
                  class="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 font-bold shadow-md disabled:opacity-50 transition-all"
                >
                  <Edit3 class="w-5 h-5" /> Need Update
                </button>

                <!-- 3. Option to Delete FYP -->
                <button
                  @click="openDeleteModal"
                  :disabled="decisionLoading"
                  class="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 font-bold shadow-md disabled:opacity-50 transition-all"
                >
                  <Trash2 class="w-5 h-5" /> Delete FYP
                </button>
              </div>
            </div>
          </section>

          <section class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div class="xl:col-span-2 bg-white rounded-[26px] p-6 shadow border border-black/5">
              <h2 class="text-2xl font-bold">Project information</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div class="rounded-[16px] bg-[#f7f1ea] p-4 border border-[#e1d5cc]">
                  <p class="text-xs uppercase font-bold text-gray-500">Student</p>
                  <p class="font-bold mt-2">{{ project.student_name || 'Student' }}</p>
                  <p class="text-sm text-gray-500">{{ project.matric_no || '-' }}</p>
                </div>
                <div class="rounded-[16px] bg-[#f7f1ea] p-4 border border-[#e1d5cc]">
                  <p class="text-xs uppercase font-bold text-gray-500">Status</p>
                  <p class="font-bold mt-2">{{ project.status || '-' }}</p>
                </div>
                <div class="rounded-[16px] bg-[#f7f1ea] p-4 border border-[#e1d5cc]">
                  <p class="text-xs uppercase font-bold text-gray-500">Project type</p>
                  <p class="font-bold mt-2">{{ project.project_type || 'Development' }}</p>
                </div>
                <div class="rounded-[16px] bg-[#f7f1ea] p-4 border border-[#e1d5cc]">
                  <p class="text-xs uppercase font-bold text-gray-500">Supervisor</p>
                  <p class="font-bold mt-2">{{ project.supervisor_name || 'Not Assigned' }}</p>
                  <p class="text-sm text-gray-500">{{ project.supervisor_email || '' }}</p>
                </div>
              </div>

              <div class="rounded-[16px] border border-[#e1d5cc] p-5 mt-5">
                <p class="font-bold text-[#5c001f]">Abstract</p>
                <p class="mt-3 whitespace-pre-line leading-relaxed text-gray-700">{{ project.abstract || 'No abstract available.' }}</p>
              </div>
              <div class="rounded-[16px] border border-[#e1d5cc] p-5 mt-4">
                <p class="font-bold text-[#5c001f]">Keywords</p>
                <p class="mt-3 text-gray-700">{{ project.keywords || '-' }}</p>
              </div>
            </div>

            <aside class="bg-white rounded-[26px] p-6 shadow border border-black/5 h-fit">
              <h2 class="text-xl font-bold flex items-center gap-2"><UserCheck class="w-5 h-5 text-[#5c001f]" /> Assignment</h2>
              <div class="mt-4 space-y-3 text-sm">
                <p><strong>Supervisor:</strong> {{ project.supervisor_name || 'Not Assigned' }}</p>
                <p><strong>Examiner:</strong> {{ project.assigned_examiner_name || project.examiner_name || 'Not Assigned' }}</p>
                <p><strong>Created:</strong> {{ formatMalaysiaDateTime(project.created_at) }}</p>
                <p><strong>Updated:</strong> {{ formatMalaysiaDateTime(project.updated_at) }}</p>
              </div>
            </aside>
          </section>

          <!-- Supervisor & Examiner Management Section -->
          <section class="bg-white rounded-[26px] p-6 shadow border border-black/5 space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 class="text-2xl font-bold flex items-center gap-2 text-[#5c001f]">
                  <UserCheck class="w-6 h-6 text-[#5c001f]" /> Supervisor & Examiner Management
                </h2>
                <p class="text-sm text-gray-500 mt-1">
                  Assign or change the assigned supervisor and examiner for this FYP project.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Supervisor Box -->
              <div class="rounded-[20px] bg-[#f7f1ea] border border-[#e1d5cc] p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs uppercase font-bold tracking-wider text-[#5c001f]">Project Supervisor</span>
                    <span
                      class="px-3 py-1 rounded-full text-xs font-bold"
                      :class="project.supervisor_user_id ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                    >
                      {{ project.supervisor_user_id ? 'Assigned' : 'Unassigned' }}
                    </span>
                  </div>

                  <div class="mt-4">
                    <h3 class="text-xl font-bold text-gray-900">{{ project.supervisor_name || 'Not Assigned' }}</h3>
                    <p class="text-sm text-gray-600 font-medium">{{ project.supervisor_email || 'No email available' }}</p>
                    <p class="text-xs text-gray-500 mt-2" v-if="project.supervisor_expertise">
                      <strong>Expertise:</strong> {{ project.supervisor_expertise }}
                    </p>
                  </div>
                </div>

                <div class="pt-2">
                  <button
                    @click="openSupervisorModal"
                    class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#5c001f] hover:bg-[#430016] text-white px-5 py-3 font-bold shadow transition-all cursor-pointer"
                  >
                    <Edit3 class="w-4 h-4 text-[#f8be17]" />
                    {{ project.supervisor_user_id ? 'Change Supervisor' : 'Assign Supervisor' }}
                  </button>
                </div>
              </div>

              <!-- Examiner Box -->
              <div class="rounded-[20px] bg-[#f7f1ea] border border-[#e1d5cc] p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs uppercase font-bold tracking-wider text-[#5c001f]">Project Examiner</span>
                    <span
                      class="px-3 py-1 rounded-full text-xs font-bold"
                      :class="project.examiner_user_id || project.assigned_examiner_name ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'"
                    >
                      {{ project.examiner_user_id || project.assigned_examiner_name ? 'Assigned' : 'Unassigned' }}
                    </span>
                  </div>

                  <div class="mt-4">
                    <h3 class="text-xl font-bold text-gray-900">{{ project.assigned_examiner_name || project.examiner_name || 'Not Assigned' }}</h3>
                    <p class="text-sm text-gray-600 font-medium">{{ project.assigned_examiner_email || project.examiner_email || 'No email available' }}</p>
                    <p class="text-xs text-gray-500 mt-2" v-if="project.assigned_examiner_expertise">
                      <strong>Expertise:</strong> {{ project.assigned_examiner_expertise }}
                    </p>
                  </div>
                </div>

                <div class="pt-2">
                  <button
                    @click="openExaminerModal"
                    class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#5c001f] hover:bg-[#430016] text-white px-5 py-3 font-bold shadow transition-all cursor-pointer"
                  >
                    <UserCheck class="w-4 h-4 text-[#f8be17]" />
                    {{ project.examiner_user_id || project.assigned_examiner_name ? 'Change Examiner' : 'Assign Examiner' }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Assignment History & Audit Log Section -->
          <section class="bg-white rounded-[26px] p-6 shadow border border-black/5 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold flex items-center gap-2 text-gray-900">
                  <FileText class="w-5 h-5 text-[#5c001f]" /> Assignment Audit Log & History
                </h2>
                <p class="text-xs text-gray-500 mt-0.5">
                  Complete historical record of all supervisor and examiner assignments for this FYP project.
                </p>
              </div>
              <span class="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                {{ assignmentHistory.length }} Records
              </span>
            </div>

            <div v-if="assignmentHistory.length" class="overflow-x-auto border border-gray-200 rounded-2xl">
              <table class="w-full text-left text-sm">
                <thead class="bg-[#f7f1ea] text-[#5c001f] font-bold text-xs uppercase border-b border-[#e1d5cc]">
                  <tr>
                    <th class="p-3">Role</th>
                    <th class="p-3">Assigned Handler</th>
                    <th class="p-3">Status</th>
                    <th class="p-3">Assigned At</th>
                    <th class="p-3">Unassigned At</th>
                    <th class="p-3">Assigned By / Reason</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 font-medium">
                  <tr v-for="(item, idx) in assignmentHistory" :key="idx" class="hover:bg-gray-50/80">
                    <td class="p-3">
                      <span
                        class="px-2.5 py-1 rounded-full text-xs font-bold"
                        :class="item.role_type === 'Supervisor' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'"
                      >
                        {{ item.role_type }}
                      </span>
                    </td>
                    <td class="p-3">
                      <p class="font-bold text-gray-900">{{ item.person_name || 'User #' + (item.supervisor_user_id || item.examiner_user_id) }}</p>
                      <p class="text-xs text-gray-500">{{ item.person_email || '-' }}</p>
                    </td>
                    <td class="p-3">
                      <span
                        class="px-2 py-0.5 rounded text-xs font-bold"
                        :class="item.status === 'Assigned' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Reassigned' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'"
                      >
                        {{ item.status }}
                      </span>
                    </td>
                    <td class="p-3 text-xs text-gray-600">{{ formatMalaysiaDateTime(item.assigned_at) }}</td>
                    <td class="p-3 text-xs text-gray-600">{{ item.unassigned_at ? formatMalaysiaDateTime(item.unassigned_at) : '-' }}</td>
                    <td class="p-3 text-xs text-gray-500">
                      <p class="font-semibold text-gray-700">{{ item.assigned_by_name || 'System / Coordinator' }}</p>
                      <p class="text-[11px] italic" v-if="item.assignment_reason">{{ item.assignment_reason }}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="rounded-xl bg-gray-50 p-4 text-center text-xs text-gray-500 font-medium">
              No previous assignment changes recorded in the audit log.
            </div>
          </section>

          <section class="bg-white rounded-[26px] p-6 shadow border border-black/5">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 class="text-2xl font-bold flex items-center gap-2"><Sparkles class="w-6 h-6 text-[#5c001f]" /> Student supervisor nominations</h2>
                <p class="text-gray-500 mt-1">The student preferences are advisory. Review suitability, workload and capacity before accepting one.</p>
              </div>
              <button @click="runAi" class="inline-flex items-center gap-2 rounded-xl bg-[#5c001f] px-4 py-2.5 font-bold text-white">
                <Sparkles class="w-4 h-4 text-[#f8be17]" /> Rerun AI / choose another
              </button>
            </div>

            <p v-if="actionMessage" class="mt-4 rounded-xl border border-[#e1d5cc] bg-[#f7f1ea] p-3 font-bold text-[#5c001f]">{{ actionMessage }}</p>

            <div v-if="nominations.length" class="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-5">
              <article v-for="item in nominations" :key="item.nomination_id" class="rounded-[18px] border border-[#e1d5cc] p-5">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs uppercase tracking-[0.15em] font-bold text-[#5c001f]">Preference #{{ item.preference_rank }}</p>
                    <h3 class="text-lg font-bold mt-1">{{ item.supervisor_name }}</h3>
                    <p class="text-sm text-gray-500">{{ item.supervisor_email }}</p>
                  </div>
                  <span class="rounded-full px-3 py-1 text-xs font-bold" :class="item.status === 'Accepted' ? 'bg-green-100 text-green-800' : item.status === 'Not Selected' ? 'bg-red-100 text-red-800' : 'bg-[#fff3c4] text-[#5c001f]'">{{ item.status }}</span>
                </div>
                <p class="text-sm mt-3"><strong>Expertise:</strong> {{ item.research_expertise || 'General academic supervision' }}</p>
                <p class="text-sm mt-2"><strong>Capacity:</strong> {{ item.current_capacity || 0 }} / {{ item.sv_capacity || 5 }}</p>
                <p v-if="item.note" class="text-xs text-gray-500 mt-3">{{ item.note }}</p>
                <div v-if="!project.supervisor_user_id && item.status === 'Nominated'" class="flex flex-wrap gap-2 mt-4">
                  <button @click="requestAcceptNomination(item)" :disabled="nominationAction === item.nomination_id" class="rounded-xl bg-green-700 px-4 py-2 font-bold text-white inline-flex items-center gap-2 disabled:opacity-60">
                    <CheckCircle2 class="w-4 h-4" /> Accept & assign
                  </button>
                  <button @click="rejectNomination(item)" :disabled="nominationAction === item.nomination_id" class="rounded-xl border border-red-300 px-4 py-2 font-bold text-red-700 inline-flex items-center gap-2 disabled:opacity-60">
                    <XCircle class="w-4 h-4" /> Not suitable
                  </button>
                </div>
              </article>
            </div>
            <div v-else class="mt-5 rounded-[18px] bg-[#f7f1ea] border border-[#e1d5cc] p-5 text-gray-600">
              No student nomination was submitted. Use AI matching or manual assignment.
            </div>
          </section>

          <section class="bg-white rounded-[26px] p-6 shadow border border-black/5">
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 class="text-2xl font-bold flex items-center gap-2"><FileText class="w-6 h-6 text-[#5c001f]" /> Proposal documents</h2>
                <p class="text-gray-500 mt-1">PDF, DOC, DOCX, TXT and supported files are shown here.</p>
              </div>
            </div>

            <div v-if="proposalDocuments.length" class="space-y-3 mt-5">
              <div
                v-for="item in proposalDocuments"
                :key="item.submission_id"
                class="rounded-[18px] border border-[#e1d5cc] p-4 flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <p class="font-bold">{{ item.original_file_name || item.submission_title }}</p>
                  <p class="text-sm text-gray-500">{{ item.mime_type || 'Document' }} · {{ item.status }} · {{ formatMalaysiaDateTime(item.submitted_at) }}</p>
                </div>
                <div class="flex gap-2">
                  <a
                    :href="fileUrl(projectId, item.submission_id)"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center gap-2 rounded-xl border border-[#5c001f] px-4 py-2 font-bold text-[#5c001f]"
                  >
                    <Eye class="w-4 h-4" /> View
                  </a>
                  <a
                    :href="fileUrl(projectId, item.submission_id, true)"
                    class="inline-flex items-center gap-2 rounded-xl bg-[#5c001f] px-4 py-2 font-bold text-white"
                  >
                    <Download class="w-4 h-4" /> Download
                  </a>
                </div>
              </div>
            </div>
            <div v-else class="mt-5 rounded-[18px] bg-amber-50 border border-amber-200 p-5 text-amber-800">
              <p class="font-bold">No proposal document record was found.</p>
              <p class="text-sm mt-1">This is not caused by DOCX itself. It means the submission row was not saved or the old submission foreign key still points to the legacy project table.</p>
            </div>
          </section>
        </template>
      </main>
    </div>

    <EmailActionConfirmModal
      :open="Boolean(pendingNomination)"
      title="Accept and assign this nomination?"
      :description="pendingNomination ? `${pendingNomination.supervisor_name} will become the assigned supervisor for this project.` : ''"
      :recipient="pendingNomination?.supervisor_email || pendingNomination?.supervisor_name || ''"
      confirm-label="Accept and assign"
      :busy="Boolean(nominationAction)"
      @cancel="pendingNomination = null"
      @confirm="(sendEmail) => acceptNomination(pendingNomination, sendEmail)"
    />

    <!-- Revision Request Modal -->
    <div
      v-if="showRevisionModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-lg rounded-[26px] bg-white p-6 shadow-2xl space-y-4">
        <div class="flex items-center gap-3 text-amber-700">
          <div class="rounded-full bg-amber-100 p-2.5">
            <Edit3 class="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900">Request FYP Update</h3>
            <p class="text-xs text-gray-500">Student will be notified to revise their FYP proposal</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">
            Revision Instructions for Student <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="revisionFeedback"
            rows="4"
            placeholder="Specify what details, objectives, or documents the student needs to update..."
            class="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-amber-500 focus:outline-none"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            @click="showRevisionModal = false"
            class="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="submitRevisionRequest"
            :disabled="!revisionFeedback.trim() || decisionLoading"
            class="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2 text-sm font-bold text-white shadow disabled:opacity-50"
          >
            <Send class="w-4 h-4" /> Send Request
          </button>
        </div>
      </div>
    </div>

    <!-- Delete FYP Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-md rounded-[26px] bg-white p-6 shadow-2xl space-y-4">
        <div class="flex items-center gap-3 text-red-600">
          <div class="rounded-full bg-red-100 p-2.5">
            <AlertTriangle class="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900">Delete FYP Project</h3>
            <p class="text-xs text-red-600 font-semibold">Warning: This action cannot be undone!</p>
          </div>
        </div>

        <div class="text-sm text-gray-600 space-y-2">
          <p>This will permanently delete the FYP project record and all associated submissions and nominations.</p>
          <p class="font-bold text-gray-800 pt-1">
            To confirm deletion, please type the exact FYP title below:
          </p>
          <div class="rounded-xl bg-gray-100 p-3 font-mono text-xs font-bold text-gray-900 break-words select-all border border-gray-200">
            {{ project.project_title }}
          </div>
          <input
            v-model="deleteConfirmTitle"
            type="text"
            placeholder="Type project title here..."
            class="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-red-500 focus:outline-none mt-2"
          />
          <p v-if="deleteError" class="text-xs font-bold text-red-600 mt-1">{{ deleteError }}</p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteModal = false"
            class="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="confirmDeleteFYP"
            :disabled="!isDeleteTitleMatching || decisionLoading"
            class="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2 text-sm font-bold text-white shadow disabled:opacity-50"
          >
            <Trash2 class="w-4 h-4" /> Delete FYP Permanently
          </button>
        </div>
      </div>
    </div>

    <!-- Change / Assign Supervisor Modal -->
    <div
      v-if="showSupervisorModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-2xl rounded-[26px] bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 class="text-xl font-bold text-gray-900">Assign / Change Supervisor</h3>
            <p class="text-xs text-gray-500">Select a lecturer to assign as supervisor for this project</p>
          </div>
          <button @click="showSupervisorModal = false" class="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">✕</button>
        </div>

        <div v-if="supervisorModalError" class="bg-red-50 text-red-800 text-xs p-3 rounded-xl font-bold">
          {{ supervisorModalError }}
        </div>

        <div v-if="loadingSupervisors" class="p-8 text-center">
          <Loader2 class="w-8 h-8 animate-spin mx-auto text-[#5c001f]" />
          <p class="text-xs font-bold mt-2">Loading available lecturers...</p>
        </div>

        <div v-else class="flex-1 overflow-y-auto space-y-3 pr-1">
          <div
            v-for="cand in supervisorCandidates"
            :key="cand.user_id"
            class="p-4 rounded-xl border border-gray-200 hover:border-[#5c001f] transition-all flex flex-wrap items-center justify-between gap-3 bg-slate-50/50"
          >
            <div>
              <p class="font-bold text-gray-900 text-base">{{ cand.full_name || cand.name }}</p>
              <p class="text-xs text-gray-500 font-medium">{{ cand.email }}</p>
              <p class="text-xs text-gray-600 mt-1" v-if="cand.expertise">
                <strong>Expertise:</strong> {{ cand.expertise }}
              </p>
              <p class="text-xs text-gray-500 mt-0.5">
                Capacity: {{ cand.current_capacity || 0 }} / {{ cand.sv_capacity || 5 }}
              </p>
            </div>

            <button
              @click="assignSupervisor(cand)"
              :disabled="assignSupervisorLoading"
              class="rounded-xl bg-[#5c001f] hover:bg-[#430016] text-white px-4 py-2 text-xs font-bold shadow disabled:opacity-50 cursor-pointer"
            >
              Assign Supervisor
            </button>
          </div>
        </div>

        <div class="pt-2 border-t border-gray-100 flex justify-end">
          <button @click="showSupervisorModal = false" class="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Change / Assign Examiner Modal -->
    <div
      v-if="showExaminerModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-2xl rounded-[26px] bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 class="text-xl font-bold text-gray-900">Assign / Change Examiner</h3>
            <p class="text-xs text-gray-500">Select an eligible examiner candidate for this project</p>
          </div>
          <button @click="showExaminerModal = false" class="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">✕</button>
        </div>

        <div v-if="examinerModalError" class="bg-red-50 text-red-800 text-xs p-3 rounded-xl font-bold">
          {{ examinerModalError }}
        </div>

        <div v-if="loadingExaminers" class="p-8 text-center">
          <Loader2 class="w-8 h-8 animate-spin mx-auto text-[#5c001f]" />
          <p class="text-xs font-bold mt-2">Loading examiner candidates...</p>
        </div>

        <div v-else class="flex-1 overflow-y-auto space-y-3 pr-1">
          <div
            v-for="cand in examinerCandidates"
            :key="cand.user_id"
            class="p-4 rounded-xl border border-gray-200 hover:border-[#5c001f] transition-all flex flex-wrap items-center justify-between gap-3 bg-slate-50/50"
          >
            <div>
              <div class="flex items-center gap-2">
                <p class="font-bold text-gray-900 text-base">{{ cand.full_name || cand.name }}</p>
                <span v-if="cand.matchScore" class="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                  {{ cand.matchScore }}% Match
                </span>
              </div>
              <p class="text-xs text-gray-500 font-medium">{{ cand.email }}</p>
              <p class="text-xs text-gray-600 mt-1" v-if="cand.expertise">
                <strong>Expertise:</strong> {{ cand.expertise }}
              </p>
              <p class="text-xs text-gray-500 mt-0.5" v-if="cand.reason">
                {{ cand.reason }}
              </p>
            </div>

            <button
              @click="assignExaminer(cand)"
              :disabled="assignExaminerLoading"
              class="rounded-xl bg-[#5c001f] hover:bg-[#430016] text-white px-4 py-2 text-xs font-bold shadow disabled:opacity-50 cursor-pointer"
            >
              Assign Examiner
            </button>
          </div>
        </div>

        <div class="pt-2 border-t border-gray-100 flex justify-end">
          <button @click="showExaminerModal = false" class="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
