<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  Calendar as CalendarIcon,
  Sparkles,
  Upload,
  Copy,
  Save,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Info,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { api } from '@/services/ifamousApi'
import { formatMalaysiaDateTime } from '@/utils/dateTime'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
]

const loading = ref(true)
const saving = ref(false)
const uploadingAi = ref(false)
const error = ref('')
const successMessage = ref('')

const activeSession = ref(null)
const userSchedule = ref(null)
const sectionTemplates = ref([])
const selectedTemplateId = ref('')

// Draft schedule grid stored as map: key `${day}_${time}` -> { type, label, code }
const scheduleGrid = ref({})

// Modal for editing a specific cell
const showCellModal = ref(false)
const selectedCell = ref({ day: '', time: '', type: 'available', label: '', code: '' })

// File upload reference for AI Image OCR
const imageInputRef = ref(null)

const isConfigured = computed(() => Object.keys(scheduleGrid.value).length > 0)

const loadScheduleData = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/timetables/my-schedule')
    activeSession.value = res.data.activeSession
    userSchedule.value = res.data.userSchedule
    sectionTemplates.value = res.data.sectionTemplates || []

    // Populate scheduleGrid if existing
    const existing = res.data.userSchedule?.schedule || []
    const newGrid = {}
    if (Array.isArray(existing)) {
      existing.forEach((item) => {
        if (item.day && item.time) {
          newGrid[`${item.day}_${item.time}`] = {
            type: item.type || 'class',
            label: item.label || item.subject || '',
            code: item.code || '',
          }
        }
      })
    }
    scheduleGrid.value = newGrid
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    loading.value = false
  }
}

// Copy selected Master Coordinator Section template
const copySectionTemplate = () => {
  if (!selectedTemplateId.value) return
  const tmpl = sectionTemplates.value.find(
    (t) => String(t.time_table_id) === String(selectedTemplateId.value),
  )
  if (!tmpl) return

  const newGrid = {}
  const rawList = tmpl.schedule || []
  rawList.forEach((item) => {
    const day = item.day || item.day_name
    const time = item.time || item.start_time
    if (day && time) {
      newGrid[`${day}_${time}`] = {
        type: 'class',
        label: item.label || item.subject || tmpl.section_name || 'Official Class',
        code: tmpl.course_code || '',
      }
    }
  })

  scheduleGrid.value = newGrid
  successMessage.value = `Copied schedule from ${tmpl.section_name} (${tmpl.course_code}). Customize replacement subjects or non-availability as needed.`
}

// AI Image Upload & Auto-Rearrange
const triggerImageUpload = () => {
  imageInputRef.value?.click()
}

const handleImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Validate image file format
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!validTypes.includes(file.type)) {
    error.value = 'Please select an image file (.png, .jpg, .jpeg, .webp). PDF files are not supported for AI image analysis.'
    return
  }

  uploadingAi.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const formData = new FormData()
    formData.append('image', file)

    const res = await api.post('/assistant/analyze-timetable', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const data = res.data
    if (data.error) throw new Error(data.error)

    // Parse weekly_recurring items into scheduleGrid
    const weekly = data.weekly_recurring || []
    const newGrid = {}

    weekly.forEach((item) => {
      const day = item.day_name || DAYS[item.day_of_week - 1]
      if (!DAYS.includes(day)) return

      (item.slots || []).forEach((slot) => {
        const startTime = slot.start_time?.substring(0, 5) || '08:00'
        newGrid[`${day}_${startTime}`] = {
          type: 'class',
          label: slot.label || 'Extracted Subject',
          code: '',
        }
      })
    })

    scheduleGrid.value = newGrid
    successMessage.value = 'AI successfully analyzed timetable image and auto-rearranged your weekly slots!'
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to analyze timetable image.'
  } finally {
    uploadingAi.value = false
    if (event.target) event.target.value = ''
  }
}

