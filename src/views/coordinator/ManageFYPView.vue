<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/common_components/AppHeader.vue'
import AppSidebar from '@/components/common_components/AppSidebar.vue'
import AppFooter from '@/components/common_components/AppFooter.vue'
import WorkflowSteps from '@/components/common_components/WorkflowSteps.vue'
import {
  UploadCloud,
  FileText,
  BrainCircuit,
  Users,
  AlertTriangle,
  ArrowRight,
  Search,
  Sparkles,
  ClipboardList,
  UserCheck,
  FolderKanban,
  Eye,
  Mail,
  Phone,
  Building2,
  BadgeCheck,
  BookOpen,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  Check,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const fypSteps = [
  {
    stepLabel: 'Step 1',
    title: 'Proposal Queue',
    description: 'Review proposal files submitted by students.',
    icon: UploadCloud,
  },
  {
    stepLabel: 'Step 2',
    title: 'AI Matching',
    description: 'Compare project content with lecturer expertise.',
    icon: BrainCircuit,
  },
  {
    stepLabel: 'Step 3',
    title: 'Assign Supervisor',
    description: 'Coordinator confirms the recommended supervisor and examiner.',
    icon: UserCheck,
  },
  {
    stepLabel: 'Step 4',
    title: 'Track Records',
    description: 'Assignment and approval status are monitored from one workspace.',
    icon: ClipboardList,
  },
]

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const activeTab = ref('queue')

const isExtracting = ref(false)
const isMatching = ref(false)
const isAssigning = ref(false)
const isLoadingRecords = ref(false)

const extractError = ref('')
const extractSuccess = ref('')
const matchError = ref('')
const assignError = ref('')
const recordsError = ref('')

const extractionSource = ref('none')
const matchSource = ref('none')
const selectedFileName = ref('')

const showAssignModal = ref(false)
const pendingSupervisor = ref(null)
const lastAssignment = ref(null)

const proposalForm = ref({
  members: [],
  memberText: '',
  studentName: '',
  matricNo: '',
  projectTitle: '',
  projectType: 'Development',
  abstract: '',
  keywords: '',
})

const recommendedSupervisors = ref([])

const selectedSupervisor = ref(null)
const projectRecords = ref([])
const submittedProposals = ref([])
const isLoadingQueue = ref(false)
const queueError = ref('')
const selectedQueueProjectId = ref(null)

const loadSubmittedProposalQueue = async () => {
  isLoadingQueue.value = true
  queueError.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator/fyp-queue`)
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to load submitted proposal queue.')
    }

    submittedProposals.value = data.projects || []

    const selectedProjectId = route.query.projectId
    if (selectedProjectId) {
      const selected = submittedProposals.value.find(
        (project) => String(project.project_id) === String(selectedProjectId),
      )

      if (selected) {
        openSubmittedProposal(selected)
      }
    }
  } catch (error) {
    console.error('Load submitted proposal queue error:', error)
    queueError.value = error.message || 'Failed to load submitted proposal queue.'
  } finally {
    isLoadingQueue.value = false
  }
}

const openSubmittedProposal = (project) => {
  selectedQueueProjectId.value = project.project_id
  recommendedSupervisors.value = []
  selectedSupervisor.value = null
  matchSource.value = 'database'
  lastAssignment.value = null

  proposalForm.value = {
    members: [
      {
        name: project.studentName || 'Student',
        matricNo: project.matricNo || '',
      },
    ],
    memberText: `${project.studentName || 'Student'} (${project.matricNo || '-'})`,
    studentName: project.studentName || 'Student',
    matricNo: project.matricNo || '',
    projectTitle: project.projectTitle || '',
    projectType: project.projectType || 'Development',
    abstract: project.abstract || '',
    keywords: project.keywords || '',
  }

  selectedFileName.value = project.fileName || 'Proposal document'
  extractionSource.value = 'database'
  extractSuccess.value = `Loaded proposal "${project.projectTitle}" from student submission queue.`
  extractError.value = ''
  matchError.value = ''

  activeTab.value = 'matching'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const setActiveTab = async (tabName) => {
  activeTab.value = tabName

  if (tabName === 'records') {
    await loadProjectRecords()
  }
}

const updateMemberText = () => {
  proposalForm.value.memberText = proposalForm.value.members
    .filter((member) => member.name || member.matricNo)
    .map(
      (member, index) =>
        `${index + 1}. ${member.name || 'Unnamed'} (${member.matricNo || 'No matric'})`,
    )
    .join('\n')

  proposalForm.value.studentName = proposalForm.value.members[0]?.name || ''
  proposalForm.value.matricNo = proposalForm.value.members[0]?.matricNo || ''
}

const addMember = () => {
  proposalForm.value.members.push({
    name: '',
    matricNo: '',
  })

  updateMemberText()
}

const removeMember = (index) => {
  proposalForm.value.members.splice(index, 1)
  updateMemberText()
}

const handleFileUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  selectedFileName.value = file.name
  extractError.value = ''
  extractSuccess.value = ''
  extractionSource.value = 'none'

  try {
    isExtracting.value = true

    const formData = new FormData()
    formData.append('proposal', file)

    const response = await fetch(`${API_BASE_URL}/api/supervisor-matching/extract-proposal`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to extract proposal file.')
    }

    const extracted = data.extracted || {}
    const members = Array.isArray(extracted.members) ? extracted.members : []

    proposalForm.value = {
      members,
      memberText:
        extracted.memberText ||
        members
          .map((member, index) => `${index + 1}. ${member.name || ''} (${member.matricNo || ''})`)
          .join('\n'),
      studentName: extracted.studentName || members[0]?.name || '',
      matricNo: extracted.matricNo || members[0]?.matricNo || '',
      projectTitle: extracted.projectTitle || '',
      projectType: extracted.projectType || 'Development',
      abstract: extracted.abstract || '',
      keywords: extracted.keywords || '',
    }

    extractionSource.value = data.extractionSource || 'unknown'
    extractSuccess.value = `Proposal extracted successfully from ${file.name}.`
  } catch (error) {
    console.error('Proposal extraction error:', error)
    extractError.value =
      error.message || 'Failed to extract proposal. Please use .txt, .docx, or text-based .pdf.'
  } finally {
    isExtracting.value = false
  }
}

const fillSampleProposal = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator/fyp-queue`)
    const data = await response.json()
    if (data.success && data.projects && data.projects.length > 0) {
      const sample = data.projects.find((p) => p.matricNo === 'A24MJ5068') || data.projects[0]
      const membersList = sample.details?.members ||
        sample.members || [{ name: sample.studentName, matricNo: sample.matricNo }]

      proposalForm.value = {
        members: membersList,
        memberText: membersList.map((m, idx) => `${idx + 1}. ${m.name} (${m.matricNo})`).join('\n'),
        studentName: sample.studentName,
        matricNo: sample.matricNo,
        projectTitle: sample.projectTitle,
        projectType: sample.projectType === 'Research' ? 'Research' : 'Development',
        abstract: sample.abstract,
        keywords: sample.keywords,
      }
      extractSuccess.value = 'Sample proposal data filled from database.'
      extractError.value = ''
    } else {
      extractError.value = 'No sample proposal data found in database.'
    }
  } catch (error) {
    console.error('Failed to fill sample proposal:', error)
    extractError.value = 'Failed to load sample proposal from database.'
  }
}

