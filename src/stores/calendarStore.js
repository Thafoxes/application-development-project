import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'

export const useCalendarStore = defineStore('calendar', () => {
  const sessionData = ref(null)
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
    '#f43f5e'  // Rose
  ]

  // Dynamic mapping of schedule owners to color codes
  const colorMap = computed(() => {
    if (!sessionData.value || !sessionData.value.timetables) return {}
    const map = {}
    sessionData.value.timetables.forEach((tb, index) => {
      map[tb.owner_identifier] = colorsList[index % colorsList.length]
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
    sessionData.value.timetables.forEach(tb => {
      const item = {
        id: tb.owner_identifier,
        label: tb.owner_identifier,
        is_class: tb.is_class === 1,
        color: colorMap.value[tb.owner_identifier]
      }
      if (tb.is_class === 1) {
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
      selectedSchedules.value = data.timetables.map(t => t.owner_identifier)
    } catch (err) {
      console.error('Error fetching calendar session data:', err)
      error.value = err.message || 'Failed to load session data'
    } finally {
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

    sessionData.value.timetables.forEach(tb => {
      const owner = tb.owner_identifier
      const schedule = tb.schedule || {}

      // 1. Specific calendar events
      if (schedule.specific_events && Array.isArray(schedule.specific_events)) {
        schedule.specific_events.forEach(e => {
          events.push({
            id: `db-specific-${idCounter++}`,
            title: e.label || e.title,
            date: e.date || e.target_date,
            start_time: e.start_time || '08:00',
            end_time: e.end_time || '09:00',
            owner: owner,
            is_class: tb.is_class === 1,
            color: colorMap.value[owner]
          })
        })
      }

      // 2. Weekly recurring slots (mapped to the year 2026)
      if (schedule.weekly_recurring && Array.isArray(schedule.weekly_recurring)) {
        const startDate = new Date(2026, 0, 1)
        const endDate = new Date(2026, 11, 31)

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const jsDay = d.getDay()
          const jsonDayOfWeek = jsDay === 0 ? 7 : jsDay // Convert: 0 (Sun) -> 7 (Sun)
          const dateStr = formatDate(d)

          const recurringDay = schedule.weekly_recurring.find(r => r.day_of_week === jsonDayOfWeek)
          if (recurringDay && recurringDay.slots) {
            recurringDay.slots.forEach(slot => {
              events.push({
                id: `db-recurring-${idCounter++}`,
                title: slot.label,
                date: dateStr,
                start_time: slot.start_time,
                end_time: slot.end_time,
                owner: owner,
                is_class: tb.is_class === 1,
                color: colorMap.value[owner]
              })
            })
          }
        }
      }
    })

    return events
  })

  // Derived state: events that are active/checked in the filter checkboxes
  const visibleEvents = computed(() => {
    return flatEvents.value.filter(event => selectedSchedules.value.includes(event.owner))
  })

  return {
    sessionData,
    selectedSchedules,
    isLoading,
    error,
    colorMap,
    availableSchedules,
    flatEvents,
    visibleEvents,
    fetchSessionData
  }
})
