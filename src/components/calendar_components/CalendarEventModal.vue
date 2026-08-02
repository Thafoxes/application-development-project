<script setup>
import { computed, ref, watch } from 'vue'
import { Clock, X, Calendar as CalendarIcon, Repeat, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
  availableTypes: {
    type: Array,
    default: () => [
      { value: 'available', label: 'Available (Free Time Slot)' },
      { value: 'class', label: 'Official Class / Lecture' },
      { value: 'replacement', label: 'Replacement Subject' },
      { value: 'unavailable', label: 'Personal Non-Availability / Busy' },
      { value: 'event', label: 'Event / Discussion Meeting' },
    ],
  },
})

const emit = defineEmits(['update:show', 'close', 'save', 'delete'])

const form = ref({
  dayName: 'Monday',
  dayOfWeek: 1,
  dateStr: new Date().toISOString().split('T')[0],
  startTime: '10:00',
  endTime: '11:00',
  type: 'available',
  label: '',
  code: '',
  color: '#10b981',
  isRecurring: true, // true = Weekly Recurring, false = One-Time Event / Reschedule
  oldKey: '',
  slotId: '',
  isEditing: false,
})

const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 7, name: 'Sunday' },
]

// Helper to convert time string (e.g. "10:00", "10am", "8am", "14:30") to minutes from midnight
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null
  const cleaned = timeStr.trim().toLowerCase()
  if (!cleaned) return null

  const isPm = cleaned.includes('pm')
  const isAm = cleaned.includes('am')
  const digitsOnly = cleaned.replace(/[^\d:]/g, '')

  if (!digitsOnly) return null

  let hours = 0
  let minutes = 0

  if (digitsOnly.includes(':')) {
    const parts = digitsOnly.split(':')
    hours = parseInt(parts[0], 10)
    minutes = parseInt(parts[1], 10)
  } else {
    hours = parseInt(digitsOnly, 10)
    minutes = 0
  }

  if (isPm && hours < 12) hours += 12
  if (isAm && hours === 12) hours = 0

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return hours * 60 + minutes
}

const TIME_OPTIONS_24H = computed(() => {
  const times = []
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0')
    times.push(`${hh}:00`)
    times.push(`${hh}:30`)
  }
  return times
})

// Dynamic validation for logical start & end times
const timeError = computed(() => {
  const startMins = parseTimeToMinutes(form.value.startTime)
  const endMins = parseTimeToMinutes(form.value.endTime)

  if (startMins === null) {
    return 'Invalid start time format (use 24-hour HH:mm, e.g. 10:00 or 14:30).'
  }
  if (endMins === null) {
    return 'Invalid end time format (use 24-hour HH:mm, e.g. 11:00 or 16:00).'
  }
  if (endMins <= startMins) {
    return `Illogical time range: End time (${form.value.endTime}) cannot be earlier than or equal to start time (${form.value.startTime}).`
  }
  return ''
})

watch(
  () => form.value.startTime,
  (newStart) => {
    const startMins = parseTimeToMinutes(newStart)
    if (startMins !== null) {
      const endMins = parseTimeToMinutes(form.value.endTime)
      if (endMins === null || endMins <= startMins) {
        const targetEndMins = Math.min(1439, startMins + 60)
        const h = Math.floor(targetEndMins / 60)
        const m = targetEndMins % 60
        form.value.endTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      }
    }
  }
)

