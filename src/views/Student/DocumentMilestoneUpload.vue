<script setup>
import { ref } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  stepMeta: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const fileUploads = ref({})
const errorMsg = ref('')
const isSubmitting = ref(false)

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const handleFileUpload = (event, key) => {
  fileUploads.value[key] = event.target.files[0]
}

const submitMilestone = async () => {
  errorMsg.value = ''
  const requiredKeys = props.stepMeta.required_artifacts
  
  // Check if all required files are provided
  for (const key of requiredKeys) {
    if (!fileUploads.value[key]) {
      errorMsg.value = `Please provide the required file for: ${key}`
      return
    }
  }

  isSubmitting.value = true
  const token = localStorage.getItem('token')

  try {
    // Process each artifact submission
    for (const key of requiredKeys) {
      const payload = new FormData()
      payload.append('step_setting_id', props.stepMeta.step_setting_id)
      payload.append('artifact_key', key)
      payload.append('file', fileUploads.value[key])

      const res = await fetch(`${apiUrl}/api/projects/${props.project.project_id}/submissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload
      })

      if (!res.ok) {
        throw new Error(`Failed to upload ${key}`)
      }
    }
    
    // Advance the step once all required uploads are complete
    await fetch(`${apiUrl}/api/projects/${props.project.project_id}/advance-step`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })

    emit('refresh')
  } catch (error) {
    errorMsg.value = error.message || 'Network error occurred.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div class="bg-[#e7ded3] px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-bold text-[#5c001f]">{{ stepMeta.phase_title }} Submission</h2>
    </div>
    
    <div class="p-6">
      <div v-if="errorMsg" class="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="submitMilestone" class="space-y-6">
        <div v-for="key in stepMeta.required_artifacts" :key="key" class="space-y-2">
          <label class="block text-sm font-semibold text-gray-900 capitalize">{{ key.replace('_', ' ') }}</label>
          <div class="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group p-6 text-center">
            <input type="file" @change="e => handleFileUpload(e, key)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div class="flex flex-col items-center">
              <p class="text-sm text-gray-700 font-medium">{{ fileUploads[key] ? fileUploads[key].name : 'Click to upload PDF document' }}</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="px-8 py-2 bg-[#5c001f] text-white text-sm font-medium rounded-lg hover:bg-[#7a0029] transition-colors focus:ring-4 focus:ring-[#e7ded3] outline-none disabled:opacity-50"
          >
            {{ isSubmitting ? 'Uploading...' : 'Submit & Continue' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
