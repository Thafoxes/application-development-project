<script setup>
import { ref } from 'vue'
import { Download, FileText, Loader2, MessageSquareText, UploadCloud } from 'lucide-vue-next'
import { api } from '@/services/ifamousApi'
import { formatMalaysiaDateTime } from '@/utils/dateTime'

const props = defineProps({
  projectId: {
    type: Number,
    required: true,
  },
  feedbackList: {
    type: Array,
    default: () => [],
  },
  roleLabel: {
    type: String,
    default: 'Supervisor',
  },
})

const emit = defineEmits(['updated'])

const comment = ref('')
const selectedFile = ref(null)
const uploading = ref(false)
const message = ref('')
const error = ref('')

function handleFileSelect(e) {
  selectedFile.value = e.target.files[0] || null
}

async function uploadFeedback() {
  if (!comment.value.trim() && !selectedFile.value) {
    error.value = 'Please provide feedback comments or attach a corrected document file.'
    return
  }

  uploading.value = true
  message.value = ''
  error.value = ''

  try {
    const formData = new FormData()
    formData.append('comment', comment.value.trim())
    if (selectedFile.value) {
      formData.append('attachment', selectedFile.value)
    }

    await api.post(`/projects/${props.projectId}/feedback`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    message.value = 'Feedback and corrected attachment uploaded successfully!'
    comment.value = ''
    selectedFile.value = null
    emit('updated')
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    uploading.value = false
  }
}

function getFeedbackDownloadUrl(feedbackId) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
  return `${api.defaults.baseURL || 'http://localhost:3000/api'}/projects/${props.projectId}/feedback/${feedbackId}/file?download=1&token=${encodeURIComponent(token)}`
}
</script>

<template>
  <section class="bg-white rounded-[26px] p-6 shadow border border-slate-200/90 space-y-5">
    <div class="flex items-center justify-between border-b border-gray-100 pb-3">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <MessageSquareText class="w-6 h-6 text-[#5c001f]" /> {{ roleLabel }} Feedback & Corrections
        </h2>
        <p class="text-xs text-slate-500 font-medium mt-0.5">
          Upload annotated FYP files with required fixes or corrections for the student.
        </p>
      </div>
    </div>

    <!-- Alert Messages -->
    <div v-if="message" class="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl font-bold text-xs">
      {{ message }}
    </div>
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl font-bold text-xs">
      {{ error }}
    </div>

    <!-- Feedback Upload Form -->
    <div class="bg-[#f7f1ea] border border-[#e1d5cc] rounded-2xl p-5 space-y-4">
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-[#5c001f] mb-1.5">
          Feedback Notes / Revision Instructions
        </label>
        <textarea
          v-model="comment"
          rows="3"
          class="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15"
          placeholder="Specify improvements, requested fixes, or guidance notes..."
        />
      </div>

      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-[#5c001f] mb-1.5">
          Attach Annotated / Corrected PDF or PPTX Document (Optional)
        </label>
        <input
          type="file"
          accept=".pdf,.pptx,.ppt"
          @change="handleFileSelect"
          class="w-full text-xs text-slate-600 font-medium file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#5c001f] file:text-white hover:file:bg-[#430016] cursor-pointer"
        />
        <p class="text-[11px] text-slate-500 mt-1" v-if="selectedFile">
          Selected corrected file: <strong>{{ selectedFile.name }}</strong> ({{ Math.round(selectedFile.size / 1024) }} KB)
        </p>
      </div>

      <button
        @click="uploadFeedback"
        :disabled="uploading"
        class="inline-flex items-center gap-2 rounded-xl bg-[#5c001f] hover:bg-[#430016] text-white px-5 py-2.5 font-bold shadow text-xs transition-all cursor-pointer disabled:opacity-50"
      >
        <Loader2 v-if="uploading" class="w-4 h-4 animate-spin" />
        <UploadCloud v-else class="w-4 h-4" />
        Submit Feedback & Attachment
      </button>
    </div>

    <!-- Feedback Attachments History -->
    <div class="space-y-3 pt-2">
      <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Historical Feedback & Attachments</h3>

      <div v-if="feedbackList.length" class="space-y-3">
        <div
          v-for="item in feedbackList"
          :key="item.feedback_id"
          class="p-4 rounded-xl border-2 border-slate-200 bg-slate-50/50 space-y-2"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f7f1ea] text-[#5c001f]">
              {{ item.author_role || 'Staff Feedback' }}
            </span>
            <span class="text-xs text-slate-500 font-medium">
              {{ formatMalaysiaDateTime(item.created_at) }}
            </span>
          </div>

          <p class="text-sm text-slate-800 font-medium whitespace-pre-line" v-if="item.comment">
            {{ item.comment }}
          </p>

          <div v-if="item.attachment_path" class="pt-1 flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5">
            <div class="flex items-center gap-2">
              <FileText class="w-4 h-4 text-[#5c001f]" />
              <span class="text-xs font-bold text-slate-900 truncate max-w-xs">
                {{ item.attachment_name || 'Corrected Attachment' }}
              </span>
            </div>
            <a
              :href="getFeedbackDownloadUrl(item.feedback_id)"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 text-xs font-bold text-[#5c001f] hover:underline"
            >
              <Download class="w-3.5 h-3.5" /> Download
            </a>
          </div>
        </div>
      </div>
      <div v-else class="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500 font-medium border border-slate-200">
        No feedback files uploaded yet.
      </div>
    </div>
  </section>
</template>