const updateStatus = async (projectId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator/fyp-status/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
    const data = await response.json()
    if (response.ok && data.success) {
      await loadSubmittedProposalQueue()
    } else {
      alert(data.error || 'Failed to update proposal status.')
    }
  } catch (error) {
    console.error('Update status error:', error)
    alert('Failed to connect to the server to update status.')
  }
}

const updateProjectStatus = async (status, matchScore = null) => {
  if (!selectedQueueProjectId.value) return

  try {
    await fetch(`${API_BASE_URL}/api/coordinator/fyp-status/${selectedQueueProjectId.value}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        matchScore,
      }),
    })
  } catch (error) {
    console.error('Update project status error:', error)
  }
}

const runAIMatch = async () => {
  matchError.value = ''

  await updateProjectStatus('Pending AI Matching')

  if (
    !proposalForm.value.projectTitle &&
    !proposalForm.value.abstract &&
    !proposalForm.value.keywords
  ) {
    matchError.value = 'Please enter or upload proposal details before running AI matching.'
    activeTab.value = 'matching'
    return
  }

  try {
    isMatching.value = true
    activeTab.value = 'matching'

    const response = await fetch(`${API_BASE_URL}/api/supervisor-matching/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proposalForm.value),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to run AI supervisor matching.')
    }

    recommendedSupervisors.value = data.recommendations || []
    selectedSupervisor.value = recommendedSupervisors.value[0] || null

    await updateProjectStatus(
      'Pending Supervisor Assignment',
      recommendedSupervisors.value[0]?.score || null,
    )
    matchSource.value = data.source || 'unknown'
  } catch (error) {
    console.error('AI supervisor matching error:', error)
    matchError.value =
      error.message || 'AI matching failed. Please make sure the backend is running.'
  } finally {
    isMatching.value = false
  }
}

const viewSupervisorProfile = (supervisor) => {
  selectedSupervisor.value = supervisor
  activeTab.value = 'profile'
}

const openAssignConfirmation = (supervisor) => {
  pendingSupervisor.value = supervisor
  assignError.value = ''
  showAssignModal.value = true
}

const closeAssignConfirmation = () => {
  if (isAssigning.value) return
  showAssignModal.value = false
  pendingSupervisor.value = null
}

