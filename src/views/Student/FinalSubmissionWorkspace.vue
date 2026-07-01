<script setup>
import { ref } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const githubUrl = ref('')
const cloudUrl = ref('')
const presentationFile = ref(null)
const reportFile = ref(null)

const errorMsg = ref('')
const isSubmitting = ref(false)

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const submitDeliverables = async () => {
  if (!githubUrl.value || !cloudUrl.value || !presentationFile.value || !reportFile.value) {
    errorMsg.value = 'Please provide all final deliverable artifacts.'
    return
  }

  errorMsg.value = ''
  isSubmitting.value = true

  const token = localStorage.getItem('token')
  const payload = new FormData()
  payload.append('github_url', githubUrl.value)
  payload.append('cloud_url', cloudUrl.value)
  payload.append('files', presentationFile.value)
  payload.append('files', reportFile.value)

  try {
    const res = await fetch(`${apiUrl}/api/projects/${props.project.project_id}/final-deliverables`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: payload
    })

    if (res.ok) {
      emit('refresh')
    } else {
      const data = await res.json()
      errorMsg.value = data.error || 'Failed to submit final deliverables.'
    }
  } catch (error) {
    errorMsg.value = 'Network error occurred.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div class="bg-[#5c001f] px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-bold text-white">Final Project Deliverables</h2>
    </div>
    
    <div class="p-6">
      <div v-if="errorMsg" class="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="submitDeliverables" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-900">GitHub Repository Link</label>
            <input 
              v-model="githubUrl" 
              type="url" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm"
              placeholder="https://github.com/..."
              required
            />
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-900">Cloud Storage Link (Drive/OneDrive)</label>
            <input 
              v-model="cloudUrl" 
              type="url" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm"
              placeholder="https://drive.google.com/..."
              required
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-900">Presentation Slides</label>
            <div class="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-6 text-center">
              <input type="file" @change="e => presentationFile = e.target.files[0]" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
              <p class="text-sm text-gray-700 font-medium">{{ presentationFile ? presentationFile.name : 'Upload Slides (.pptx)' }}</p>
            </div>
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-900">Consolidated Final Report</label>
            <div class="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-6 text-center">
              <input type="file" @change="e => reportFile = e.target.files[0]" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
              <p class="text-sm text-gray-700 font-medium">{{ reportFile ? reportFile.name : 'Upload Final Report (.pdf)' }}</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="px-8 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors focus:ring-4 focus:ring-green-100 outline-none disabled:opacity-50"
          >
            {{ isSubmitting ? 'Finalizing...' : 'Submit Final Deliverables' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
