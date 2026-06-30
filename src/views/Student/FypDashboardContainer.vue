<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EmptyFypNoticePanel from './EmptyFypNoticePanel.vue'
import ProposalFormWizard from './ProposalFormWizard.vue'
import CreateFypProposalView from './CreateFypProposalView.vue'

const project = ref(null)
const milestones = ref([])
const loading = ref(true)
const showCreateForm = ref(false)
const router = useRouter()
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const fetchWorkflow = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${apiUrl}/api/projects/my-workflow`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (res.ok) {
      const data = await res.json()
      project.value = data.project
      milestones.value = data.milestones
    }
  } catch (error) {
    console.error('Failed to load workflow:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchWorkflow)

const handleCreateNew = () => {
  showCreateForm.value = true
}

const handleProjectCreated = () => {
  showCreateForm.value = false
  loading.value = true
  fetchWorkflow()
}
</script>

<template>
  <div class="max-w-7xl mx-auto p-4 md:p-8">
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-utm-maroon"></div>
    </div>
    
    <div v-else-if="!project && !showCreateForm">
      <EmptyFypNoticePanel @create-new="handleCreateNew" />
    </div>

    <div v-else-if="!project && showCreateForm">
      <CreateFypProposalView @created="handleProjectCreated" @cancel="showCreateForm = false" />
    </div>

    <div v-else>
      <ProposalFormWizard :project="project" :milestones="milestones" @refresh="fetchWorkflow" />
    </div>
  </div>
</template>