const confirmAssignment = async () => {
  if (!pendingSupervisor.value) return

  assignError.value = ''

  try {
    isAssigning.value = true

    const response = await fetch(`${API_BASE_URL}/api/supervisor-matching/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: selectedQueueProjectId.value,
        project: proposalForm.value,
        supervisor: pendingSupervisor.value,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to assign supervisor.')
    }

    lastAssignment.value = data.assignment
    showAssignModal.value = false
    pendingSupervisor.value = null
    activeTab.value = 'success'

    await loadProjectRecords()
  } catch (error) {
    console.error('Assign supervisor error:', error)
    assignError.value = error.message || 'Failed to assign supervisor.'
  } finally {
    isAssigning.value = false
  }
}

const loadProjectRecords = async () => {
  recordsError.value = ''

  try {
    isLoadingRecords.value = true

    const response = await fetch(`${API_BASE_URL}/api/supervisor-matching/projects`)
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to load project records.')
    }

    projectRecords.value = data.projects || []
  } catch (error) {
    console.error('Load project records error:', error)
    recordsError.value = error.message || 'Failed to load project records.'
  } finally {
    isLoadingRecords.value = false
  }
}

const goToDashboard = () => {
  router.push('/dashboard')
}

onMounted(async () => {
  await loadSubmittedProposalQueue()
  loadProjectRecords()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black">
    <AppHeader />

    <div class="flex flex-1 w-full relative">
      <AppSidebar />

      <main class="flex-1 flex flex-col px-[50px] py-[30px] gap-8 overflow-y-auto">
        <!-- Breadcrumbs -->
        <div class="text-[#5c001f] text-sm">
          <router-link to="/dashboard" class="hover:underline font-semibold text-[#5c001f]">
            Dashboard
          </router-link>
          <span class="mx-2 text-gray-500">&gt;</span>
          <span class="font-bold underline text-[#5c001f]">Manage FYP Proposals</span>
        </div>

        <!-- Page Header -->
        <section
          class="relative overflow-hidden rounded-lg bg-[#5c001f] text-white shadow-xl border border-black/10"
        >
          <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#f8be17]/20"></div>
          <div class="absolute right-20 bottom-[-70px] w-40 h-40 rounded-full bg-white/10"></div>

          <div
            class="relative p-8 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6"
          >
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="w-12 h-12 rounded-lg bg-[#f8be17] flex items-center justify-center shadow-md"
                >
                  <FolderKanban class="w-7 h-7 text-[#5c001f]" />
                </div>

                <div>
                  <p class="text-[#f8be17] font-bold text-sm uppercase tracking-[0.2em]">
                    Coordinator Module
                  </p>
                  <h1 class="font-bold text-[36px] leading-tight">Manage FYP Proposals</h1>
                </div>
              </div>

              <p class="text-white/80 max-w-3xl text-[16px] leading-relaxed">
                Review student-submitted proposal records, run AI supervisor matching, assign
                supervisors and examiners, and monitor project status.
              </p>
            </div>
          </div>
        </section>

        <!-- Workflow Cards -->
        <WorkflowSteps :steps="fypSteps" />

        <!-- Main Panel -->
        <section class="bg-white rounded-lg shadow-lg border border-black/10 overflow-hidden">
          <!-- Tabs -->
          <div class="bg-gray-50 px-7 pt-7 border-b border-gray-300">
            <div class="flex flex-wrap gap-3">
              <button
                @click="setActiveTab('queue')"
                :class="[
                  'px-5 py-3 rounded-t-lg font-bold flex items-center gap-2 transition-colors',
                  activeTab === 'queue'
                    ? 'bg-[#5c001f] text-white'
                    : 'bg-white text-[#5c001f] hover:bg-[#fff8df]',
                ]"
              >
                <UploadCloud class="w-5 h-5" />
                Submitted Proposal Queue
              </button>

              <button
                @click="setActiveTab('matching')"
                :class="[
                  'px-5 py-3 rounded-t-lg font-bold flex items-center gap-2 transition-colors',
                  activeTab === 'matching'
                    ? 'bg-[#5c001f] text-white'
                    : 'bg-white text-[#5c001f] hover:bg-[#fff8df]',
                ]"
              >
                <BrainCircuit class="w-5 h-5" />
                AI Matching Result
              </button>

              <button
                @click="setActiveTab('profile')"
                :class="[
                  'px-5 py-3 rounded-t-lg font-bold flex items-center gap-2 transition-colors',
                  activeTab === 'profile'
                    ? 'bg-[#5c001f] text-white'
                    : 'bg-white text-[#5c001f] hover:bg-[#fff8df]',
                ]"
              >
                <Users class="w-5 h-5" />
                Lecturer Profile
              </button>

              <button
                @click="setActiveTab('records')"
                :class="[
                  'px-5 py-3 rounded-t-lg font-bold flex items-center gap-2 transition-colors',
                  activeTab === 'records'
                    ? 'bg-[#5c001f] text-white'
                    : 'bg-white text-[#5c001f] hover:bg-[#fff8df]',
                ]"
              >
                <ClipboardList class="w-5 h-5" />
                Project Records
              </button>
            </div>
          </div>

          <!-- Submitted Proposal Queue Tab -->
          <div v-if="activeTab === 'queue'" class="p-7">
            <div class="flex items-center justify-between gap-4 mb-6">
              <div>
                <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
                  Coordinator Review
                </p>
                <h2 class="text-[28px] font-bold">Submitted Proposal Queue</h2>
                <p class="text-gray-600 mt-2 max-w-3xl">
                  Proposals are uploaded by students from the Student Document Submission Center.
                  Coordinator reviews each proposal, runs AI matching, and assigns the most suitable
                  supervisor.
                </p>
              </div>

              <button
                @click="loadSubmittedProposalQueue"
                class="bg-yellow-50 text-[#5c001f] px-5 py-2.5 rounded-lg font-bold hover:bg-[#f8be17] transition-colors border-none flex items-center gap-2"
              >
                <Sparkles class="w-4 h-4" />
                Refresh Queue
              </button>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-7">
              <div class="rounded-lg bg-gray-50 border border-gray-300 p-6">
                <p class="text-sm text-gray-500 font-bold">Submitted Proposals</p>
                <p class="text-[34px] font-bold text-[#5c001f] mt-1">12</p>
                <p class="text-xs text-gray-500 mt-1">Waiting in coordinator queue</p>
              </div>
              <div class="rounded-lg bg-gray-50 border border-gray-300 p-6">
                <p class="text-sm text-gray-500 font-bold">Pending AI Matching</p>
                <p class="text-[34px] font-bold text-[#5c001f] mt-1">8</p>
                <p class="text-xs text-gray-500 mt-1">Ready for supervisor recommendation</p>
              </div>
              <div class="rounded-lg bg-gray-50 border border-gray-300 p-6">
                <p class="text-sm text-gray-500 font-bold">Pending Supervisor Approval</p>
                <p class="text-[34px] font-bold text-[#5c001f] mt-1">3</p>
                <p class="text-xs text-gray-500 mt-1">Assigned but waiting response</p>
              </div>
            </div>

            <div class="overflow-x-auto rounded-lg border border-gray-300">
              <table class="w-full text-sm bg-white">
                <thead class="bg-[#5c001f] text-white">
                  <tr class="text-left">
                    <th class="px-5 py-4">Student</th>
                    <th class="px-5 py-4">Project Title</th>
                    <th class="px-5 py-4">Proposal Status</th>
                    <th class="px-5 py-4">Supervisor Email</th>
                    <th class="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoadingQueue">
                    <td colspan="5" class="px-5 py-8 text-center font-bold text-[#5c001f]">
                      Loading submitted proposals...
                    </td>
                  </tr>

                  <tr v-else-if="queueError">
                    <td colspan="5" class="px-5 py-8 text-center font-bold text-red-700">
                      {{ queueError }}
                    </td>
                  </tr>

                  <tr v-else-if="submittedProposals.length === 0">
                    <td colspan="5" class="px-5 py-8 text-center text-gray-600">
                      No student-submitted proposals found.
                    </td>
                  </tr>

                  <tr
                    v-for="project in submittedProposals"
                    v-else
                    :key="project.project_id"
                    class="border-t border-gray-300"
                    :class="
                      String(selectedQueueProjectId) === String(project.project_id)
                        ? 'bg-yellow-50'
                        : ''
                    "
                  >
                    <td class="px-5 py-4 font-bold">
                      {{ project.studentName }}
                      <br />
                      <span class="text-xs text-gray-500 font-medium">{{ project.matricNo }}</span>
                    </td>

                    <td class="px-5 py-4 font-bold max-w-[240px]">
                      {{ project.projectTitle }}
                    </td>

                    <td class="px-5 py-4">
                      <span
                        class="px-3 py-1 rounded-full font-bold text-xs uppercase"
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
                        @click="updateStatus(project.project_id, 'approved')"
                        class="bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-800 transition-all text-xs"
                      >
                        Approve
                      </button>
                      <button
                        v-if="
                          project.status?.toLowerCase() === 'submitted' ||
                          project.status?.toLowerCase() === 'pending'
                        "
                        @click="updateStatus(project.project_id, 'rejected')"
                        class="bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-800 transition-all text-xs"
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
                Student uploads proposal first. Coordinator only reviews submitted proposals, runs
                AI supervisor matching, assigns supervisor/examiner, and tracks status.
              </p>
            </div>
          </div>

          <!-- Matching Tab -->
          <div v-if="activeTab === 'matching'" class="p-7">
            <div class="grid grid-cols-1 2xl:grid-cols-3 gap-7">
              <div class="2xl:col-span-1">
                <div class="rounded-lg bg-[#5c001f] text-white p-7 shadow-lg">
                  <div class="w-16 h-16 rounded-lg bg-[#f8be17] flex items-center justify-center">
                    <BrainCircuit class="w-9 h-9 text-[#5c001f]" />
                  </div>

                  <h2 class="text-[28px] font-bold mt-5">AI Matching Summary</h2>
                  <p class="text-white/75 mt-3 text-sm leading-relaxed">
                    The system ranks supervisors by comparing project title, problem statement,
                    keywords, and lecturer expertise.
                  </p>

                  <div class="mt-6 space-y-4">
                    <div class="bg-white/10 rounded-lg p-4 border border-white/10">
                      <p class="text-xs text-[#f8be17] font-bold uppercase">Project Title</p>
                      <p class="font-semibold mt-1">
                        {{ proposalForm.projectTitle || 'No project title yet' }}
                      </p>
                    </div>

                    <div class="bg-white/10 rounded-lg p-4 border border-white/10">
                      <p class="text-xs text-[#f8be17] font-bold uppercase">Project Members</p>
                      <p class="font-semibold mt-1">{{ proposalForm.members.length }} member(s)</p>
                    </div>

                    <div class="bg-white/10 rounded-lg p-4 border border-white/10">
                      <p class="text-xs text-[#f8be17] font-bold uppercase">Matching Source</p>
                      <p class="font-semibold mt-1">
                        {{
                          matchSource === 'ollama'
                            ? 'Ollama Cloud'
                            : matchSource === 'fallback'
                              ? 'Fallback Similarity'
                              : 'Demo'
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="2xl:col-span-2">
                <div class="flex items-center justify-between mb-5">
                  <div>
                    <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
                      Recommendation
                    </p>
                    <div class="flex items-center justify-between gap-4">
                      <h2 class="text-[28px] font-bold">Suggested Supervisors</h2>

                      <button
                        v-if="recommendedSupervisors.length > 0"
                        @click="runAIMatch"
                        class="bg-yellow-50 text-[#5c001f] px-5 py-2.5 rounded-lg font-bold hover:bg-[#f8be17] transition-colors inline-flex items-center gap-2"
                      >
                        <BrainCircuit class="w-4 h-4" />
                        Run Again
                      </button>
                    </div>
                  </div>

                  <button
                    @click="setActiveTab('queue')"
                    class="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Back to Proposal Queue
                  </button>
                </div>

                <div v-if="isMatching" class="rounded-lg border border-gray-300 p-8 text-center">
                  <Loader2 class="w-10 h-10 animate-spin text-[#5c001f] mx-auto" />
                  <h3 class="font-bold text-xl mt-4">Running AI Supervisor Matching...</h3>
                  <p class="text-gray-600 mt-2">
                    Please wait while the system analyzes the project and lecturer expertise.
                  </p>
                </div>

                <div v-else-if="matchError" class="rounded-lg bg-red-50 border border-red-200 p-6">
                  <div class="flex gap-3">
                    <AlertTriangle class="w-6 h-6 text-red-600 shrink-0" />
                    <div>
                      <h3 class="font-bold text-red-700">AI Matching Failed</h3>
                      <p class="text-sm text-red-600 mt-1">{{ matchError }}</p>
                    </div>
                  </div>
                </div>

                <div v-else class="space-y-5">
                  <div
                    v-if="recommendedSupervisors.length === 0"
                    class="rounded-lg border border-gray-300 bg-gray-50 p-8 text-center"
                  >
                    <BrainCircuit class="w-12 h-12 mx-auto text-[#5c001f]" />
                    <h3 class="text-xl font-bold mt-4">No AI matching result yet</h3>
                    <p class="text-gray-600 mt-2">
                      Open a submitted proposal from the queue, then click Run AI Matching to
                      generate supervisor recommendations.
                    </p>

                    <button
                      @click="runAIMatch"
                      class="mt-6 bg-[#5c001f] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4a0019] transition-colors inline-flex items-center gap-2"
                    >
                      <BrainCircuit class="w-5 h-5" />
                      Run AI Matching
                    </button>
                  </div>

                  <div
                    v-for="supervisor in recommendedSupervisors"
                    :key="supervisor.rank"
                    class="rounded-lg border border-gray-300 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                      <div class="flex gap-4">
                        <div
                          class="w-14 h-14 rounded-lg bg-[#5c001f] text-[#f8be17] flex items-center justify-center text-xl font-bold"
                        >
                          {{ supervisor.rank }}
                        </div>

                        <div>
                          <div class="flex items-center gap-3 flex-wrap">
                            <h3 class="text-xl font-bold">{{ supervisor.name }}</h3>
                            <span
                              class="px-3 py-1 rounded-full bg-yellow-50 text-[#5c001f] text-xs font-bold"
                            >
                              {{ supervisor.status }}
                            </span>
                          </div>

                          <p class="text-sm text-gray-600 mt-1">
                            {{ supervisor.expertise }}
                          </p>

                          <p class="text-sm text-gray-700 mt-3 leading-relaxed">
                            {{ supervisor.reason }}
                          </p>
                        </div>
                      </div>

                      <div class="xl:text-right shrink-0">
                        <div class="text-[34px] font-bold text-[#5c001f]">
                          {{ supervisor.score }}%
                        </div>
                        <p class="text-xs text-gray-500 font-bold uppercase">Match Score</p>

                        <div class="mt-4 flex flex-col gap-2">
                          <button
                            @click="viewSupervisorProfile(supervisor)"
                            class="bg-yellow-50 text-[#5c001f] px-5 py-2.5 rounded-lg font-bold hover:bg-[#f8be17] transition-colors border-none flex items-center justify-center gap-2"
                          >
                            <Eye class="w-4 h-4" />
                            View Profile
                          </button>

                          <button
                            @click="openAssignConfirmation(supervisor)"
                            class="bg-[#5c001f] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#4a0019] transition-colors border-none"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-6 rounded-lg bg-yellow-50 border border-yellow-400 p-5">
                  <div class="flex gap-3">
                    <AlertTriangle class="w-6 h-6 text-[#5c001f] shrink-0" />
                    <p class="text-sm text-[#5c001f]">
                      Supervisor matching is performed at project level, so it supports both
                      individual and group FYP proposals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lecturer Profile Tab -->
          <div v-if="activeTab === 'profile' && selectedSupervisor" class="p-7">
            <div class="grid grid-cols-1 2xl:grid-cols-3 gap-7">
              <div class="2xl:col-span-2 rounded-lg border border-gray-300 p-7 bg-white">
                <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                  <div class="flex gap-5">
                    <div
                      class="w-20 h-20 rounded-lg bg-[#5c001f] text-[#f8be17] flex items-center justify-center text-2xl font-bold shadow-md"
                    >
                      {{ selectedSupervisor.name.charAt(0) }}
                    </div>

                    <div>
                      <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
                        Lecturer Profile
                      </p>
                      <h2 class="text-[30px] font-bold mt-1">{{ selectedSupervisor.name }}</h2>
                      <p class="text-gray-600 mt-1">
                        {{ selectedSupervisor.title }} · {{ selectedSupervisor.faculty }}
                      </p>

                      <div class="mt-4 flex flex-wrap gap-2">
                        <span
                          class="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1"
                        >
                          <BadgeCheck class="w-4 h-4" />
                          {{ selectedSupervisor.workload }}
                        </span>

                        <span
                          class="px-3 py-1 rounded-full bg-yellow-50 text-[#5c001f] text-xs font-bold"
                        >
                          {{ selectedSupervisor.score }}% Expertise Match
                        </span>

                        <span
                          class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold"
                        >
                          Supervisor Candidate
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    @click="openAssignConfirmation(selectedSupervisor)"
                    class="bg-[#5c001f] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4a0019] transition-colors border-none flex items-center gap-2"
                  >
                    <UserCheck class="w-5 h-5 text-[#f8be17]" />
                    Assign Supervisor
                  </button>
                </div>

                <div class="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-5">
                  <div class="rounded-lg bg-gray-50 border border-gray-300 p-5">
                    <Mail class="w-6 h-6 text-[#5c001f]" />
                    <p class="text-xs font-bold text-gray-500 uppercase mt-3">Email</p>
                    <p class="font-bold mt-1">{{ selectedSupervisor.email }}</p>
                  </div>

                  <div class="rounded-lg bg-gray-50 border border-gray-300 p-5">
                    <Phone class="w-6 h-6 text-[#5c001f]" />
                    <p class="text-xs font-bold text-gray-500 uppercase mt-3">Phone</p>
                    <p class="font-bold mt-1">{{ selectedSupervisor.phone }}</p>
                  </div>

                  <div class="rounded-lg bg-gray-50 border border-gray-300 p-5">
                    <Building2 class="w-6 h-6 text-[#5c001f]" />
                    <p class="text-xs font-bold text-gray-500 uppercase mt-3">Department</p>
                    <p class="font-bold mt-1">{{ selectedSupervisor.department }}</p>
                  </div>
                </div>

                <div class="mt-8">
                  <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
                    Area of Expertise
                  </p>

                  <div class="mt-4 flex flex-wrap gap-3">
                    <span
                      v-for="skill in selectedSupervisor.expertise.split(',')"
                      :key="skill"
                      class="px-4 py-2 rounded-full bg-yellow-50 text-[#5c001f] text-sm font-bold border border-yellow-400"
                    >
                      {{ skill.trim() }}
                    </span>
                  </div>
                </div>

                <div class="mt-8">
                  <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
                    AI Matching Explanation
                  </p>

                  <div class="mt-4 rounded-lg bg-gray-50 border border-gray-300 p-5">
                    <p class="text-gray-700 leading-relaxed">
                      {{ selectedSupervisor.reason }}
                    </p>
                  </div>
                </div>

                <div class="mt-8">
                  <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
                    Recent Supervised Projects
                  </p>

                  <div class="mt-4 space-y-3">
                    <div
                      v-for="project in selectedSupervisor.recentProjects"
                      :key="project"
                      class="rounded-lg border border-gray-300 bg-white p-4 flex items-center gap-3"
                    >
                      <BookOpen class="w-5 h-5 text-[#5c001f] shrink-0" />
                      <p class="text-sm font-semibold text-gray-700">{{ project }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-lg bg-[#5c001f] text-white p-7 shadow-lg">
                <div class="w-16 h-16 rounded-lg bg-[#f8be17] flex items-center justify-center">
                  <BookOpen class="w-8 h-8 text-[#5c001f]" />
                </div>

                <h2 class="text-[26px] font-bold mt-5">Profile Summary</h2>
                <p class="text-white/75 mt-3 text-sm leading-relaxed">
                  This page allows the coordinator to inspect the recommended lecturer before
                  confirming assignment.
                </p>

                <div class="mt-6 space-y-4">
                  <div class="bg-white/10 rounded-lg p-4 border border-white/10">
                    <p class="text-xs text-[#f8be17] font-bold uppercase">Recommendation Rank</p>
                    <p class="font-semibold mt-1">Rank {{ selectedSupervisor.rank }}</p>
                  </div>

                  <div class="bg-white/10 rounded-lg p-4 border border-white/10">
                    <p class="text-xs text-[#f8be17] font-bold uppercase">Similarity Score</p>
                    <p class="font-semibold mt-1">{{ selectedSupervisor.score }}%</p>
                  </div>

                  <div class="bg-white/10 rounded-lg p-4 border border-white/10">
                    <p class="text-xs text-[#f8be17] font-bold uppercase">Workload Status</p>
                    <p class="font-semibold mt-1">{{ selectedSupervisor.workload }}</p>
                  </div>
                </div>

                <button
                  @click="setActiveTab('matching')"
                  class="mt-6 w-full bg-white/10 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/20 transition-colors border border-white/20 flex items-center justify-center gap-2"
                >
                  Back to Recommendations
                </button>
              </div>
            </div>
          </div>

          <!-- Assignment Success Screen -->
          <div v-if="activeTab === 'success'" class="p-7">
            <div
              class="rounded-lg bg-white border border-gray-300 p-10 min-h-[420px] flex items-center justify-center text-center"
            >
              <div class="max-w-2xl">
                <div
                  class="w-24 h-24 rounded-full bg-green-100 mx-auto flex items-center justify-center border border-green-200"
                >
                  <Check class="w-12 h-12 text-green-700" />
                </div>

                <h2 class="text-[32px] font-bold mt-6 text-[#5c001f]">
                  Supervisor Assigned Successfully!
                </h2>

                <p class="text-gray-600 mt-3 leading-relaxed">
                  The assignment has been saved into Aiven MySQL. Notification records have also
                  been created for the supervisor and project members.
                </p>

                <div
                  v-if="lastAssignment"
                  class="mt-7 rounded-lg bg-gray-50 border border-gray-300 p-6 text-left"
                >
                  <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
                    Assignment Summary
                  </p>

                  <div class="mt-4 space-y-3 text-sm">
                    <p>
                      <span class="font-bold">Project:</span>
                      {{ lastAssignment.projectTitle }}
                    </p>
                    <p>
                      <span class="font-bold">Supervisor:</span>
                      {{ lastAssignment.supervisorName }}
                    </p>
                    <p>
                      <span class="font-bold">Match Score:</span>
                      {{ lastAssignment.matchScore }}%
                    </p>
                    <p>
                      <span class="font-bold">Status:</span>
                      {{ lastAssignment.status }}
                    </p>
                    <p>
                      <span class="font-bold">Members:</span>
                      {{ lastAssignment.members?.length || 0 }}
                    </p>
                  </div>
                </div>

                <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    @click="setActiveTab('records')"
                    class="bg-[#5c001f] text-white px-7 py-3 rounded-lg font-bold hover:bg-[#4a0019] transition-colors border-none"
                  >
                    View Updated Project List
                  </button>

                  <button
                    @click="setActiveTab('queue')"
                    class="bg-gray-200 text-gray-800 px-7 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors border-none"
                  >
                    Back to Proposal Queue
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Records Tab -->
          <div v-if="activeTab === 'records'" class="p-7">
            <div class="flex items-center justify-between gap-4 mb-6">
              <div>
                <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
                  Project Database
                </p>
                <h2 class="text-[28px] font-bold">FYP Project Records</h2>
              </div>

              <div class="flex gap-3 items-center">
                <button
                  @click="loadProjectRecords"
                  class="bg-[#5c001f] text-white px-5 py-3 rounded-lg font-bold hover:bg-[#4a0019] transition-colors border-none"
                >
                  Refresh
                </button>

                <div class="relative">
                  <Search class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search project..."
                    class="rounded-full border border-[#d8c9bd] pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f8be17]"
                  />
                </div>
              </div>
            </div>

            <div v-if="isLoadingRecords" class="rounded-lg border border-gray-300 p-8 text-center">
              <Loader2 class="w-10 h-10 animate-spin text-[#5c001f] mx-auto" />
              <p class="font-bold mt-4">Loading project records...</p>
            </div>

            <div v-else-if="recordsError" class="rounded-lg bg-red-50 border border-red-200 p-6">
              <div class="flex gap-3">
                <AlertTriangle class="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <h3 class="font-bold text-red-700">Failed to Load Records</h3>
                  <p class="text-sm text-red-600 mt-1">{{ recordsError }}</p>
                </div>
              </div>
            </div>

            <div
              v-else-if="projectRecords.length === 0"
              class="rounded-lg border border-gray-300 p-8 text-center"
            >
              <ClipboardList class="w-12 h-12 text-[#5c001f] mx-auto" />
              <h3 class="font-bold text-xl mt-4">No Assigned Projects Yet</h3>
              <p class="text-gray-600 mt-2">
                Assigned projects will appear here after the coordinator confirms a supervisor.
              </p>
            </div>

            <div v-else class="overflow-hidden rounded-lg border border-gray-200">
              <table class="w-full text-left">
                <thead class="bg-[#5c001f] text-white">
                  <tr>
                    <th class="px-5 py-4 text-sm font-bold">No.</th>
                    <th class="px-5 py-4 text-sm font-bold">Members</th>
                    <th class="px-5 py-4 text-sm font-bold">Project Title</th>
                    <th class="px-5 py-4 text-sm font-bold">Supervisor</th>
                    <th class="px-5 py-4 text-sm font-bold">Score</th>
                    <th class="px-5 py-4 text-sm font-bold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="project in projectRecords"
                    :key="project.project_id"
                    class="border-b border-gray-100 bg-white hover:bg-[#fff8df] transition-colors"
                  >
                    <td class="px-5 py-4 font-semibold">
                      {{ project.project_id }}
                    </td>

                    <td class="px-5 py-4">
                      <p class="font-bold">{{ project.memberCount }} member(s)</p>
                      <p
                        v-for="member in project.members.slice(0, 2)"
                        :key="member.member_id"
                        class="text-xs text-gray-500 mt-1"
                      >
                        {{ member.name }} ({{ member.matricNo }})
                      </p>
                      <p v-if="project.members.length > 2" class="text-xs text-gray-500 mt-1">
                        +{{ project.members.length - 2 }} more
                      </p>
                    </td>

                    <td class="px-5 py-4 text-gray-700 max-w-[360px]">
                      {{ project.projectTitle }}
                    </td>

                    <td class="px-5 py-4 text-gray-700">
                      <p class="font-bold">{{ project.supervisor.name }}</p>
                      <p class="text-xs text-gray-500">{{ project.supervisor.email }}</p>
                    </td>

                    <td class="px-5 py-4">
                      <span class="font-bold text-[#5c001f]">{{ project.matchScore }}%</span>
                    </td>

                    <td class="px-5 py-4">
                      <span
                        class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"
                      >
                        {{ project.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- Assign Confirmation Modal -->
    <div
      v-if="showAssignModal"
      class="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-6"
    >
      <div
        class="bg-white rounded-lg shadow-2xl max-w-3xl w-full border border-gray-300 overflow-hidden"
      >
        <div class="bg-[#5c001f] text-white p-6 flex items-center justify-between">
          <div>
            <p class="text-[#f8be17] font-bold text-sm uppercase tracking-[0.18em]">
              Assign Supervisor
            </p>
            <h2 class="text-[28px] font-bold mt-1">Confirm Assignment</h2>
          </div>

          <button
            @click="closeAssignConfirmation"
            class="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <div class="p-7 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div class="rounded-lg bg-gray-50 border border-gray-300 p-5">
            <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
              Student & Project
            </p>

            <div class="mt-4 space-y-3 text-sm">
              <p>
                <span class="font-bold">Project Title:</span>
                {{ proposalForm.projectTitle }}
              </p>

              <p>
                <span class="font-bold">Project Type:</span>
                {{ proposalForm.projectType }}
              </p>

              <p>
                <span class="font-bold">Members:</span>
                {{ proposalForm.members.length }} member(s)
              </p>

              <div class="pt-2">
                <p
                  v-for="member in proposalForm.members"
                  :key="member.matricNo"
                  class="text-xs text-gray-600 mt-1"
                >
                  {{ member.name }} ({{ member.matricNo }})
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-yellow-50 border border-yellow-400 p-5">
            <p class="text-sm font-bold text-[#5c001f] uppercase tracking-[0.18em]">
              Selected Supervisor
            </p>

            <div v-if="pendingSupervisor" class="mt-4">
              <h3 class="text-xl font-bold text-[#5c001f]">{{ pendingSupervisor.name }}</h3>
              <p class="text-sm text-gray-700 mt-1">{{ pendingSupervisor.title }}</p>
              <p class="text-sm text-gray-700 mt-3">
                {{ pendingSupervisor.expertise }}
              </p>

              <div class="mt-5 bg-white rounded-lg p-4 border border-gray-300">
                <p class="text-xs font-bold text-gray-500 uppercase">Expertise Match</p>
                <p class="text-[32px] font-bold text-[#5c001f]">{{ pendingSupervisor.score }}%</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="assignError" class="mx-7 mb-5 rounded-lg bg-red-50 border border-red-200 p-4">
          <div class="flex gap-3">
            <AlertTriangle class="w-5 h-5 text-red-700 shrink-0" />
            <p class="text-sm text-red-700">{{ assignError }}</p>
          </div>
        </div>

        <div class="p-7 pt-0 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            @click="closeAssignConfirmation"
            :disabled="isAssigning"
            class="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors border-none disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            @click="confirmAssignment"
            :disabled="isAssigning"
            class="bg-[#5c001f] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4a0019] transition-colors border-none flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Loader2 v-if="isAssigning" class="w-5 h-5 text-[#f8be17] animate-spin" />
            <UserCheck v-else class="w-5 h-5 text-[#f8be17]" />
            {{ isAssigning ? 'Assigning...' : 'Confirm Assignment' }}
          </button>
        </div>
      </div>
    </div>

    <AppFooter class="mt-auto -mb-[30px]" />
  </div>
</template>
