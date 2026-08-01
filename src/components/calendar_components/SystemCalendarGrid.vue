<script setup>
import { computed, ref, watch } from 'vue'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Info,
  Layers,
  Plus,
  Settings,
  Sparkles,
  X,
} from 'lucide-vue-next'

const props = defineProps({
  weeklyRecurring: {
    type: Array,
    default: () => [],
  },
  specificEvents: {
    type: Array,
    default: () => [],
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  interactive: {
    type: Boolean,
    default: true,
  },
  initialView: {
    type: String,
    default: 'week', // 'week' or 'month'
  },
  hideControls: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'slot-click',
  'cell-click',
  'slot-remove',
  'settings-change',
])

// Settings state: Working Hours & Afternoon Break Time
const showSettingsModal = ref(false)
const workingStartHour = ref(8) // 08:00
const workingEndHour = ref(18) // 18:00
const enableBreakTime = ref(true)
const breakStartHour = ref(13) // 13:00
const breakEndHour = ref(14) // 14:00
const breakLabel = ref('Afternoon / Prayer Break')

// Current navigation date
const currentDate = ref(new Date())
const viewMode = ref(props.initialView)

const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
  { id: 7, name: 'Sunday', short: 'Sun' },
]

// Generate hourly time slots based on configurable working hours
const timeSlots = computed(() => {
  const slots = []
  const start = Math.max(0, Math.min(23, workingStartHour.value))
  const end = Math.max(start + 1, Math.min(24, workingEndHour.value))

  for (let hour = start; hour < end; hour++) {
    const startStr = `${String(hour).padStart(2, '0')}:00`
    const endStr = `${String(hour + 1).padStart(2, '0')}:00`
    const isBreak =
      enableBreakTime.value &&
      hour >= breakStartHour.value &&
      hour < breakEndHour.value

    slots.push({
      hour,
      timeStr: startStr,
      endStr,
      label: `${startStr} - ${endStr}`,
      isBreak,
    })
  }
  return slots
})

// Current week start (Monday)
const currentWeekStart = computed(() => {
  const d = new Date(currentDate.value)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(d.setDate(diff))
})

// Week dates list (Mon - Sun)
const weekDates = computed(() => {
  const dates = []
  const start = new Date(currentWeekStart.value)
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const dayOfWeek = i + 1
    dates.push({
      date,
      dayOfWeek,
      dateStr: date.toISOString().split('T')[0],
      dayName: DAYS_OF_WEEK[i].name,
      shortName: DAYS_OF_WEEK[i].short,
      dayNumber: date.getDate(),
      isToday: isSameDay(date, new Date()),
    })
  }
  return dates
})

// Google Calendar Style Full Month Grid Calculation (35 or 42 days grid)
const monthGridDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const firstDayIndex = firstDay.getDay()
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1

  const days = []

  // 1. Previous Month Padding Days
  for (let i = startOffset; i > 0; i--) {
    const prevDate = new Date(year, month, 1 - i)
    const dayOfWeek = prevDate.getDay() === 0 ? 7 : prevDate.getDay()
    days.push({
      date: prevDate,
      dateStr: prevDate.toISOString().split('T')[0],
      dayNumber: prevDate.getDate(),
      dayOfWeek,
      isCurrentMonth: false,
      isToday: isSameDay(prevDate, new Date()),
    })
  }

  // 2. Current Month Days
  const totalDays = lastDay.getDate()
  for (let d = 1; d <= totalDays; d++) {
    const currDate = new Date(year, month, d)
    const dayOfWeek = currDate.getDay() === 0 ? 7 : currDate.getDay()
    days.push({
      date: currDate,
      dateStr: currDate.toISOString().split('T')[0],
      dayNumber: d,
      dayOfWeek,
      isCurrentMonth: true,
      isToday: isSameDay(currDate, new Date()),
    })
  }

  // 3. Next Month Padding Days to complete 35 or 42 grid cells
  const totalGridCells = days.length > 35 ? 42 : 35
  const paddingNeeded = totalGridCells - days.length

  for (let p = 1; p <= paddingNeeded; p++) {
    const nextDate = new Date(year, month + 1, p)
    const dayOfWeek = nextDate.getDay() === 0 ? 7 : nextDate.getDay()
    days.push({
      date: nextDate,
      dateStr: nextDate.toISOString().split('T')[0],
      dayNumber: nextDate.getDate(),
      dayOfWeek,
      isCurrentMonth: false,
      isToday: isSameDay(nextDate, new Date()),
    })
  }

  return days
})

