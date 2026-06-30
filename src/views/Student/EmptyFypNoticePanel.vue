<script setup>
import { ref } from 'vue'

const emit = defineEmits(['refresh'])

const showForm = ref(false)
const title = ref('')
const errorMsg = ref('')
const isSubmitting = ref(false)

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const createProject = async () => {
  errorMsg.value = ''
  if (!title.value.trim()) {
    errorMsg.value = 'Project title is required.'
    return
  }

  isSubmitting.value = true
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${apiUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: title.value.trim()
      })
    })

    if (res.ok) {
      title.value = ''
      showForm.value = false
      emit('refresh')
    } else {
      const data = await res.json()
      errorMsg.value = data.error || 'Failed to initialize project.'
    }
  } catch (error) {
    errorMsg.value = 'Network error occurred.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center max-w-xl mx-auto">
    <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    
    <div v-if="!showForm">
      <h3 class="text-xl font-bold text-gray-900 mb-2">No Active FYP Project Found</h3>
      <p class="text-gray-500 mb-8 max-w-md">You currently have no active project registered under your profile. Start by creating a new proposal for this session.</p>
      
      <button 
        @click="showForm = true"
        class="px-6 py-3 bg-[#5c001f] text-white font-medium rounded-lg hover:bg-[#7a0029] transition-colors focus:ring-4 focus:ring-[#e7ded3] outline-none"
      >
        Create New FYP Project
      </button>
    </div>

    <div v-else class="w-full max-w-md text-left">
      <h3 class="text-lg font-bold text-gray-900 mb-4 text-center">Initialize FYP Project</h3>
      
      <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-100">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="createProject" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Project Title</label>
          <input 
            v-model="title" 
            type="text" 
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm"
            placeholder="e.g. AI-Powered Academic Workflow System"
            required
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button 
            type="button" 
            @click="showForm = false"
            class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="px-6 py-2 bg-[#5c001f] text-white text-sm font-medium rounded-lg hover:bg-[#7a0029] transition-colors focus:ring-4 focus:ring-[#e7ded3] outline-none disabled:opacity-50"
          >
            {{ isSubmitting ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