// Open slot cell editor
const openCellEditor = (day, time) => {
  const key = `${day}_${time}`
  const existing = scheduleGrid.value[key] || {}
  selectedCell.value = {
    day,
    time,
    type: existing.type || 'available',
    label: existing.label || '',
    code: existing.code || '',
  }
  showCellModal.value = true
}

// Save cell edit
const saveCellEdit = () => {
  const key = `${selectedCell.value.day}_${selectedCell.value.time}`
  if (selectedCell.value.type === 'available') {
    delete scheduleGrid.value[key]
  } else {
    scheduleGrid.value[key] = {
      type: selectedCell.value.type,
      label: selectedCell.value.label || (selectedCell.value.type === 'replacement' ? 'Replacement Subject' : selectedCell.value.type === 'unavailable' ? 'Not Available' : 'Official Class'),
      code: selectedCell.value.code || '',
    }
  }
  showCellModal.value = false
}

// Save entire schedule to SQL backend
const saveScheduleToBackend = async () => {
  saving.value = true
  error.value = ''
  successMessage.value = ''

  try {
    // Convert scheduleGrid map to array format
    const list = []
    Object.keys(scheduleGrid.value).forEach((key) => {
      const [day, time] = key.split('_')
      const slot = scheduleGrid.value[key]
      list.push({
        day,
        time,
        type: slot.type,
        label: slot.label,
        code: slot.code,
      })
    })

    await api.post('/timetables/my-schedule', {
      schedule_json: list,
      fyp_session_id: activeSession.value?.fyp_session_id || 1,
    })

    successMessage.value = 'Your personal FYP timetable schedule has been saved successfully!'
    await loadScheduleData()
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    saving.value = false
  }
}

// Reset schedule
const clearSchedule = () => {
  if (confirm('Are you sure you want to clear your current timetable draft?')) {
    scheduleGrid.value = {}
  }
}

onMounted(loadScheduleData)
</script>