const currentHeaderTitle = computed(() => {
  if (viewMode.value === 'month') {
    return currentDate.value.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  } else {
    const start = weekDates.value[0]?.date
    const end = weekDates.value[6]?.date
    if (!start || !end) return ''
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
    const year = start.getFullYear()
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`
  }
})

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function prevPeriod() {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() - 1)
  } else {
    d.setDate(d.getDate() - 7)
  }
  currentDate.value = d
}

function nextPeriod() {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() + 1)
  } else {
    d.setDate(d.getDate() + 7)
  }
  currentDate.value = d
}

function goToToday() {
  currentDate.value = new Date()
}

// Normalize weekly recurring items
const normalizedWeekly = computed(() => {
  const map = {}
  DAYS_OF_WEEK.forEach((d) => {
    map[d.id] = []
  })

  const raw = props.weeklyRecurring || []
  if (Array.isArray(raw)) {
    raw.forEach((entry) => {
      const dayId = entry.day_of_week || entry.dayOfWeek
      if (dayId && map[dayId]) {
        const slots = entry.slots || [entry]
        slots.forEach((s) => {
          if (s.start_time || s.time) {
            map[dayId].push({
              ...s,
              type: s.type || 'class',
              label: s.label || s.title || s.subject || 'Weekly Slot',
              start_time: s.start_time || s.time,
              end_time: s.end_time || `${parseInt((s.start_time || s.time).split(':')[0]) + 1}:00`,
            })
          }
        })
      }
    })
  }
  return map
})

// Find matching slots for a specific day and hour in week view
function getSlotsForCell(dayOfWeek, hour, dateStr) {
  const results = []

  // 1. Weekly recurring slots
  const dayRecurring = normalizedWeekly.value[dayOfWeek] || []
  dayRecurring.forEach((slot) => {
    const slotStartHour = parseInt(slot.start_time.split(':')[0], 10)
    const slotEndHour = slot.end_time ? parseInt(slot.end_time.split(':')[0], 10) : slotStartHour + 1
    if (hour >= slotStartHour && hour < slotEndHour) {
      results.push({
        id: slot.slot_id || `${dayOfWeek}_${hour}_${slot.label}`,
        isRecurring: true,
        data: slot,
        title: slot.label,
        type: slot.type || 'class',
        color: slot.color || getSlotColor(slot.type),
      })
    }
  })

  // 2. Specific date events
  const daySpecific = (props.specificEvents || []).filter((e) => e.target_date === dateStr || e.date === dateStr)
  daySpecific.forEach((evt) => {
    const evtStartHour = parseInt((evt.start_time || '09:00').split(':')[0], 10)
    const evtEndHour = evt.end_time ? parseInt(evt.end_time.split(':')[0], 10) : evtStartHour + 1
    if (hour >= evtStartHour && hour < evtEndHour) {
      results.push({
        id: evt.event_id || `${dateStr}_${hour}_${evt.title}`,
        isRecurring: false,
        data: evt,
        title: evt.title || evt.label || 'Event',
        type: evt.type || 'event',
        color: evt.color || 'bg-purple-600 text-white',
      })
    }
  })

  return results
}

// Find items for a specific date cell in Google Calendar Month View
function getItemsForMonthDay(day) {
  const items = []

  // 1. Specific events for this date
  const daySpecific = (props.specificEvents || []).filter(
    (e) => e.target_date === day.dateStr || e.date === day.dateStr,
  )
  daySpecific.forEach((evt) => {
    items.push({
      id: evt.event_id || evt.id || `${day.dateStr}_${evt.title}`,
      title: evt.title || evt.label || evt.owner || 'Event',
      time: evt.start_time || '',
      color: evt.color || 'bg-purple-600 text-white',
    })
  })

  // 2. Weekly recurring slots if current month day
  if (day.isCurrentMonth) {
    const dayRecurring = normalizedWeekly.value[day.dayOfWeek] || []
    dayRecurring.forEach((slot) => {
      items.push({
        id: slot.slot_id || `${day.dateStr}_${slot.start_time}_${slot.label}`,
        title: slot.label || slot.subject || 'Class',
        time: slot.start_time || '',
        color: slot.color || getSlotColor(slot.type),
      })
    })
  }

  return items
}

function getItemStyle(item) {
  if (item.color && (item.color.startsWith('#') || item.color.startsWith('rgb'))) {
    return {
      backgroundColor: item.color,
      borderColor: item.color,
      color: '#ffffff',
    }
  }
  return {}
}

function getItemClass(item) {
  if (item.color && (item.color.startsWith('#') || item.color.startsWith('rgb'))) {
    return 'text-white border'
  }
  return item.color || 'bg-[#5c001f] text-white border-[#4a0019]'
}

function getSlotColor(type) {
  const lower = String(type || '').toLowerCase()
  if (lower.includes('replacement')) return 'bg-emerald-700 text-white border-emerald-800'
  if (lower.includes('unavailable') || lower.includes('busy')) return 'bg-red-700 text-white border-red-800'
  if (lower.includes('event') || lower.includes('meeting')) return 'bg-purple-700 text-white border-purple-800'
  return 'bg-[#5c001f] text-white border-[#4a0019]'
}

function onCellClick(day, timeSlot) {
  if (props.readOnly) return
  emit('cell-click', { day: day.dayName, dayOfWeek: day.dayOfWeek, dateStr: day.dateStr, time: timeSlot.timeStr })
}

function onSlotClick(slot, event) {
  event.stopPropagation()
  emit('slot-click', slot)
}

function removeSlot(slot, event) {
  event.stopPropagation()
  if (props.readOnly) return
  emit('slot-remove', slot)
}
</script>

<template>
  <div class="w-full bg-white rounded-3xl shadow-xl border border-black/10 overflow-hidden font-['Inter']">
    <!-- Header Control Bar -->
    <div class="bg-[#5c001f] text-white p-5 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-2xl bg-white/10 text-[#f8be17]">
          <CalendarIcon class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-xl font-bold tracking-tight">{{ currentHeaderTitle }}</h2>
          <p class="text-xs text-white/70">
            Working Hours: {{ String(workingStartHour).padStart(2, '0') }}:00 - {{ String(workingEndHour).padStart(2, '0') }}:00
            <span v-if="enableBreakTime"> | Break: {{ String(breakStartHour).padStart(2, '0') }}:00 - {{ String(breakEndHour).padStart(2, '0') }}:00</span>
          </p>
        </div>
      </div>

      <div v-if="!hideControls" class="flex flex-wrap items-center gap-2">
        <!-- View Mode Switcher -->
        <div class="bg-black/20 p-1 rounded-xl flex items-center gap-1 border border-white/10">
          <button
            @click="viewMode = 'week'"
            :class="viewMode === 'week' ? 'bg-white text-[#5c001f] shadow-sm' : 'text-white/80 hover:text-white'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Week View
          </button>
          <button
            @click="viewMode = 'month'"
            :class="viewMode === 'month' ? 'bg-white text-[#5c001f] shadow-sm' : 'text-white/80 hover:text-white'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Month View
          </button>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center bg-black/20 rounded-xl border border-white/10 p-0.5">
          <button @click="prevPeriod" class="p-2 hover:bg-white/10 rounded-lg text-white cursor-pointer" title="Previous">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button @click="goToToday" class="px-3 py-1.5 text-xs font-bold hover:bg-white/10 text-white cursor-pointer">
            Today
          </button>
          <button @click="nextPeriod" class="p-2 hover:bg-white/10 rounded-lg text-white cursor-pointer" title="Next">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Working Hours & Break Settings Button -->
        <button
          @click="showSettingsModal = true"
          class="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#f8be17] border border-white/10 transition-colors cursor-pointer"
          title="Configure Working Hours & Break Time"
        >
          <Settings class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- WEEK VIEW GRID -->
    <div v-if="viewMode === 'week'" class="overflow-x-auto w-full">
      <table class="w-full border-collapse min-w-[800px]">
        <thead>
          <tr class="bg-[#f7f1ea] border-b border-[#e1d5cc]">
            <th class="p-3 text-center text-xs uppercase tracking-wider font-bold text-gray-500 w-24 border-r border-[#e1d5cc]">
              Time Slot
            </th>
            <th
              v-for="day in weekDates"
              :key="day.dayOfWeek"
              class="p-3 text-center border-r border-[#e1d5cc] last:border-r-0"
              :class="day.isToday ? 'bg-amber-100/70' : ''"
            >
              <div class="text-xs uppercase tracking-wider font-bold text-gray-500">{{ day.shortName }}</div>
              <div
                class="text-lg font-bold mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full"
                :class="day.isToday ? 'bg-[#5c001f] text-white' : 'text-gray-900'"
              >
                {{ day.dayNumber }}
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="slot in timeSlots"
            :key="slot.hour"
            class="border-b border-[#e1d5cc] transition-colors"
            :class="slot.isBreak ? 'bg-amber-50/60' : 'hover:bg-gray-50/50'"
          >
            <!-- Time Column -->
            <td class="p-3 text-center text-xs font-bold text-gray-600 bg-[#f7f1ea] border-r border-[#e1d5cc] align-middle">
              <div>{{ slot.timeStr }}</div>
              <div class="text-[10px] text-gray-400 font-medium">{{ slot.endStr }}</div>
              <span v-if="slot.isBreak" class="inline-flex mt-1 text-[9px] font-extrabold text-amber-800 uppercase tracking-tighter bg-amber-200/80 px-1.5 py-0.5 rounded">
                Break
              </span>
            </td>

            <!-- Day Columns -->
            <td
              v-for="day in weekDates"
              :key="day.dayOfWeek"
              @click="onCellClick(day, slot)"
              class="p-1.5 border-r border-[#e1d5cc] last:border-r-0 align-top relative transition-all min-h-[64px] h-[64px]"
              :class="[
                slot.isBreak ? 'bg-amber-50/40' : '',
                interactive && !readOnly ? 'cursor-pointer hover:bg-amber-100/30' : '',
              ]"
            >
              <!-- Break Shading Indicator -->
              <div
                v-if="slot.isBreak"
                class="absolute inset-0 bg-amber-200/20 pointer-events-none border-y border-amber-300/40 flex items-center justify-center"
              >
                <span class="text-[10px] font-bold text-amber-800/40 uppercase tracking-widest select-none">
                  {{ breakLabel }}
                </span>
              </div>

              <!-- Slots / Events Container -->
              <div class="flex flex-col gap-1 relative z-10 h-full">
                <div
                  v-for="item in getSlotsForCell(day.dayOfWeek, slot.hour, day.dateStr)"
                  :key="item.id"
                  @click="onSlotClick(item, $event)"
                  class="p-2 rounded-xl text-xs font-bold shadow-sm border flex items-center justify-between group transition-all transform hover:-translate-y-0.5"
                  :style="getItemStyle(item)"
                  :class="getItemClass(item)"
                >
                  <div class="truncate pr-1">
                    <div class="truncate font-bold">{{ item.title }}</div>
                    <div class="text-[10px] opacity-80 font-normal">
                      {{ item.isRecurring ? 'Weekly Recurring' : 'Date Specific' }}
                    </div>
                  </div>

                  <button
                    v-if="interactive && !readOnly"
                    @click="removeSlot(item, $event)"
                    class="opacity-0 group-hover:opacity-100 hover:text-red-200 text-white transition-opacity p-0.5 rounded cursor-pointer"
                    title="Remove slot"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- GOOGLE CALENDAR STYLE FULL MONTH VIEW GRID -->
    <div v-else-if="viewMode === 'month'" class="p-4 sm:p-6 bg-gray-50/50">
      <div class="grid grid-cols-7 border-b border-[#e1d5cc] pb-2 mb-3 bg-[#f7f1ea] rounded-t-2xl p-2.5">
        <div v-for="d in DAYS_OF_WEEK" :key="d.id" class="text-center font-bold text-xs uppercase tracking-wider text-[#5c001f]">
          {{ d.short }}
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
        <div
          v-for="(day, index) in monthGridDays"
          :key="index"
          class="bg-white border rounded-2xl p-2 min-h-[110px] sm:min-h-[130px] flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
          :class="[
            !day.isCurrentMonth ? 'bg-gray-100/60 border-gray-200 text-gray-400' : 'border-[#e1d5cc] text-gray-800',
            day.isToday ? 'ring-2 ring-[#5c001f] bg-amber-50/40' : '',
          ]"
        >
          <!-- Date Header -->
          <div class="flex items-center justify-between">
            <span
              class="text-xs sm:text-sm font-bold inline-flex items-center justify-center w-6 h-6 rounded-full"
              :class="day.isToday ? 'bg-[#5c001f] text-white' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'"
            >
              {{ day.dayNumber }}
            </span>
            <span v-if="day.isToday" class="text-[9px] bg-[#5c001f] text-white px-1.5 py-0.5 rounded-full font-bold">Today</span>
          </div>

          <!-- Items / Events Badge List -->
          <div class="space-y-1 my-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-thin">
            <div
              v-for="item in getItemsForMonthDay(day)"
              :key="item.id"
              class="text-[10px] sm:text-[11px] px-2 py-1 rounded-lg font-bold truncate shadow-xs flex items-center gap-1.5 border transition-transform hover:scale-[1.02]"
              :style="getItemStyle(item)"
              :class="getItemClass(item)"
              :title="item.time ? `${item.time} - ${item.title}` : item.title"
            >
              <span v-if="item.time" class="opacity-80 text-[9px] font-mono shrink-0">{{ item.time }}</span>
              <span class="truncate">{{ item.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Working Hours & Afternoon Break Settings Modal -->
    <div
      v-if="showSettingsModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 text-gray-900">
        <button
          @click="showSettingsModal = false"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer"
        >
          ✕
        </button>

        <div class="flex items-center gap-3 mb-4">
          <div class="p-3 rounded-2xl bg-[#5c001f] text-[#f8be17]">
            <Clock class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-[#5c001f]">Calendar Working Hours & Break Settings</h3>
            <p class="text-xs text-gray-600">Customize daily working hours range and afternoon prayer/lunch break shading.</p>
          </div>
        </div>

        <div class="space-y-4 pt-2">
          <!-- Working Hours Range -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                Start Working Hour
              </label>
              <select
                v-model.number="workingStartHour"
                class="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:border-[#5c001f] outline-none"
              >
                <option :value="7">07:00 AM</option>
                <option :value="8">08:00 AM</option>
                <option :value="9">09:00 AM</option>
              </select>
            </div>

            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                End Working Hour
              </label>
              <select
                v-model.number="workingEndHour"
                class="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:border-[#5c001f] outline-none"
              >
                <option :value="17">05:00 PM (17:00)</option>
                <option :value="18">06:00 PM (18:00)</option>
                <option :value="19">07:00 PM (19:00)</option>
                <option :value="20">08:00 PM (20:00)</option>
              </select>
            </div>
          </div>

          <!-- Enable Afternoon Break Shading -->
          <div class="pt-2 border-t border-gray-200">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="enableBreakTime"
                type="checkbox"
                class="w-4 h-4 accent-[#5c001f] rounded cursor-pointer"
              />
              <span class="text-sm font-bold text-gray-800">Highlight Afternoon / Prayer Break Shading</span>
            </label>
          </div>

          <!-- Afternoon Break Range -->
          <div v-if="enableBreakTime" class="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                Break Start Hour
              </label>
              <select
                v-model.number="breakStartHour"
                class="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:border-[#5c001f] outline-none"
              >
                <option :value="12">12:00 PM</option>
                <option :value="13">01:00 PM (13:00)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                Break End Hour
              </label>
              <select
                v-model.number="breakEndHour"
                class="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:border-[#5c001f] outline-none"
              >
                <option :value="13">01:00 PM (13:00)</option>
                <option :value="14">02:00 PM (14:00)</option>
                <option :value="15">03:00 PM (15:00)</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-200">
            <button
              @click="showSettingsModal = false"
              class="px-6 py-2.5 rounded-xl bg-[#5c001f] text-white font-bold text-sm shadow hover:bg-[#4a0019] transition-all cursor-pointer"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