watch(
  () => props.initialData,
  (val) => {
    if (val) {
      const todayStr = new Date().toISOString().split('T')[0]
      form.value = {
        dayName: val.dayName || val.day_name || val.day || 'Monday',
        dayOfWeek: val.dayOfWeek || val.day_of_week || 1,
        dateStr: val.dateStr || val.target_date || todayStr,
        startTime: val.startTime || val.start_time || val.time || '10:00',
        endTime: val.endTime || val.end_time || '11:00',
        type: val.type || 'available',
        label: val.label || val.title || '',
        code: val.code || '',
        color: val.color || (val.type === 'available' ? '#10b981' : '#5c001f'),
        isRecurring: val.isRecurring !== undefined ? val.isRecurring : true,
        oldKey: val.oldKey || val.key || '',
        slotId: val.slot_id || val.id || '',
        isEditing: !!val.isEditing,
      }
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => form.value.dateStr,
  (newDateStr) => {
    if (!newDateStr) return
    try {
      const parts = newDateStr.split('-')
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
        const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay()
        const dayName = DAYS_OF_WEEK.find((item) => item.id === dayOfWeek)?.name || 'Monday'
        form.value.dayOfWeek = dayOfWeek
        form.value.dayName = dayName
      }
    } catch (e) { }
  }
)

const formattedSelectedDate = computed(() => {
  if (!form.value.dateStr) return ''
  try {
    const parts = form.value.dateStr.split('-')
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch (e) {
    return form.value.dateStr
  }
})

function onDateInputChange() {
  if (!form.value.dateStr) return
  try {
    const parts = form.value.dateStr.split('-')
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay()
    const dayName = DAYS_OF_WEEK.find((item) => item.id === dayOfWeek)?.name || 'Monday'
    form.value.dayOfWeek = dayOfWeek
    form.value.dayName = dayName
  } catch (e) { }
}

function handleClose() {
  emit('update:show', false)
  emit('close')
}

function handleDelete() {
  if (confirm('Are you sure you want to delete this slot?')) {
    emit('delete', {
      id: form.value.slotId,
      slot_id: form.value.slotId,
      oldKey: form.value.oldKey,
      key: form.value.oldKey,
      day_name: form.value.dayName,
      start_time: form.value.startTime,
      data: {
        key: form.value.oldKey,
        day_name: form.value.dayName,
        start_time: form.value.startTime,
      }
    })
    handleClose()
  }
}

function handleSave() {
  if (timeError.value) return

  const defaultTitle =
    form.value.type === 'available'
      ? `Free Time (${form.value.startTime} - ${form.value.endTime})`
      : form.value.type === 'replacement'
        ? 'Replacement Subject'
        : form.value.type === 'unavailable'
          ? 'Personal Non-Availability'
          : 'Official Class'

  const slotData = {
    slot_id: form.value.slotId || `slot_${Date.now()}`,
    oldKey: form.value.oldKey,
    dayName: form.value.dayName,
    day_name: form.value.dayName,
    dayOfWeek: form.value.dayOfWeek,
    day_of_week: form.value.dayOfWeek,
    dateStr: form.value.dateStr,
    target_date: form.value.dateStr,
    startTime: form.value.startTime,
    start_time: form.value.startTime,
    endTime: form.value.endTime,
    end_time: form.value.endTime,
    type: form.value.type,
    label: form.value.label || defaultTitle,
    title: form.value.label || defaultTitle,
    code: form.value.code,
    color: form.value.color,
    isRecurring: form.value.isRecurring,
  }

  emit('save', slotData)
  handleClose()
}
</script>

<template>
  <div v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div
      class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 text-gray-900 space-y-4 font-['Inter']">
      <button @click="handleClose"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer">
        ✕
      </button>

      <!-- Header Title -->
      <div class="pr-8">
        <h3 class="text-xl font-bold text-[#5c001f]">
          {{ form.isEditing ? 'Edit Schedule Slot' : 'Add Time Slot / Free Time' }}
        </h3>
        <p class="text-xs text-gray-500">
          {{ form.isEditing ? 'Modify time, date, title or color for this slot.' : 'Set your availability or custom class timing.' }}
        </p>
      </div>

      <!-- Schedule Mode Switcher: Weekly Recurring vs. One-Time Reschedule -->
      <div class="flex gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
        <button type="button" @click="form.isRecurring = true"
          :class="form.isRecurring ? 'bg-[#5c001f] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/60'"
          class="flex-1 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
          <Repeat class="w-3.5 h-3.5" /> Weekly Recurring
        </button>
        <button type="button" @click="form.isRecurring = false"
          :class="!form.isRecurring ? 'bg-[#e85d04] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/60'"
          class="flex-1 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
          <CalendarIcon class="w-3.5 h-3.5" /> One-Time / Reschedule
        </button>
      </div>

      <!-- Title Input -->
      <div class="pt-1">
        <label class="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
          Slot Title / Subject Name
        </label>
        <input v-model="form.label" type="text" placeholder="Add title (e.g. Free for FYP / SECJ3403 Lecture)"
          class="w-full text-base font-bold border-b-2 border-gray-200 focus:border-[#5c001f] py-2 px-1 outline-none transition-colors text-gray-900" />
      </div>

      <!-- Date & Time Bar -->
      <div class="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Clock class="w-4 h-4 text-[#5c001f] shrink-0" />
          <span>Select Date:</span>
          <input v-model="form.dateStr" type="date" @change="onDateInputChange"
            class="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-[#5c001f] outline-none shadow-xs" />
        </div>

        <div class="text-xs font-semibold text-[#5c001f] pl-6 font-mono">
          {{ formattedSelectedDate }}
          <span v-if="form.isRecurring" class="text-gray-500 font-sans text-[11px] block">
            (Repeats every {{ form.dayName }})
          </span>
          <span v-else class="text-orange-600 font-sans text-[11px] block font-bold">
            (Applies only on {{ form.dateStr }})
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200/60 pl-6">
          <span class="text-xs font-bold text-gray-600">24-Hour Time Range:</span>
          <div class="flex items-center gap-1.5">
            <div class="relative">
              <input
                v-model="form.startTime"
                list="start-time-24h-options"
                type="text"
                placeholder="10:00"
                class="w-24 bg-white border rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 text-center outline-none shadow-xs font-mono"
                :class="timeError ? 'border-red-400 focus:border-red-500 text-red-700' : 'border-gray-300 focus:border-[#5c001f]'"
              />
              <datalist id="start-time-24h-options">
                <option v-for="t in TIME_OPTIONS_24H" :key="`start_${t}`" :value="t">{{ t }}</option>
              </datalist>
            </div>

            <span class="text-gray-400 font-bold">–</span>

            <div class="relative">
              <input
                v-model="form.endTime"
                list="end-time-24h-options"
                type="text"
                placeholder="11:00"
                class="w-24 bg-white border rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 text-center outline-none shadow-xs font-mono"
                :class="timeError ? 'border-red-400 focus:border-red-500 text-red-700' : 'border-gray-300 focus:border-[#5c001f]'"
              />
              <datalist id="end-time-24h-options">
                <option v-for="t in TIME_OPTIONS_24H" :key="`end_${t}`" :value="t">{{ t }}</option>
              </datalist>
            </div>
          </div>
        </div>

        <!-- Illogical Time Range Error Alert -->
        <div v-if="timeError" class="mt-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-red-600 shrink-0" />
          <span>{{ timeError }}</span>
        </div>
      </div>

      <div class="space-y-3">
        <!-- Status / Availability Dropdown -->
        <div>
          <label class="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
            Status / Availability Type
          </label>
          <select v-model="form.type"
            class="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:border-[#5c001f] outline-none">
            <option v-for="t in availableTypes" :key="t.value" :value="t.value">
              {{ t.label }}
            </option>
          </select>
        </div>

        <!-- Course / Section Code -->
        <div v-if="form.type !== 'available'">
          <label class="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
            Course / Section Code (Optional)
          </label>
          <input v-model="form.code" type="text" placeholder="e.g. SECJ3403-01"
            class="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:border-[#5c001f] outline-none" />
        </div>

        <!-- Color Badge Picker -->
        <div>
          <label class="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
            Badge Color
          </label>
          <div class="flex items-center gap-2">
            <button v-for="c in ['#10b981', '#5c001f', '#3b82f6', '#8b5cf6', '#f59e0b', '#dc2626']" :key="c"
              type="button" @click="form.color = c"
              class="w-7 h-7 rounded-full border-2 transition-transform cursor-pointer" :style="{ backgroundColor: c }"
              :class="form.color === c ? 'scale-125 border-black shadow-md' : 'border-transparent hover:scale-110'" />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-4 border-t border-gray-200">
        <button v-if="form.isEditing" type="button" @click="handleDelete"
          class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-xs text-white shadow transition-all cursor-pointer">
          Delete Slot
        </button>
        <div v-else />

        <div class="flex items-center gap-2">
          <button type="button" @click="handleClose"
            class="px-4 py-2 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-50 transition-all cursor-pointer">
            Cancel
          </button>
          <button type="button" @click="handleSave" :disabled="!!timeError"
            class="px-5 py-2 rounded-xl bg-[#5c001f] text-[#f8be17] hover:bg-[#4a0019] font-bold text-xs shadow transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            {{ form.isEditing ? 'Save Changes' : 'Save Slot' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
