<script setup>
import { ref, computed, watch } from 'vue'

// ─── Original Mock Data (imported from JSON, used as immutable default) ──
import originalData from '../../localData/calendar_data.json'

// ─── Reactive unified data source (simulates MySQL retrieval) ─────────
const calendarData = ref(structuredClone(originalData))

// ─── State ────────────────────────────────────────────────────────────
const today = new Date(2026, 4, 7) // May 7, 2026 (month is 0-indexed)
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth()) // 0-indexed: 4 = May
const selectedCourse = ref('all')

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

// ─── Month helpers ────────────────────────────────────────────────────
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const activeMonthLabel = computed(() => `${monthNames[currentMonth.value]} ${currentYear.value}`)

const prevMonthLabel = computed(() => {
  const m = currentMonth.value === 0 ? 11 : currentMonth.value - 1
  return monthNames[m]
})

const nextMonthLabel = computed(() => {
  const m = currentMonth.value === 11 ? 0 : currentMonth.value + 1
  return monthNames[m]
})

// ─── Navigation ───────────────────────────────────────────────────────
function goToPrevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function goToNextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// ─── Day-of-week mapping helper ───────────────────────────────────────
// JSON uses: 1=Monday, 2=Tuesday, ... 7=Sunday
// JS Date.getDay() returns: 0=Sun, 1=Mon, ... 6=Sat
// Convert JS day -> JSON day_of_week
function jsDayToJsonDay(jsDay) {
  return jsDay === 0 ? 7 : jsDay
}

// ─── Calendar grid computation (dual-source injection) ────────────────
const calendarWeeks = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const data = calendarData.value

  // First day of month (JS: 0=Sun,1=Mon,...6=Sat)
  const firstDayJS = new Date(year, month, 1).getDay()
  // Convert to Mon-start index (Mon=0 … Sun=6)
  const startOffset = firstDayJS === 0 ? 6 : firstDayJS - 1

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []

  // Leading empty cells
  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: null, events: [], recurringSlots: [], isToday: false, hasEvents: false, hasRecurring: false })
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dateObj = new Date(year, month, d)
    const jsonDayOfWeek = jsDayToJsonDay(dateObj.getDay())

    // ── Specific calendar events (deadline indicators) ──
    const dayEvents = (data.specific_calendar_events || []).filter(
      (e) => e.target_date === dateStr
    )

    // ── Weekly recurring occupancy (class/lab slots) ──
    const recurringSlots = []
    for (const entry of (data.weekly_recurring_occupancy || [])) {
      if (entry.day_of_week === jsonDayOfWeek) {
        for (const slot of (entry.slots || [])) {
          recurringSlots.push({ ...slot, dayName: entry.day_name })
        }
      }
    }

    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()

    cells.push({
      day: d,
      events: dayEvents,
      recurringSlots,
      isToday,
      hasEvents: dayEvents.length > 0,
      hasRecurring: recurringSlots.length > 0
    })
  }

  // Pad to complete last week
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, events: [], recurringSlots: [], isToday: false, hasEvents: false, hasRecurring: false })
  }

  // Chunk into weeks
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
})

// ─── Course options (derived from data) ───────────────────────────────
const courseOptions = computed(() => {
  const courses = new Set(
    (calendarData.value.specific_calendar_events || []).map((e) => e.course_context).filter(Boolean)
  )
  return ['All courses', ...courses]
})
</script>

