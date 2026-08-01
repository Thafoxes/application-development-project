<script setup>
import { computed, ref, watch } from 'vue'
import { Clock, X, Calendar as CalendarIcon, Repeat } from 'lucide-vue-next'

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

const emit = defineEmits(['update:show', 'close', 'save'])

const form = ref({
  dayName: 'Monday',
  dayOfWeek: 1,
  dateStr: new Date().toISOString().split('T')[0],
  startTime: '10:10',
  endTime: '12:30',
  type: 'available',
  label: '',
  code: '',
  color: '#10b981',
  isRecurring: true, // true = Weekly Recurring, false = One-Time Event / Reschedule
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

watch(
  () => props.initialData,
  (val) => {
    if (val) {
      const todayStr = new Date().toISOString().split('T')[0]
      form.value = {
        dayName: val.dayName || val.day || 'Monday',
        dayOfWeek: val.dayOfWeek || val.day_of_week || 1,
        dateStr: val.dateStr || todayStr,
        startTime: val.startTime || val.start_time || val.time || '10:10',
        endTime: val.endTime || val.end_time || '12:30',
        type: val.type || 'available',
        label: val.label || '',
        code: val.code || '',
        color: val.color || (val.type === 'available' ? '#10b981' : '#5c001f'),
        isRecurring: val.isRecurring !== undefined ? val.isRecurring : true,
      }
    }
  },
  { immediate: true, deep: true },
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

function handleSave() {
  const defaultTitle =
    form.value.type === 'available'
      ? `Free Time (${form.value.startTime} - ${form.value.endTime})`
      : form.value.type === 'replacement'
        ? 'Replacement Subject'
        : form.value.type === 'unavailable'
          ? 'Personal Non-Availability'
          : 'Official Class'

  const slotData = {
    slot_id: `slot_${Date.now()}`,
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
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
  >
    <div
      class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 text-gray-900 space-y-4 font-['Inter']"
    >
      <button
        @click="handleClose"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer"
      >
        ✕
      </button>

      <!-- Schedule Mode Switcher: Weekly Recurring vs. One-Time Reschedule -->
      <div class="flex gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
        <button
          type="button"
          @click="form.isRecurring = true"
          :class="form.isRecurring ? 'bg-[#5c001f] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/60'"
          class="flex-1 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Repeat class="w-3.5 h-3.5" /> Weekly Recurring
        </button>
        <button
          type="button"
          @click="form.isRecurring = false"
          :class="!form.isRecurring ? 'bg-[#e85d04] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/60'"
          class="flex-1 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <CalendarIcon class="w-3.5 h-3.5" /> One-Time / Reschedule
        </button>
      </div>

      <!-- Title Input -->
      <div class="pt-1">
        <input
          v-model="form.label"
          type="text"
          placeholder="Add title (e.g. Free for FYP / SECJ3403 Lecture)"
          class="w-full text-lg font-bold border-b-2 border-gray-200 focus:border-[#5c001f] py-2 px-1 outline-none transition-colors text-gray-900"
        />
      </div>

      <!-- Date & Time Bar -->
      <div class="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Clock class="w-4 h-4 text-[#5c001f] shrink-0" />
          <span>Select Date:</span>
          <input
            v-model="form.dateStr"
            type="date"
            @change="onDateInputChange"
            class="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-[#5c001f] outline-none shadow-xs"
          />
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

        <div class="flex items-center gap-2 pt-1 border-t border-gray-200/60 pl-6">
          <input
            v-model="form.startTime"
            type="text"
            placeholder="10:10"
            class="w-20 bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 text-center focus:border-[#5c001f] outline-none shadow-xs"
          />
          <span class="text-gray-400 font-bold">–</span>
          <input
            v-model="form.endTime"
            type="text"
            placeholder="12:30"
            class="w-20 bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 text-center focus:border-[#5c001f] outline-none shadow-xs"
          />
        </div>
      </div>

      <div class="space-y-3">
        <!-- Status / Availability Dropdown -->
        <div>
          <label class="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
            Status / Availability Type
          </label>
          <select
            v-model="form.type"
            class="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:border-[#5c001f] outline-none"
          >
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
          <input
            v-model="form.code"
            type="text"
            placeholder="e.g. SECJ3403-01"
            class="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:border-[#5c001f] outline-none"
          />
        </div>

        <!-- Color Badge Picker -->
        <div>
          <label class="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
            Badge Color
          </label>
          <div class="flex items-center gap-2">
            <button
              v-for="c in ['#10b981', '#5c001f', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e']"
              :key="c"
              type="button"
              @click="form.color = c"
              class="w-7 h-7 rounded-full border-2 transition-transform cursor-pointer"
              :style="{ backgroundColor: c }"
              :class="form.color === c ? 'scale-125 border-black shadow-md' : 'border-transparent hover:scale-110'"
            />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          @click="handleClose"
          class="px-4 py-2 rounded-xl border border-gray-300 font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          @click="handleSave"
          class="px-6 py-2 rounded-xl bg-[#5c001f] text-[#f8be17] hover:bg-[#4a0019] font-bold text-sm shadow transition-all cursor-pointer"
        >
          Save Slot
        </button>
      </div>
    </div>
  </div>
</template>
