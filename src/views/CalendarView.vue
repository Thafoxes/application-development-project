<script setup>
import { ref, computed, watch } from 'vue'

import CalendarSchedule from '@/components/CalendarSchedule.vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'

// ─── Original Mock Data (imported from JSON, used as immutable default) ──
import originalData from '../../localData/calendar_data.json'

// ─── Reactive unified data source (simulates MySQL retrieval) ─────────
const calendarData = ref(structuredClone(originalData))

// ─── Developer Console State ──────────────────────────────────────────
const consoleOpen = ref(false)
const jsonTextarea = ref(JSON.stringify(originalData, null, 2))
const jsonError = ref('')
const jsonSuccess = ref('')

// Keep textarea in sync when calendarData changes externally
watch(calendarData, (val) => {
  jsonTextarea.value = JSON.stringify(val, null, 2)
}, { deep: true })

// ─── Console Actions ──────────────────────────────────────────────────
function writeJsonToCalendar() {
  jsonError.value = ''
  jsonSuccess.value = ''
  try {
    const parsed = JSON.parse(jsonTextarea.value)
    // Basic structural validation
    if (!parsed.weekly_recurring_occupancy || !Array.isArray(parsed.weekly_recurring_occupancy)) {
      throw new Error('Missing or invalid "weekly_recurring_occupancy" array.')
    }
    if (!parsed.specific_calendar_events || !Array.isArray(parsed.specific_calendar_events)) {
      throw new Error('Missing or invalid "specific_calendar_events" array.')
    }
    calendarData.value = parsed
    jsonSuccess.value = `✓ Calendar updated successfully at ${new Date().toLocaleTimeString()}`
    setTimeout(() => { jsonSuccess.value = '' }, 3000)
  } catch (err) {
    jsonError.value = `✗ ${err.message}`
  }
}

function resetMockData() {
  jsonError.value = ''
  jsonSuccess.value = ''
  calendarData.value = structuredClone(originalData)
  jsonTextarea.value = JSON.stringify(originalData, null, 2)
  jsonSuccess.value = '✓ Reset to original MySQL mock data.'
  setTimeout(() => { jsonSuccess.value = '' }, 3000)
}

// ─── Day-of-week mapping helper ───────────────────────────────────────
function jsDayToJsonDay(jsDay) {
  return jsDay === 0 ? 7 : jsDay
}

function formatDate(d) {
  let month = '' + (d.getMonth() + 1)
  let day = '' + d.getDate()
  const year = d.getFullYear()

  if (month.length < 2) month = '0' + month
  if (day.length < 2) day = '0' + day

  return [year, month, day].join('-')
}

// ─── Flatten data for CalendarSchedule ────────────────────────────────
const flatEvents = computed(() => {
  const events = []
  const data = calendarData.value
  let idCounter = 1

  // 1. Add specific events
  if (data.specific_calendar_events) {
    for (const e of data.specific_calendar_events) {
      events.push({
        id: `specific-${idCounter++}`,
        title: e.title,
        date: e.target_date,
        start_time: e.start_time || '08:00', // Default if missing
        end_time: e.end_time || '09:00',
        course_context: e.course_context
      })
    }
  }

  // 2. Add recurring slots for a fixed range (e.g., 2026) to feed the calendar
  if (data.weekly_recurring_occupancy) {
    const startDate = new Date(2026, 0, 1)
    const endDate = new Date(2026, 11, 31)
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const jsonDayOfWeek = jsDayToJsonDay(d.getDay())
      const dateStr = formatDate(d)
      
      const recurring = data.weekly_recurring_occupancy.find(r => r.day_of_week === jsonDayOfWeek)
      if (recurring && recurring.slots) {
        for (const slot of recurring.slots) {
          events.push({
            id: `recurring-${idCounter++}`,
            title: slot.label,
            date: dateStr,
            start_time: slot.start_time,
            end_time: slot.end_time
          })
        }
      }
    }
  }

  return events
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black">
    <!-- Header -->
    <AppHeader />

    <!-- Main Content Split Layout -->
    <div class="flex flex-1 w-full relative">
      <!-- Side Navigation -->
      <AppSidebar />

      <!-- Main Dashboard Content -->
      <main class="flex-1 flex flex-col px-[50px] py-[30px] gap-8 overflow-y-auto">
        <!-- Heading -->
        <div class="flex items-center justify-between w-full">
          <h1 class="font-['Inter'] font-bold text-[40px] text-black uppercase">CALENDAR</h1>
        </div>

        <!-- Divider -->
        <hr class="border-[#2f2f2f] w-full" />

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- CALENDAR COMPONENT                                             -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="w-full">
          <CalendarSchedule :events="flatEvents" />
        </div>

   
      </main>
    </div>
  </div>
</template>
