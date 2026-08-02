<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import SystemCalendarGrid from '@/components/calendar_components/SystemCalendarGrid.vue'
import axios from 'axios'
import {
  Calendar as CalendarIcon,
  Copy,
  Upload,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  ArrowRight,
  PlusCircle,
} from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` })

const api = {
  get: (url) => axios.get(`${API_BASE_URL}/api${url}`, { headers: getAuthHeader() }),
  post: (url, data, config = {}) =>
    axios.post(`${API_BASE_URL}/api${url}`, data, { headers: { ...getAuthHeader(), ...(config.headers || {}) } }),
  delete: (url) => axios.delete(`${API_BASE_URL}/api${url}`, { headers: getAuthHeader() }),
}

const router = useRouter()
const { user } = useAuth()

const isStudent = computed(() => {
  const role = String(user.value?.role || '').toLowerCase()
  return role === 'student' || Number(user.value?.is_student) === 1
})

const loading = ref(true)
const saving = ref(false)
const uploadingAi = ref(false)
const error = ref('')
const successMessage = ref('')

const activeSession = ref(null)
const userScheduleData = ref(null)
const sectionTemplates = ref([])
const selectedTemplateId = ref('')

// scheduleGrid map: { 'Monday_09:00': { type, label, code, start_time, end_time } }
const scheduleGrid = ref({})

const isConfigured = computed(() => {
  if (Object.keys(scheduleGrid.value).length > 0) return true
  if (userScheduleData.value && userScheduleData.value.schedule) {
    const s = userScheduleData.value.schedule
    if (Array.isArray(s)) return s.length > 0
    if (typeof s === 'object') return Object.keys(s).length > 0
  }
  return false
})

// Helper to parse any schedule JSON format (flat array, nested slots, etc.) to grid map
const parseScheduleToGrid = (scheduleData, defaultCode = '') => {
  const grid = {}
  const DAY_MAP = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' }

  let rawList = []
  if (Array.isArray(scheduleData)) {
    rawList = scheduleData
  } else if (scheduleData && typeof scheduleData === 'object') {
    rawList = scheduleData.weekly_recurring_occupancy || scheduleData.weekly_recurring || scheduleData.schedule || []
  }

  rawList.forEach((entry) => {
    if (entry.slots && Array.isArray(entry.slots)) {
      const day = entry.day_name || entry.day || DAY_MAP[entry.day_of_week] || 'Monday'
      entry.slots.forEach((s) => {
        const time = s.start_time || s.time || '09:00'
        const key = `${day}_${time}`
        grid[key] = {
          type: s.type || 'class',
          label: s.label || s.subject || s.title || 'Official Class',
          code: s.code || defaultCode,
          start_time: time,
          end_time: s.end_time || `${parseInt(time.split(':')[0], 10) + 1}:00`,
          color: s.color,
        }
      })
    } else if (entry.day || entry.day_name || entry.time || entry.start_time || entry.day_of_week) {
      const day = entry.day || entry.day_name || DAY_MAP[entry.day_of_week] || 'Monday'
      const time = entry.time || entry.start_time || '09:00'
      const key = `${day}_${time}`
      grid[key] = {
        type: entry.type || 'class',
        label: entry.label || entry.subject || entry.title || 'Official Class',
        code: entry.code || defaultCode,
        start_time: time,
        end_time: entry.end_time || `${parseInt(time.split(':')[0], 10) + 1}:00`,
        color: entry.color,
      }
    }
  })

  return grid
}

// Load timetable data from backend
const loadScheduleData = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/timetables/my-schedule')
    if (res.data.success) {
      activeSession.value = res.data.activeSession
      sectionTemplates.value = res.data.sectionTemplates || []
      userScheduleData.value = res.data.userSchedule

      if (res.data.userSchedule && res.data.userSchedule.schedule) {
        scheduleGrid.value = parseScheduleToGrid(res.data.userSchedule.schedule)
      }
    }
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    loading.value = false
  }
}

// Method 1: Copy section template into student's personal schedule
const copySectionTemplate = () => {
  if (!selectedTemplateId.value) return
  const tmpl = sectionTemplates.value.find(
    (t) => String(t.time_table_id || t.class_id) === String(selectedTemplateId.value)
  )
  if (!tmpl) return

  const grid = parseScheduleToGrid(tmpl.schedule, tmpl.section_name)
  scheduleGrid.value = grid
  successMessage.value = `Successfully loaded section template for "${tmpl.section_name}" into your FYP schedule grid! Click 'Save Schedule' below to save it.`
}

// Method 2: AI image upload fallback
const imageInputRef = ref(null)
const triggerImageUpload = () => imageInputRef.value?.click()

const handleImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  uploadingAi.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const formData = new FormData()
    formData.append('image', file)

    const res = await api.post('/assistant/analyze-timetable', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    if (res.data.success && res.data.data) {
      const extractedGrid = {}
      const recurring = res.data.data.weekly_recurring || []

      const DAY_MAP = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' }

      recurring.forEach((d) => {
        const dayName = d.day_name || DAY_MAP[d.day_of_week] || 'Monday'
        if (Array.isArray(d.slots)) {
          d.slots.forEach((s) => {
            const time = s.start_time || '09:00'
            const key = `${dayName}_${time}`
            extractedGrid[key] = {
              type: s.type || 'class',
              label: s.label || s.subject || 'Class',
              code: s.code || '',
              start_time: time,
              end_time: s.end_time || `${parseInt(time.split(':')[0]) + 1}:00`,
            }
          })
        }
      })

      scheduleGrid.value = extractedGrid
      successMessage.value = 'AI successfully extracted your timetable image into your schedule grid!'
    } else {
      error.value = res.data.error || 'Failed to analyze timetable image.'
    }
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    uploadingAi.value = false
    event.target.value = ''
  }
}

// Convert scheduleGrid map into weeklyRecurring array for SystemCalendarGrid
const weeklyRecurringFromGrid = computed(() => {
  const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 }
  const list = []

  Object.keys(scheduleGrid.value).forEach((key) => {
    const [day, time] = key.split('_')
    const dayId = dayMap[day]
    const slot = scheduleGrid.value[key]
    if (dayId && slot && time) {
      const startHour = parseInt(time.split(':')[0], 10)
      const endHour = slot.end_time ? parseInt(slot.end_time.split(':')[0], 10) : startHour + 1
      list.push({
        key,
        slot_id: `grid_${key}`,
        day_of_week: dayId,
        day_name: day,
        start_time: slot.start_time || time,
        end_time: slot.end_time || `${String(endHour).padStart(2, '0')}:00`,
        label: slot.label,
        type: slot.type,
        code: slot.code,
        color: slot.color,
      })
    }
  })
  return list
})

const handleSlotSaveFromGrid = (slotData) => {
  const day = slotData.dayName || slotData.day_name || 'Monday'
  const startTime = slotData.start_time || slotData.startTime || '10:00'
  const endTime = slotData.end_time || slotData.endTime || '11:00'
  const key = `${day}_${startTime}`

  // If slot was moved/edited, remove old key if it differs
  if (slotData.oldKey && slotData.oldKey !== key && scheduleGrid.value[slotData.oldKey]) {
    delete scheduleGrid.value[slotData.oldKey]
  }

  scheduleGrid.value[key] = {
    type: slotData.type || 'available',
    start_time: startTime,
    end_time: endTime,
    label: slotData.label || `${startTime} - ${endTime}`,
    code: slotData.code || '',
    color: slotData.color,
  }
}

const handleSystemGridSlotRemove = (slotInfo) => {
  const targetKey = slotInfo.data?.key || slotInfo.key || slotInfo.oldKey
  if (targetKey && scheduleGrid.value[targetKey]) {
    delete scheduleGrid.value[targetKey]
    return
  }

  const day = slotInfo.data?.day_name || slotInfo.day_name || slotInfo.dayName
  const time = slotInfo.data?.start_time || slotInfo.start_time || slotInfo.startTime
  if (day && time) {
    const key = `${day}_${time}`
    delete scheduleGrid.value[key]
  }
}

const confirmModal = ref({
  show: false,
  title: '',
  message: '',
  type: 'confirm', // 'confirm', 'success', 'danger'
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  actionHandler: null,
})

const openConfirmModal = ({ title, message, type = 'confirm', confirmText = 'Confirm', actionHandler = null }) => {
  confirmModal.value = {
    show: true,
    title,
    message,
    type,
    confirmText,
    cancelText: 'Cancel',
    actionHandler,
  }
}

const handleConfirmModalAction = async () => {
  const handler = confirmModal.value.actionHandler
  confirmModal.value.show = false
  if (handler) {
    await handler()
  }
}

const clearSchedule = () => {
  openConfirmModal({
    title: 'Reset Schedule Grid',
    message: 'Are you sure you want to reset and clear your current schedule grid? All un-saved slot changes will be cleared.',
    type: 'danger',
    confirmText: 'Reset Grid',
    actionHandler: () => {
      scheduleGrid.value = {}
      successMessage.value = 'Schedule grid has been reset successfully.'
      openConfirmModal({
        title: 'Grid Reset Complete',
        message: 'Schedule grid has been reset successfully.',
        type: 'success',
        confirmText: 'OK',
      })
    },
  })
}

const saveScheduleToBackend = () => {
  openConfirmModal({
    title: 'Save Timetable Schedule',
    message: 'Are you sure you want to save your current personal timetable schedule to your account?',
    type: 'confirm',
    confirmText: 'Save Schedule',
    actionHandler: async () => {
      saving.value = true
      error.value = ''
      successMessage.value = ''

      try {
        const list = []
        Object.keys(scheduleGrid.value).forEach((key) => {
          const [day, time] = key.split('_')
          const slot = scheduleGrid.value[key]
          list.push({
            day,
            day_name: day,
            time,
            start_time: slot.start_time || time,
            end_time: slot.end_time || `${parseInt(time.split(':')[0], 10) + 1}:00`,
            type: slot.type || 'class',
            label: slot.label || 'Official Class',
            code: slot.code || '',
            color: slot.color,
          })
        })

        const res = await api.post('/timetables/my-schedule', {
          schedule_json: list,
          fyp_session_id: activeSession.value?.fyp_session_id || 1,
        })

        if (res.data.success) {
          const msg = 'Your personal FYP timetable schedule has been saved successfully!'
          successMessage.value = msg
          openConfirmModal({
            title: 'Schedule Saved Successfully',
            message: msg,
            type: 'success',
            confirmText: 'Great!',
          })
          await loadScheduleData()
        } else {
          error.value = res.data.error || 'Failed to save schedule.'
        }
      } catch (err) {
        error.value = err.response?.data?.error || err.message
      } finally {
        saving.value = false
      }
    },
  })
}

const deleteScheduleFromBackend = () => {
  openConfirmModal({
    title: 'Delete Personal Timetable',
    message: 'Are you sure you want to completely delete your personal timetable? This action cannot be undone.',
    type: 'danger',
    confirmText: 'Delete Timetable',
    actionHandler: async () => {
      saving.value = true
      error.value = ''
      successMessage.value = ''
      try {
        const res = await api.delete('/timetables/my-schedule')
        if (res.data.success) {
          scheduleGrid.value = {}
          userScheduleData.value = null
          const msg = 'Your personal timetable has been deleted successfully.'
          successMessage.value = msg
          openConfirmModal({
            title: 'Timetable Deleted',
            message: msg,
            type: 'success',
            confirmText: 'OK',
          })
        } else {
          error.value = res.data.error || 'Failed to delete timetable.'
        }
      } catch (err) {
        error.value = err.response?.data?.error || err.message
      } finally {
        saving.value = false
      }
    },
  })
}

const goToAddTimeTable = () => {
  router.push('/add-time-table')
}

onMounted(loadScheduleData)
</script>

<template>
  <div class="min-h-screen bg-[#e7ded3] text-[#241616]">
    <AppHeader />
    <div class="flex flex-col md:flex-row flex-1 w-full min-w-0">
      <AppSidebar />
      <main class="flex-1 p-4 sm:p-6 lg:p-9 space-y-6 min-w-0 overflow-x-hidden">
        <!-- Header Banner -->
        <section class="rounded-[30px] bg-[#5c001f] text-white p-8 shadow-xl relative overflow-hidden">
          <div class="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-[#f8be17]/20" />
          <div class="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-[#f8be17] font-bold uppercase tracking-[0.2em]">Personal Schedule Management</p>
              <h1 class="text-3xl lg:text-4xl font-bold mt-2 flex items-center gap-3">
                <CalendarIcon class="w-8 h-8 text-[#f8be17]" /> My Personal Timetable
              </h1>
              <p class="text-white/75 mt-2 max-w-2xl">
                Set and customize your weekly schedule availability. Clone section templates, upload an image, or set free times.
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
          <div
            v-if="error"
            class="rounded-[20px] bg-red-50 border border-red-200 p-4 text-red-800 font-bold flex items-center gap-3"
          >
            <AlertCircle class="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{{ error }}</span>
          </div>

          <div
            v-if="successMessage"
            class="rounded-[20px] bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 font-bold flex items-center gap-3"
          >
            <CheckCircle2 class="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{{ successMessage }}</span>
          </div>

          <!-- UNASSIGNED EMPTY STATE BANNER -->
          <template v-if="!isConfigured">
            <!-- Non-Student Role (Lecturer / Coordinator / Staff / Admin) -->
            <section
              v-if="!isStudent"
              class="rounded-[26px] bg-white border border-[#d8c9bd] p-8 shadow-md text-center space-y-4"
            >
              <div class="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Info class="w-8 h-8" />
              </div>
              <div class="max-w-md mx-auto space-y-2">
                <h2 class="text-2xl font-bold text-gray-900">No Timetable Found for Your Account</h2>
                <p class="text-sm text-gray-600">
                  You currently do not have a personal timetable schedule set up in the system. Would you like to create one or manage timetables?
                </p>
              </div>
              <div class="pt-2">
                <button
                  @click="goToAddTimeTable"
                  class="rounded-xl bg-[#5c001f] hover:bg-[#4a0019] text-[#f8be17] font-bold px-6 py-3 shadow inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <PlusCircle class="w-5 h-5" />
                  Create New Timetable in Add Time Table
                  <ArrowRight class="w-4 h-4 ml-1" />
                </button>
              </div>
            </section>

            <!-- Student Role -->
            <section
              v-else
              class="rounded-[24px] bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300 p-6 space-y-4"
            >
              <div class="flex items-start gap-4">
                <div class="rounded-full bg-amber-500 text-white p-3 shadow shrink-0">
                  <Info class="w-6 h-6" />
                </div>
                <div>
                  <h2 class="text-xl font-bold text-amber-900">Your FYP Timetable Schedule is Unassigned</h2>
                  <p class="text-sm text-amber-800 mt-1">
                    Find your class section timetable below to create a copy, or upload an image to set up your personal FYP timetable.
                  </p>
                </div>
              </div>
            </section>
          </template>

          <!-- Setup & Customization Tools -->
          <section class="bg-white rounded-[26px] p-6 shadow border border-black/5 space-y-4">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-[#5c001f]" /> Setup & Timetable Customization Tools
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <!-- Method A: Copy Coordinator Section Template -->
              <div class="rounded-[20px] bg-[#f7f1ea] border border-[#e1d5cc] p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div class="flex items-center gap-2 font-bold text-[#5c001f]">
                    <Copy class="w-5 h-5" /> Option 1: Copy Master Class Section Template
                  </div>
                  <p class="text-xs text-gray-600 mt-1">
                    Find your section timetable published by the coordinator and clone it into your personal FYP schedule.
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <select
                    v-model="selectedTemplateId"
                    class="flex-1 rounded-xl border border-gray-300 p-2.5 text-sm font-medium focus:border-[#5c001f] focus:outline-none"
                  >
                    <option value="">-- Select Section Timetable --</option>
                    <option
                      v-for="t in sectionTemplates"
                      :key="t.time_table_id || t.class_id"
                      :value="t.time_table_id || t.class_id"
                    >
                      {{ t.section_name }}
                    </option>
                  </select>
                  <button
                    @click="copySectionTemplate"
                    :disabled="!selectedTemplateId"
                    class="rounded-xl bg-[#5c001f] px-4 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
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
                    Upload an image of your timetable (PNG, JPG, JPEG, WebP). Docling & AI OCR will extract and auto-populate your weekly grid!
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
                    class="w-full rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Loader2 v-if="uploadingAi" class="w-4 h-4 animate-spin" />
                    <Upload v-else class="w-4 h-4" />
                    {{ uploadingAi ? 'Analyzing Timetable Image with AI...' : 'Upload Timetable Image (.PNG, .JPG)' }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Interactive Timetable Grid Section -->
          <section class="bg-white rounded-[26px] p-6 shadow border border-black/5 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-100">
              <div>
                <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CalendarIcon class="w-5 h-5 text-[#5c001f]" /> Personal Schedule Grid
                </h2>
                <p class="text-xs text-gray-500 mt-1">
                  Click any cell or "+ Set Free / Custom Time" to add free time slots or custom subjects, then click Save Schedule.
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  @click="clearSchedule"
                  class="rounded-xl border border-gray-300 px-3.5 py-2 font-bold text-gray-700 hover:bg-gray-50 text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw class="w-4 h-4" /> Reset Grid
                </button>
                <button
                  @click="deleteScheduleFromBackend"
                  :disabled="saving"
                  class="rounded-xl bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 font-bold text-xs sm:text-sm shadow inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertCircle class="w-4 h-4" /> Delete Timetable
                </button>
                <button
                  @click="saveScheduleToBackend"
                  :disabled="saving"
                  class="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 font-bold text-xs sm:text-sm shadow disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
                  <Save v-else class="w-4 h-4" />
                  Save Schedule
                </button>
              </div>
            </div>

            <!-- Unified System Calendar Component -->
            <SystemCalendarGrid
              :weeklyRecurring="weeklyRecurringFromGrid"
              :specificEvents="[]"
              :interactive="true"
              :readOnly="false"
              initialView="week"
              @slot-save="handleSlotSaveFromGrid"
              @slot-remove="handleSystemGridSlotRemove"
            />
          </section>
        </template>
      </main>
    </div>

    <!-- ACTION CONFIRMATION & ALERT MODAL (MOBILE INTERACTIVE & RESPONSIVE) -->
    <div
      v-if="confirmModal.show"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 text-gray-900 space-y-4 font-['Inter'] transition-all transform scale-100"
      >
        <button
          @click="confirmModal.show = false"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer p-1"
        >
          ✕
        </button>

        <div class="flex items-center gap-3">
          <div
            class="p-3 rounded-2xl shrink-0"
            :class="[
              confirmModal.type === 'danger' ? 'bg-red-100 text-red-700' : '',
              confirmModal.type === 'success' ? 'bg-emerald-100 text-emerald-700' : '',
              confirmModal.type === 'confirm' ? 'bg-[#5c001f] text-[#f8be17]' : '',
            ]"
          >
            <AlertCircle v-if="confirmModal.type === 'danger'" class="w-7 h-7" />
            <CheckCircle2 v-else-if="confirmModal.type === 'success'" class="w-7 h-7" />
            <Info v-else class="w-7 h-7" />
          </div>

          <div>
            <h3 class="text-xl font-bold text-gray-900">{{ confirmModal.title }}</h3>
            <p class="text-xs text-gray-500 mt-0.5">Please confirm your action below.</p>
          </div>
        </div>

        <p class="text-sm font-semibold text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
          {{ confirmModal.message }}
        </p>

        <div class="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            v-if="confirmModal.type !== 'success'"
            @click="confirmModal.show = false"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-50 transition-all cursor-pointer text-center"
          >
            {{ confirmModal.cancelText }}
          </button>
          <button
            @click="handleConfirmModalAction"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs shadow transition-all cursor-pointer text-center"
            :class="[
              confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : '',
              confirmModal.type === 'success' ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : '',
              confirmModal.type === 'confirm' ? 'bg-[#5c001f] hover:bg-[#4a0019] text-[#f8be17]' : '',
            ]"
          >
            {{ confirmModal.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