<template>
  <div class="min-h-screen bg-page-bg text-page-text p-4 sm:p-6 lg:p-8 font-sans">

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- CALENDAR CARD                                                  -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="max-w-5xl mx-auto bg-surface-bg rounded-xl shadow-sm border border-page-text/20 overflow-hidden">

      <!-- ─── Header ────────────────────────────────────────────── -->
      <div class="px-5 pt-5 pb-3">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-xl font-bold tracking-tight">Calendar</h1>

            <!-- Filter dropdown -->
            <div class="mt-3 relative">
              <select
                id="course-filter"
                v-model="selectedCourse"
                class="appearance-none w-72 pl-3 pr-10 py-2 text-sm bg-surface-bg border border-page-text/30 rounded-md focus:outline-none focus:ring-2 focus:ring-utm-maroon/30 focus:border-utm-maroon cursor-pointer"
              >
                <option value="all">All courses</option>
                <option v-for="course in courseOptions.slice(1)" :key="course" :value="course">
                  {{ course }}
                </option>
              </select>
              <!-- Chevron icon -->
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg class="h-4 w-4 text-page-text/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- New event button -->
          <button
            id="new-event-btn"
            class="bg-utm-maroon hover:bg-utm-maroon/80 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150 shadow-sm cursor-pointer"
          >
            New event
          </button>
        </div>
      </div>

      <!-- ─── Navigation Row ────────────────────────────────────── -->
      <div class="flex items-center justify-between px-5 py-3">
        <!-- Prev month -->
        <button
          id="prev-month-btn"
          @click="goToPrevMonth"
          class="flex items-center gap-1 text-utm-maroon hover:text-utm-maroon/80 text-sm font-medium transition-colors cursor-pointer group"
        >
          <span class="text-xs transition-transform group-hover:-translate-x-0.5">◀</span>
          <span>{{ prevMonthLabel }}</span>
        </button>

        <!-- Current month/year -->
        <h2 class="text-xl sm:text-2xl font-semibold text-utm-maroon tracking-tight select-none">
          {{ activeMonthLabel }}
        </h2>

        <!-- Next month -->
        <button
          id="next-month-btn"
          @click="goToNextMonth"
          class="flex items-center gap-1 text-utm-maroon hover:text-utm-maroon/80 text-sm font-medium transition-colors cursor-pointer group"
        >
          <span>{{ nextMonthLabel }}</span>
          <span class="text-xs transition-transform group-hover:translate-x-0.5">▶</span>
        </button>
      </div>

      <!-- ─── Calendar Grid ─────────────────────────────────────── -->
      <div class="border-t border-page-text/20">
        <!-- Day-of-week headers -->
        <div class="grid grid-cols-7 border-b border-page-text/20">
          <div
            v-for="header in dayHeaders"
            :key="header"
            class="py-2 px-2 text-xs font-semibold text-page-text/70 tracking-wide text-left border-r border-page-text/10 last:border-r-0"
          >
            {{ header }}
          </div>
        </div>

        <!-- Week rows -->
        <div
          v-for="(week, wIdx) in calendarWeeks"
          :key="wIdx"
          class="grid grid-cols-7 border-b border-page-text/10 last:border-b-0"
        >
          <div
            v-for="(cell, dIdx) in week"
            :key="dIdx"
            class="min-h-[100px] sm:min-h-[120px] p-2 border-r border-page-text/10 last:border-r-0 relative transition-colors"
            :class="cell.day ? 'hover:bg-page-text/5' : 'bg-page-text/5'"
          >
            <!-- Day number -->
            <template v-if="cell.day">
              <!-- Today badge -->
              <div v-if="cell.isToday" class="flex items-start">
                <span
                  class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-utm-maroon text-white text-sm font-semibold leading-none shadow-sm"
                >
                  {{ cell.day }}
                </span>
              </div>
              <!-- Day with events or recurring (maroon) -->
              <div v-else-if="cell.hasEvents || cell.hasRecurring">
                <span class="text-sm font-medium text-utm-maroon">{{ cell.day }}</span>
              </div>
              <!-- Normal day -->
              <div v-else>
                <span class="text-sm font-medium text-page-text/80">{{ cell.day }}</span>
              </div>

              <!-- ── Recurring class/lab slots (tinted banners) ── -->
              <div v-if="cell.recurringSlots.length" class="mt-1.5 space-y-1">
                <div
                  v-for="slot in cell.recurringSlots"
                  :key="slot.slot_id"
                  class="bg-page-bg/50 border border-page-text/10 rounded px-1.5 py-1 transition-colors hover:bg-page-bg"
                >
                  <p class="text-[10px] text-page-text/70 font-medium leading-tight">
                    {{ slot.start_time }} – {{ slot.end_time }}
                  </p>
                  <p class="text-[11px] text-page-text/90 font-semibold truncate leading-tight">
                    {{ slot.label }}
                  </p>
                  <p v-if="slot.location" class="text-[10px] text-page-text/60 truncate leading-tight">
                    {{ slot.location }}
                  </p>
                </div>
              </div>

              <!-- ── Specific deadline events (orange circle indicators) ── -->
              <div v-if="cell.events.length" class="mt-1.5 space-y-1">
                <div
                  v-for="event in cell.events"
                  :key="event.event_id"
                  class="flex items-start gap-1.5 group/event"
                >
                  <!-- Gold circle indicator -->
                  <span class="mt-0.5 shrink-0 w-3.5 h-3.5 rounded-full border-2 border-utm-gold inline-block"></span>
                  <!-- Event title with truncation -->
                  <span class="text-xs text-utm-maroon font-medium truncate leading-tight">
                    {{ event.title }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- DEVELOPER DATABASE TESTING JSON CONSOLE                        -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="max-w-5xl mx-auto mt-4">
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

  </div>
</template>