<template>
  <div class="min-h-screen bg-[#e7ded3] text-[#241616]">
    <AppHeader />
    <div class="flex flex-col md:flex-row flex-1 w-full min-w-0">
      <AppSidebar />
      <main class="flex-1 p-4 sm:p-6 lg:p-9 space-y-6 min-w-0 overflow-x-hidden">
        <!-- Page Title Header -->
        <section class="rounded-[30px] bg-[#5c001f] text-white p-8 shadow-xl relative overflow-hidden">
          <div class="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-[#f8be17]/20" />
          <div class="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-[#f8be17] font-bold uppercase tracking-[0.2em]">Shared Timetable Management</p>
              <h1 class="text-3xl lg:text-4xl font-bold mt-2 flex items-center gap-3">
                <CalendarIcon class="w-8 h-8 text-[#f8be17]" /> My FYP & Personal Timetable
              </h1>
              <p class="text-white/75 mt-2 max-w-2xl">
                Set and customize your weekly schedule. Copy coordinator master timetables, upload an image for AI auto-rearrange, or add replacement subjects.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow"
                :class="isConfigured ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-gray-900'"
              >
                {{ isConfigured ? 'Schedule Configured' : 'Unassigned / Empty' }}
              </span>
            </div>
          </div>
        </section>

        <!-- Loading State -->
        <section v-if="loading" class="bg-white rounded-[26px] p-10 text-center shadow">
          <Loader2 class="w-9 h-9 mx-auto animate-spin text-[#5c001f]" />
          <p class="font-bold mt-3">Loading timetable data...</p>
        </section>

        <template v-else>
          <!-- Alerts -->
          <div v-if="error" class="rounded-[20px] bg-red-50 border border-red-200 p-4 text-red-800 font-bold flex items-center gap-3">
            <AlertCircle class="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{{ error }}</span>
          </div>

          <div v-if="successMessage" class="rounded-[20px] bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 font-bold flex items-center gap-3">
            <CheckCircle2 class="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{{ successMessage }}</span>
          </div>

          <!-- Unassigned Initial Banner -->
          <section v-if="!isConfigured" class="rounded-[24px] bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300 p-6">
            <div class="flex items-start gap-4">
              <div class="rounded-full bg-amber-500 text-white p-3 shadow">
                <Info class="w-6 h-6" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-amber-900">Your FYP timetable is currently unassigned</h2>
                <p class="text-sm text-amber-800 mt-1">
                  Each student can maintain a customized schedule based on replacement subjects or personal non-availability. Choose an option below to set up your schedule:
                </p>
              </div>
            </div>
          </section>

          <!-- Action & Setup Bar -->
          <section class="bg-white rounded-[26px] p-6 shadow border border-black/5 space-y-4">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-[#5c001f]" /> Setup & Timetable Customization Tools
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <!-- Method A: Copy Coordinator Section Template -->
              <div class="rounded-[20px] bg-[#f7f1ea] border border-[#e1d5cc] p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div class="flex items-center gap-2 font-bold text-[#5c001f]">
                    <Copy class="w-5 h-5" /> Option 1: Copy Master Section Template
                  </div>
                  <p class="text-xs text-gray-600 mt-1">
                    Select an official section timetable published by the coordinator and clone it into your FYP schedule.
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <select
                    v-model="selectedTemplateId"
                    class="flex-1 rounded-xl border border-gray-300 p-2.5 text-sm font-medium focus:border-[#5c001f] focus:outline-none"
                  >
                    <option value="">-- Select Section Timetable --</option>
                    <option v-for="t in sectionTemplates" :key="t.time_table_id" :value="t.time_table_id">
                      {{ t.section_name }} ({{ t.course_code }})
                    </option>
                  </select>
                  <button
                    @click="copySectionTemplate"
                    :disabled="!selectedTemplateId"
                    class="rounded-xl bg-[#5c001f] px-4 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Copy class="w-4 h-4" /> Copy Template
                  </button>
                </div>
              </div>

              <!-- Method B: AI Timetable Image Upload & Auto-Rearrange -->
              <div class="rounded-[20px] bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div class="flex items-center gap-2 font-bold text-purple-900">
                    <Sparkles class="w-5 h-5 text-purple-600" /> Option 2: AI Timetable Image Auto-Rearrange
                  </div>
                  <p class="text-xs text-purple-800 mt-1">
                    Upload an image of your fixed timetable (PNG, JPG, JPEG, WebP). Docling & AI OCR will extract and auto-populate your weekly grid!
                  </p>
                </div>

                <div>
                  <input
                    ref="imageInputRef"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    class="hidden"
                    @change="handleImageUpload"
                  />
                  <button
                    @click="triggerImageUpload"
                    :disabled="uploadingAi"
                    class="w-full rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-all"
                  >
                    <Loader2 v-if="uploadingAi" class="w-4 h-4 animate-spin" />
                    <Upload v-else class="w-4 h-4" />
                    {{ uploadingAi ? 'Analyzing Timetable Image with AI...' : 'Upload Timetable Image (.PNG, .JPG)' }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Main Weekly Timetable Grid Editor -->
          <section class="bg-white rounded-[26px] p-6 shadow border border-black/5 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 class="text-xl font-bold flex items-center gap-2">
                  <Clock class="w-5 h-5 text-[#5c001f]" /> Weekly Schedule Grid
                </h2>
                <p class="text-xs text-gray-500 mt-1">
                  Click any cell to edit status (Official Class, Replacement Subject, Non-Available) or custom labels.
                </p>
              </div>

              <!-- Legend Badges & Actions -->
              <div class="flex flex-wrap items-center gap-3 text-xs font-bold">
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
                </span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Official Class
                </span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-800">
                  <span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Replacement Subject
                </span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100 text-rose-800">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Unavailable
                </span>

                <div class="flex gap-2 ml-auto">
                  <button
                    @click="clearSchedule"
                    class="rounded-xl border border-gray-300 px-3.5 py-2 font-bold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
                  >
                    <RotateCcw class="w-4 h-4" /> Reset
                  </button>
                  <button
                    @click="saveScheduleToBackend"
                    :disabled="saving"
                    class="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 font-bold shadow disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
                    <Save v-else class="w-4 h-4" />
                    Save Schedule
                  </button>
                </div>
              </div>
            </div>

            <!-- Timetable Table View -->
            <div class="overflow-x-auto rounded-2xl border border-gray-200 mt-4">
              <table class="w-full text-left text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr class="bg-[#f7f1ea] text-[#5c001f] border-b border-gray-200">
                    <th class="p-3 font-bold w-24 border-r border-gray-200">Time</th>
                    <th v-for="day in DAYS" :key="day" class="p-3 font-bold text-center border-r border-gray-200 last:border-r-0">
                      {{ day }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="time in TIME_SLOTS" :key="time" class="border-b border-gray-100 hover:bg-gray-50/50">
                    <!-- Time Column -->
                    <td class="p-3 font-mono font-bold text-xs text-gray-500 bg-gray-50/80 border-r border-gray-200">
                      {{ time }}
                    </td>

                    <!-- Day Grid Cells -->
                    <td
                      v-for="day in DAYS"
                      :key="day"
                      @click="openCellEditor(day, time)"
                      class="p-2 border-r border-gray-100 last:border-r-0 cursor-pointer transition-all hover:ring-2 hover:ring-[#5c001f]/30"
                    >
                      <div
                        v-if="scheduleGrid[`${day}_${time}`]"
                        class="p-2 rounded-xl text-xs font-bold shadow-sm flex flex-col justify-between h-14"
                        :class="{
                          'bg-blue-600 text-white': scheduleGrid[`${day}_${time}`].type === 'class',
                          'bg-purple-600 text-white': scheduleGrid[`${day}_${time}`].type === 'replacement',
                          'bg-rose-600 text-white': scheduleGrid[`${day}_${time}`].type === 'unavailable'
                        }"
                      >
                        <span class="truncate">{{ scheduleGrid[`${day}_${time}`].label }}</span>
                        <span v-if="scheduleGrid[`${day}_${time}`].code" class="text-[10px] opacity-80 uppercase font-mono">
                          {{ scheduleGrid[`${day}_${time}`].code }}
                        </span>
                      </div>

                      <div
                        v-else
                        class="p-2 rounded-xl text-xs text-gray-400 border border-dashed border-gray-200 h-14 flex items-center justify-center hover:bg-emerald-50/50 hover:text-emerald-700 hover:border-emerald-300"
                      >
                        + Available
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </main>
    </div>

    <!-- Interactive Cell Slot Editor Modal -->
    <div
      v-if="showCellModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-md rounded-[26px] bg-white p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-gray-900">
            Edit Slot: {{ selectedCell.day }} @ {{ selectedCell.time }}
          </h3>
          <button @click="showCellModal = false" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold uppercase text-gray-500 mb-1">Status Type</label>
            <select
              v-model="selectedCell.type"
              class="w-full rounded-xl border border-gray-300 p-3 text-sm font-bold focus:border-[#5c001f] focus:outline-none"
            >
              <option value="available">Available (Free Slot)</option>
              <option value="class">Official Class / Lecture</option>
              <option value="replacement">Replacement Subject</option>
              <option value="unavailable">Personal Non-Availability</option>
            </select>
          </div>

          <div v-if="selectedCell.type !== 'available'">
            <label class="block text-xs font-bold uppercase text-gray-500 mb-1">Subject Name / Label</label>
            <input
              v-model="selectedCell.label"
              type="text"
              placeholder="e.g. SECJ3403 Software Engineering"
              class="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#5c001f] focus:outline-none"
            />
          </div>

          <div v-if="selectedCell.type !== 'available'">
            <label class="block text-xs font-bold uppercase text-gray-500 mb-1">Course / Section Code (Optional)</label>
            <input
              v-model="selectedCell.code"
              type="text"
              placeholder="e.g. SECJ3403-01"
              class="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#5c001f] focus:outline-none"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            @click="showCellModal = false"
            class="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="saveCellEdit"
            class="rounded-xl bg-[#5c001f] hover:bg-[#4a0019] px-5 py-2 text-sm font-bold text-white shadow"
          >
            Save Slot
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
