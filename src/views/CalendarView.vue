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

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- DEVELOPER DATABASE TESTING JSON CONSOLE                        -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="max-w-6xl mx-auto mt-4">
      <div class="bg-surface-bg rounded-xl shadow-sm border border-page-text/20 overflow-hidden">

        <!-- Console header / toggle -->
        <button
          id="toggle-console-btn"
          @click="consoleOpen = !consoleOpen"
          class="w-full flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-page-text/5 transition-colors group"
        >
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded bg-page-text/80 text-surface-bg text-xs font-mono font-bold">
              { }
            </span>
            <span class="text-sm font-semibold text-page-text/90 group-hover:text-page-text transition-colors">
              Developer Database Testing JSON Console
            </span>
            <span class="text-xs text-page-text/60 font-medium">MySQL Simulation</span>
          </div>
          <!-- Chevron -->
          <svg
            class="h-5 w-5 text-page-text/60 transition-transform duration-200"
            :class="consoleOpen ? 'rotate-180' : ''"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Collapsible body -->
        <div
          v-show="consoleOpen"
          class="transition-all duration-300 ease-in-out"
        >
          <div class="px-5 pb-5 border-t border-page-text/10">

            <!-- Info banner -->
            <div class="mt-3 mb-3 flex items-start gap-2 bg-utm-gold/10 border border-utm-gold/30 rounded-lg px-3 py-2">
              <svg class="w-4 h-4 text-utm-gold mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              <p class="text-xs text-page-text/80 leading-relaxed">
                <strong>Read/Write Panel</strong> — Edit the raw JSON below to simulate writing to the MySQL database.
                Changes will reflect on the calendar grid instantly upon clicking <em>"Update/Write"</em>.
              </p>
            </div>

            <!-- Textarea -->
            <textarea
              id="json-editor"
              v-model="jsonTextarea"
              spellcheck="false"
              class="w-full h-64 px-3 py-2.5 font-mono text-xs text-page-text bg-page-bg border border-page-text/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-utm-maroon/30 focus:border-utm-maroon resize-y leading-relaxed"
              placeholder="Paste your JSON data here..."
            ></textarea>

            <!-- Error / Success messages -->
            <div v-if="jsonError" class="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
              {{ jsonError }}
            </div>
            <div v-if="jsonSuccess" class="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
              {{ jsonSuccess }}
            </div>

            <!-- Action buttons -->
            <div class="mt-3 flex items-center gap-3">
              <button
                id="write-json-btn"
                @click="writeJsonToCalendar"
                class="inline-flex items-center gap-1.5 bg-utm-maroon hover:bg-utm-maroon/80 text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors shadow-sm cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Update / Write Calendar from JSON
              </button>
              <button
                id="reset-json-btn"
                @click="resetMockData"
                class="inline-flex items-center gap-1.5 bg-page-bg hover:bg-page-text/10 text-page-text/90 text-xs font-semibold px-4 py-2 rounded-md border border-page-text/30 transition-colors cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Mock Data
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
      </main>
    </div>
  </div>
</template>
