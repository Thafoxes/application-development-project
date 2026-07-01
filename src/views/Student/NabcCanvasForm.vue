<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const formData = ref({
  need: '',
  approach: '',
  benefits: '',
  competition: ''
})

const useCaseFile = ref(null)
const errorMsg = ref('')
const isSubmitting = ref(false)

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

onMounted(() => {
  if (props.project.nabc_canvas_json) {
    let parsed = {}
    try {
      parsed = typeof props.project.nabc_canvas_json === 'string' ? JSON.parse(props.project.nabc_canvas_json) : props.project.nabc_canvas_json
    } catch (e) {
      console.error(e)
    }
    formData.value.need = parsed.need || ''
    formData.value.approach = parsed.approach || ''
    formData.value.benefits = parsed.benefits || ''
    formData.value.competition = parsed.competition || ''
  }
})

const handleFileUpload = (event) => {
  useCaseFile.value = event.target.files[0]
}

const submitNabc = async () => {
  errorMsg.value = ''
  isSubmitting.value = true

  const token = localStorage.getItem('token')
  const payload = new FormData()
  payload.append('need', formData.value.need)
  payload.append('approach', formData.value.approach)
  payload.append('benefits', formData.value.benefits)
  payload.append('competition', formData.value.competition)
  
  if (useCaseFile.value) {
    payload.append('use_case_image', useCaseFile.value)
  }

  try {
    const res = await fetch(`${apiUrl}/api/projects/${props.project.project_id}/nabc`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: payload
    })

    if (res.ok) {
      emit('refresh')
    } else {
      const data = await res.json()
      errorMsg.value = data.error || 'Failed to update NABC.'
    }
  } catch (error) {
    errorMsg.value = 'Network error occurred.'
  } finally {
    isSubmitting.value = false
  }
}
const isLocked = computed(() => {
  return props.project?.status === 'Accepted' || props.project?.status === 'Approved'
})
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-black">
    <div class="bg-[#e7ded3] px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-bold text-[#5c001f]">NABC Canvas Validation</h2>
    </div>
    
    <div class="p-6">
      <div v-if="errorMsg" class="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="submitNabc" class="space-y-6">
        <!-- Locked Document Alert -->
        <div v-if="isLocked" class="mb-6 p-4 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200 flex items-start gap-3">
          <span class="text-base leading-none">🔒</span>
          <div>
            <span class="font-bold">Locked Document:</span> This NABC canvas and proposal framework has been formally accepted. modifications are locked.
          </div>
        </div>

        <fieldset :disabled="isLocked" class="space-y-6 border-none p-0 m-0">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Need -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-1">Need</label>
            <p class="text-xs text-gray-500 mb-2">What is the problem or gap?</p>
            <textarea v-model="formData.need" rows="4" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm resize-none"></textarea>
          </div>
          
          <!-- Approach -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-1">Approach</label>
            <p class="text-xs text-gray-500 mb-2">How will you solve the need?</p>
            <textarea v-model="formData.approach" rows="4" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm resize-none"></textarea>
          </div>
          
          <!-- Benefits -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-1">Benefits</label>
            <p class="text-xs text-gray-500 mb-2">What are the key quantifiable benefits?</p>
            <textarea v-model="formData.benefits" rows="4" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm resize-none"></textarea>
          </div>
          
          <!-- Competition -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-1">Competition / Alternatives</label>
            <p class="text-xs text-gray-500 mb-2">What are the current alternatives?</p>
            <textarea v-model="formData.competition" rows="4" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] outline-none text-sm resize-none"></textarea>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-900 mb-1">Use Case Diagram</label>
          <p class="text-xs text-gray-500 mb-2">Upload your high-level use case architecture image.</p>
          <div class="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group p-8 text-center">
            <input type="file" @change="handleFileUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
            <div class="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400 group-hover:text-[#5c001f] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-sm text-gray-700 font-medium">{{ useCaseFile ? useCaseFile.name : 'Click to browse or drag and drop' }}</p>
            </div>
          </div>
        </div>

        </fieldset>

        <div v-if="!isLocked" class="flex justify-end pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="px-8 py-2 bg-[#5c001f] text-white text-sm font-medium rounded-lg hover:bg-[#7a0029] transition-colors focus:ring-4 focus:ring-[#e7ded3] outline-none disabled:opacity-50"
          >
            {{ isSubmitting ? 'Saving...' : 'Save & Proceed' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
