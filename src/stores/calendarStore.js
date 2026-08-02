import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'

export const useCalendarStore = defineStore('calendar', () => {
  const sessionData = ref(null)
  const activeSessionId = ref(null)
  const selectedSchedules = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Predefined color palette for mapping dynamic schedules
  const colorsList = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f43f5e', // Rose
  ]

  // Dynamic mapping of schedule owners to color codes
  const colorMap = computed(() => {
    if (!sessionData.value || !sessionData.value.timetables) return {}
    const map = {}
    sessionData.value.timetables.forEach((tb, index) => {
      map[tb.time_table_id] = colorsList[index % colorsList.length]
    })
    return map
  })

  // List of schedules split by categories (Class sections and Lecturers/Staff)
  const availableSchedules = computed(() => {
    if (!sessionData.value || !sessionData.value.timetables) {
      return { classes: [], lecturers: [] }
    }
    const classes = []
    const lecturers = []
    sessionData.value.timetables.forEach((tb) => {
      const isClass = tb.class_id != null
      const label = isClass
        ? tb.section_name
        : tb.staff_name || tb.staff_email || `User ${tb.user_id}`
      const item = {
        id: tb.time_table_id,
        label: label,
        is_class: isClass,
        color: colorMap.value[tb.time_table_id],
      }
      if (isClass) {
        classes.push(item)
      } else {
        lecturers.push(item)
      }
    })
    return { classes, lecturers }
  })

  // Fetch session data from the API and pre-select all schedules
  const fetchSessionData = async (sessionId) => {
    isLoading.value = true
    error.value = null
    try {
      const data = await apiService.getFYPSessionData(sessionId)
      sessionData.value = data
      // Select all schedule filters by default
      selectedSchedules.value = data.timetables.map((t) => t.time_table_id)
    } catch (err) {
      console.error('Error fetching calendar session data:', err)
      error.value = err.message || 'Failed to load session data'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch active session from API or LocalStorage
  const fetchActiveSession = async () => {
    isLoading.value = true
    error.value = null

    // 1. Check if we already have it in localStorage to prevent SQL overload
    const cachedSessionId = localStorage.getItem('activeSessionId')
    if (cachedSessionId) {
      activeSessionId.value = parseInt(cachedSessionId, 10)
      await fetchSessionData(activeSessionId.value)
      return // Skip the API call completely
    }

    // 2. Otherwise fetch from API
    try {
      const activeSession = await apiService.getActiveSession()
      activeSessionId.value = activeSession.fyp_session_id

      // Save it to localStorage for future visits
      localStorage.setItem('activeSessionId', activeSessionId.value)

      // Now fetch the data for this active session
      await fetchSessionData(activeSessionId.value)
    } catch (err) {
      console.error('Error fetching active session:', err)
      error.value = err.message || 'Failed to load active session'
      isLoading.value = false
    }
  }

  // Format Date helper
  const formatDate = (date) => {
    const d = new Date(date)
    let month = '' + (d.getMonth() + 1)
    let day = '' + d.getDate()
    const year = d.getFullYear()

    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day

    return [year, month, day].join('-')
  }

  // Flattens weekly recurring schedules & specific calendar events from DB
  const flatEvents = computed(() => {
    if (!sessionData.value || !sessionData.value.timetables) return []
    const events = []
    let idCounter = 1
    const DAY_ID_MAP = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 }
    const DAY_NAME_MAP = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' }

    sessionData.value.timetables.forEach((tb) => {
      const isClass = tb.class_id != null
      const ownerLabel = isClass
        ? (tb.section_name || `Section ${tb.class_id}`)
        : (tb.staff_name || tb.staff_email || `User ${tb.user_id}`)
      const rawSchedule = tb.schedule || {}

      const color = colorMap.value[tb.time_table_id] || '#5c001f'

      let rawList = []
      if (Array.isArray(rawSchedule)) {
        rawList = rawSchedule
      } else if (rawSchedule && typeof rawSchedule === 'object') {
        const specList = rawSchedule.specific_events || rawSchedule.specific_calendar_events || []
        if (Array.isArray(specList)) {
          specList.forEach((e) => {
            events.push({
              id: `db-specific-${idCounter++}`,
              title: e.label || e.title || 'Event',
              label: e.label || e.title || 'Event',
              date: e.date || e.target_date,
              target_date: e.date || e.target_date,
              start_time: e.start_time || '08:00',
              end_time: e.end_time || '09:00',
              owner: ownerLabel,
              owner_id: tb.time_table_id,
              is_class: isClass,
              is_recurring: false,
              color: color,
              type: e.type || 'event',
            })
          })
        }

        rawList = rawSchedule.weekly_recurring || rawSchedule.weekly_recurring_occupancy || rawSchedule.schedule || []
        if (!Array.isArray(rawList)) rawList = []
      }

      rawList.forEach((entry) => {
        if (entry.slots && Array.isArray(entry.slots)) {
          const dayId = entry.day_of_week || entry.dayOfWeek || DAY_ID_MAP[entry.day_name || entry.day] || 1
          const dayName = entry.day_name || entry.day || DAY_NAME_MAP[dayId] || 'Monday'
          entry.slots.forEach((s) => {
            const startTime = s.start_time || s.time || '09:00'
            const startHour = parseInt(startTime.split(':')[0], 10)
            const endTime = s.end_time || `${String(startHour + 1).padStart(2, '0')}:00`
            events.push({
              id: `db-recurring-${idCounter++}`,
              title: s.label || s.subject || s.title || 'Weekly Slot',
              label: s.label || s.subject || s.title || 'Weekly Slot',
              day_of_week: dayId,
              day_name: dayName,
              start_time: startTime,
              end_time: endTime,
              owner: ownerLabel,
              owner_id: tb.time_table_id,
              is_class: isClass,
              is_recurring: true,
              color: color,
              type: s.type || 'class',
              code: s.code || '',
            })
          })
        } else if (entry.day || entry.day_name || entry.time || entry.start_time || entry.day_of_week) {
          const dayId = entry.day_of_week || entry.dayOfWeek || DAY_ID_MAP[entry.day || entry.day_name] || 1
          const dayName = entry.day_name || entry.day || DAY_NAME_MAP[dayId] || 'Monday'
          const startTime = entry.start_time || entry.time || '09:00'
          const startHour = parseInt(startTime.split(':')[0], 10)
          const endTime = entry.end_time || `${String(startHour + 1).padStart(2, '0')}:00`
          events.push({
            id: `db-recurring-${idCounter++}`,
            title: entry.label || entry.subject || entry.title || 'Weekly Slot',
            label: entry.label || entry.subject || entry.title || 'Weekly Slot',
            day_of_week: dayId,
            day_name: dayName,
            start_time: startTime,
            end_time: endTime,
            owner: ownerLabel,
            owner_id: tb.time_table_id,
            is_class: isClass,
            is_recurring: true,
            color: color,
            type: entry.type || 'class',
            code: entry.code || '',
          })
        }
      })
    })

    return events
  })

  // Derived state: events that are active/checked in the filter checkboxes
  const visibleEvents = computed(() => {
    return flatEvents.value.filter((event) => selectedSchedules.value.includes(event.owner_id))
  })

  return {
    sessionData,
    activeSessionId,
    selectedSchedules,
    isLoading,
    error,
    colorMap,
    availableSchedules,
    flatEvents,
    visibleEvents,
    fetchSessionData,
    fetchActiveSession,
  }
})
