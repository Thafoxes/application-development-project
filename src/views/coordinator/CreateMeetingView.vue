<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import axios from 'axios'
import { AlertTriangle, Search, CheckCircle } from 'lucide-vue-next'
import { useCalendarStore } from '@/stores/calendarStore'
import CalendarSchedule from '@/components/calendar_components/CalendarSchedule.vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'

const calendarStore = useCalendarStore()

const generatedMeetings = ref([])
const fypProjects = ref([])
const loadingProjects = ref(false)
const missingActors = ref([])

const isSavingMeetings = ref(false)
const showSaveSuccessModal = ref(false)
const savedNotificationSummary = ref({ saved_count: 0, notified_actors: [] })

const searchQuery = ref('')
const sortBy = ref('newest')

const filteredFypProjects = computed(() => {
  let list = [...fypProjects.value]

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((p) => {
      const title = (p.fyp_title || p.project_title || '').toLowerCase()
      const studentName = (p.student?.full_name || p.student_name || '').toLowerCase()
      const studentEmail = (p.student?.email || '').toLowerCase()
      const matricNo = (p.student?.matric_no || p.matric_no || '').toLowerCase()
      return title.includes(q) || studentName.includes(q) || studentEmail.includes(q) || matricNo.includes(q)
    })
  }

  if (sortBy.value === 'newest') {
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  } else if (sortBy.value === 'oldest') {
    list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
  } else if (sortBy.value === 'updated') {
    list.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
  } else if (sortBy.value === 'title') {
    list.sort((a, b) => (a.fyp_title || a.project_title || '').localeCompare(b.fyp_title || b.project_title || ''))
  }

  return list
})

const fetchFypProjects = async () => {
  loadingProjects.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/timetable/projects')
    if (res.data.success && res.data.data) {
      fypProjects.value = res.data.data
    }
  } catch (e) {
    console.error('Failed to fetch FYP projects:', e)
  } finally {
    loadingProjects.value = false
  }
}

const fetchTempMeeting = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/timetable/temp')
    if (res.data.success && res.data.data) {
      generatedMeetings.value = res.data.data
    } else {
      generatedMeetings.value = []
    }
  } catch (e) {
    console.error('Failed to fetch temp meeting:', e)
  }
}

const deleteTempMeeting = async (id) => {
  try {
    await axios.delete(`http://localhost:3000/api/timetable/temp?id=${id}`)
    generatedMeetings.value = generatedMeetings.value.filter((m) => m.id !== id)
  } catch (e) {
    console.error('Failed to delete temp meeting:', e)
  }
}

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import utmLogoUrl from '@/assets/UTM_ASCEND2030_COLOR.png'

const exportToPdf = async () => {
  if (generatedMeetings.value.length === 0) {
    alert('No meetings to export!')
    return
  }

  const doc = new jsPDF()

  // Load Logo
  const img = await new Promise((resolve, reject) => {
    const imgObj = new Image()
    imgObj.src = utmLogoUrl
    imgObj.onload = () => resolve(imgObj)
    imgObj.onerror = (e) => reject(e)
  }).catch(() => null)

  let startY = 20
  if (img) {
    const imgWidth = 70
    const imgHeight = (img.height / img.width) * imgWidth
    const x = (doc.internal.pageSize.getWidth() - imgWidth) / 2
    doc.addImage(img, 'PNG', x, 15, imgWidth, imgHeight)
    startY = 15 + imgHeight + 10
  }

  // Session info
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Session', 105, startY, { align: 'center' })
  doc.text(calendarStore.activeSession?.session_name || '2025/2026 Semester 1', 105, startY + 6, {
    align: 'center',
  })
  doc.text('Coordinator name: Coordinator Admin', 105, startY + 12, { align: 'center' })

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('FYP Project', 105, startY + 25, { align: 'center' })

  // Table Data
  const tableData = generatedMeetings.value.map((meeting) => {
    return [
      meeting.student?.full_name || '-',
      meeting.student?.user_id || '-',
      meeting.date || '-',
      `${meeting.start_time} - ${meeting.end_time}`,
      meeting.supervisor?.full_name || '-',
      meeting.examiners?.[0]?.full_name || '-',
      meeting.examiners?.[1]?.full_name || '-',
    ]
  })

  autoTable(doc, {
    startY: startY + 35,
    head: [
      [
        'Student\nName',
        'Metric\nnumber',
        'Date',
        'Time',
        'Supervisor\nname',
        'Examiner\nname 1',
        'Examiner\nname 2',
      ],
    ],
    body: tableData,
    theme: 'plain',
    styles: {
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      fontSize: 9,
    },
    headStyles: {
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      halign: 'left',
    },
    margin: { top: startY + 35, left: 14, right: 14 },
  })

  doc.save('FYP_Project_Schedule.pdf')

  // Clear the backend temp file and the local state
  try {
    const res = await axios.delete('http://localhost:3000/api/timetable/temp')
    if (res.data.success) {
      generatedMeetings.value = []
      alert('PDF exported successfully. Temporary meeting schedules have been cleared!')
    } else {
      alert('PDF exported, but failed to clear temporary schedules on the server.')
    }
  } catch (err) {
    console.error('Failed to clear temp meetings:', err)
    alert('PDF exported, but error occurred while clearing temporary schedules.')
  }
}

const saveAllMeetings = async () => {
  if (generatedMeetings.value.length === 0) {
    alert('No proposed meetings to save!')
    return
  }

  isSavingMeetings.value = true
  try {
    const res = await axios.post('http://localhost:3000/api/timetable/save-meetings', {
      meetings: generatedMeetings.value,
    })

    if (res.data.success) {
      savedNotificationSummary.value = {
        saved_count: res.data.saved_count || generatedMeetings.value.length,
        notified_actors: res.data.notified_actors || [],
      }
      generatedMeetings.value = []
      showSaveSuccessModal.value = true
    } else {
      alert('Failed to save meetings: ' + (res.data.error || 'Unknown error'))
    }
  } catch (err) {
    console.error('Failed to save meetings:', err)
    alert('Error connecting to backend server to save meetings.')
  } finally {
    isSavingMeetings.value = false
  }
}

onMounted(() => {
  if (calendarStore.availableSchedules.lecturers.length === 0) {
    calendarStore.fetchActiveSession()
  }
  fetchFypProjects()
  fetchTempMeeting()
  window.addEventListener('temp-meetings-updated', fetchTempMeeting)
})

onBeforeUnmount(() => {
  window.removeEventListener('temp-meetings-updated', fetchTempMeeting)
})

const selectedProjectId = ref(null)
const displayedEvents = ref([])

const combinedEvents = computed(() => {
  const arr = [...displayedEvents.value]
  if (generatedMeetings.value && generatedMeetings.value.length > 0) {
    generatedMeetings.value.forEach((meeting) => {
      arr.push({
        id: `generated-meeting-${meeting.id}`,
        title: 'FYP Mtg: ' + (meeting.project_title || meeting.fyp_title || 'Meeting'),
        date: meeting.date,
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        owner: 'Scheduled Meeting',
        is_class: false,
        color: '#10b981', // emerald green for planned meeting
      })
    })
  }
  return arr
})

// Watch for project selection and fetch actual crosscheck schedule data (Student, Supervisor, Examiner) from backend
watch(selectedProjectId, async (newProjectId) => {
  if (!newProjectId) {
    displayedEvents.value = []
    return
  }

  const project = fypProjects.value.find((p) => p.project_id == newProjectId)
  if (!project) {
    displayedEvents.value = []
    return
  }

  const userIds = []
  const userRolesMap = {}

  // 1. Student timetable
  const rawStudentId = project.student?.user_id || project.student_user_id
  if (rawStudentId && Number(rawStudentId) > 0) {
    const sId = Number(rawStudentId)
    userIds.push(sId)
    userRolesMap[sId] = {
      role: 'Student',
      email: project.student?.email || project.student?.full_name || project.student_name || 'Student',
      color: '#2563eb', // Royal Blue for Student
    }
  }

  // 2. Supervisor timetable
  const rawSvId = project.supervisor?.user_id || project.supervisor_user_id
  if (rawSvId && Number(rawSvId) > 0) {
    const svId = Number(rawSvId)
    userIds.push(svId)
    userRolesMap[svId] = {
      role: 'Supervisor',
      email: project.supervisor?.email || project.supervisor?.full_name || project.supervisor_name || 'Supervisor',
      color: '#5c001f', // Maroon for Supervisor
    }
  }

  // 3. Examiner timetables
  if (project.examiners && Array.isArray(project.examiners)) {
    project.examiners.forEach((ex, idx) => {
      if (ex.user_id && Number(ex.user_id) > 0) {
        const exId = Number(ex.user_id)
        userIds.push(exId)
        userRolesMap[exId] = {
          role: `Examiner ${idx + 1}`,
          email: ex.email || ex.full_name || `Examiner ${idx + 1}`,
          color: idx === 0 ? '#d97706' : '#7c3aed', // Amber / Violet for Examiners
        }
      }
    })
  }

  // 4. Coordinator timetable
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const coordId = Number(user.user_id || user.id || 0)
  if (coordId > 0 && !userIds.includes(coordId)) {
    userIds.push(coordId)
    userRolesMap[coordId] = {
      role: 'Coordinator',
      email: user.email || user.full_name || 'Coordinator Admin',
      color: '#059669', // Emerald Green for Coordinator
    }
  }

  try {
    const response = await axios.post('http://localhost:3000/api/timetable/crosscheck', {
      fyp_session_id: project.fyp_session_id,
      class_id: project.student?.class_id,
      user_ids: userIds,
      user_roles: userRolesMap,
    })

    if (response.data && response.data.status === 'success') {
      displayedEvents.value = response.data.data.occupied_events || []
      missingActors.value = response.data.data.missing_actors || []
    } else {
      displayedEvents.value = []
      missingActors.value = []
    }
  } catch (err) {
    console.error('Failed to crosscheck timetable:', err)
    displayedEvents.value = []
    missingActors.value = []
  }
})

const getTodayDateStr = () => new Date().toISOString().split('T')[0]

const startingDate = ref(getTodayDateStr())
const endingDate = ref(getTodayDateStr())
const meetingDuration = ref(10)
const startingTime = ref('13:00')
const endingTime = ref('14:00')

const avoidWeekend = ref(true)
const avoidOffWorkingHour = ref(true)
const workingHourStart = ref('08:00')
const workingHourEnd = ref('17:00')

const avoidLunchHour = ref(true)
const lunchHourStart = ref('13:00')
const lunchHourEnd = ref('14:00')

// Watch to update endingTime when startingTime or meetingDuration changes
watch([startingTime, meetingDuration], ([newStart, newDuration]) => {
  if (newStart && newDuration) {
    const [h, m] = newStart.split(':').map(Number)
    const totalMins = h * 60 + m + newDuration
    const endH = Math.floor(totalMins / 60)
      .toString()
      .padStart(2, '0')
    const endM = (totalMins % 60).toString().padStart(2, '0')
    endingTime.value = `${endH}:${endM}`
  }
})

// Watch to update meetingDuration when endingTime changes manually
watch(endingTime, (newEnd) => {
  if (newEnd && startingTime.value) {
    const [eh, em] = newEnd.split(':').map(Number)
    const [sh, sm] = startingTime.value.split(':').map(Number)
    const diff = eh * 60 + em - (sh * 60 + sm)
    if (diff > 0) {
      meetingDuration.value = diff
    }
  }
})

const generateSchedule = async () => {
  if (!selectedProjectId.value) {
    alert('Please select an FYP Project first.')
    return
  }

  // Check for weekend conflict
  if (avoidWeekend.value) {
    const [y, m, d] = startingDate.value.split('-').map(Number)
    const day = new Date(y, m - 1, d).getDay() // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      alert('Conflict Detected: The selected date falls on a weekend.')
      return
    }
  }

  // Check for off working hours conflict
  if (avoidOffWorkingHour.value) {
    const reqStart = startingTime.value
    const reqEnd = endingTime.value
    if (reqStart < workingHourStart.value || reqEnd > workingHourEnd.value) {
      alert('Conflict Detected: The selected time falls outside of working hours.')
      return
    }
  }

  // Check for lunch hour conflict
  if (avoidLunchHour.value) {
    const reqStart = startingTime.value
    const reqEnd = endingTime.value
    if (reqStart < lunchHourEnd.value && reqEnd > lunchHourStart.value) {
      alert('Conflict Detected: The selected time overlaps with the lunch hour.')
      return
    }
  }

  // 1. Check for conflicts
  const hasConflict = displayedEvents.value.some((event) => {
    // Only check if it's the exact same date
    if (event.date !== startingDate.value) return false

    const reqStart = startingTime.value
    const reqEnd = endingTime.value

    // Check overlap: conflict if requested start is before event ends AND requested end is after event starts
    return reqStart < event.end_time && reqEnd > event.start_time
  })

  if (hasConflict) {
    alert(
      'Conflict Detected: The selected time overlaps with an existing schedule for the student or lecturers.',
    )
    return
  }

  // 2. Write to temporary JSON file via backend
  try {
    const projectFull = fypProjects.value.find((p) => p.project_id == selectedProjectId.value)
    const response = await axios.post('http://localhost:3000/api/timetable/generate-temp', {
      project: projectFull,
      date: startingDate.value,
      start_time: startingTime.value,
      end_time: endingTime.value,
      duration: meetingDuration.value,
    })

    if (response.data.success) {
      generatedMeetings.value = response.data.data
      alert('Success: No conflicts! Meeting successfully generated and saved.')
    } else {
      alert('Error: Could not save the temporary file.')
    }
  } catch (err) {
    console.error(err)
    alert('Error communicating with the backend to save the temporary file.')
  }
}

const allowedDays = ref([1, 2, 3, 4, 5])
const toggleAllowedDay = (val) => {
  if (allowedDays.value.includes(val)) {
    if (allowedDays.value.length > 1) {
      allowedDays.value = allowedDays.value.filter((d) => d !== val)
    }
  } else {
    allowedDays.value.push(val)
  }
}

const isAutoScheduling = ref(false)

const autoScheduleAll = async () => {
  isAutoScheduling.value = true
  try {
    const activeSessionId = calendarStore.activeSession?.session_id || 25262
    const response = await axios.post('http://localhost:3000/api/timetable/auto-assign', {
      fyp_session_id: activeSessionId,
      startDate: startingDate.value,
      endDate: endingDate.value,
      duration: meetingDuration.value,
      allowedDays: allowedDays.value,
      avoidWeekend: avoidWeekend.value,
      avoidOffWorkingHour: avoidOffWorkingHour.value,
      workingHourStart: workingHourStart.value,
      workingHourEnd: workingHourEnd.value,
      avoidLunchHour: avoidLunchHour.value,
      lunchHourStart: lunchHourStart.value,
      lunchHourEnd: lunchHourEnd.value,
    })

    if (response.data.success) {
      generatedMeetings.value = response.data.data
      const scheduledCount = response.data.data.length
      const totalCount = response.data.totalProjects
      const unscheduledCount = response.data.unscheduledProjects.length

      if (unscheduledCount > 0) {
        const unscheduledTitles = response.data.unscheduledProjects
          .map((p) => p.fyp_title)
          .join('\n - ')
        alert(
          `AI scheduling completed!\nSuccessfully scheduled: ${scheduledCount}/${totalCount} meetings.\n\nThe following ${unscheduledCount} project(s) could not be scheduled due to conflicts:\n - ${unscheduledTitles}`,
        )
      } else {
        alert(
          `AI scheduling completed successfully! All ${scheduledCount} meetings have been scheduled conflict-free.`,
        )
      }
    } else {
      alert('Error: ' + (response.data.error || 'Could not auto-schedule.'))
    }
  } catch (err) {
    console.error('AI scheduling error:', err)
    alert('Error communicating with the AI auto-scheduler.')
  } finally {
    isAutoScheduling.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black">
    <!-- Header -->
    <AppHeader />

    <!-- Main Content Split Layout -->
    <div class="flex flex-col md:flex-row flex-1 w-full min-w-0 relative">
      <!-- Side Navigation -->
      <AppSidebar />

      <!-- Main Dashboard Content -->
      <main
        class="flex-1 flex flex-col px-4 sm:px-6 lg:px-[50px] py-4 sm:py-6 lg:py-[30px] gap-6 overflow-y-auto min-w-0">
        <!-- Breadcrumbs -->
        <div class="text-[#5c001f] text-sm mb-4">
          <span class="hover:underline cursor-pointer" @click="$router.push('/calendar')">View Calendar</span>
          &gt;
          <span class="font-bold underline">Add new meeting</span>
        </div>

        <!-- Top Control Panel: FYP Projects & Meeting Settings Side-by-Side -->
        <div class="flex flex-col lg:flex-row gap-6 w-full">
          <!-- LEFT CARD: FYP PROJECTS Selector & Scheduled Meetings -->
          <div class="w-full lg:w-1/2 flex flex-col gap-6">
            <!-- FYP Projects Card -->
            <div
              class="flex flex-col bg-[#FFFFAB] rounded-2xl shadow-md border border-[#5C001F]/20 overflow-hidden min-h-[340px]">
              <div
                class="bg-[#FFFFAB] p-4 font-extrabold text-[#5C001F] text-lg tracking-wider border-b-2 border-gray-200 flex items-center justify-between">
                <span>FYP PROJECTS</span>
                <span class="text-xs font-bold text-gray-600 bg-white/70 px-2.5 py-1 rounded-full">
                  {{ filteredFypProjects.length }} Project(s)
                </span>
              </div>

              <!-- Search Bar & Sort Dropdown -->
              <div class="bg-[#FFFFAB]/90 px-4 py-3 border-b border-[#5C001F]/10 space-y-2.5">
                <div class="relative">
                  <Search class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input v-model="searchQuery" type="text" placeholder="Search project title or student..."
                    class="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5c001f]" />
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Sort by:</span>
                  <select v-model="sortBy"
                    class="flex-1 text-xs font-bold rounded-lg bg-white border border-gray-300 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-[#5c001f] text-slate-800">
                    <option value="newest">Created Date (Newest)</option>
                    <option value="oldest">Created Date (Oldest)</option>
                    <option value="updated">Recently Modified</option>
                    <option value="title">Project Title (A-Z)</option>
                  </select>
                </div>
              </div>

              <!-- Fixed Height Scrollable Projects List -->
              <div class="flex flex-col gap-3 p-4 max-h-[260px] overflow-y-auto bg-[#FFFFAB]/70">
                <div v-if="loadingProjects" class="p-4 text-center text-xs font-bold text-[#5c001f]">
                  Loading database projects...
                </div>
                <div v-else-if="!filteredFypProjects.length" class="p-4 text-center text-xs text-gray-600 font-medium">
                  No FYP projects match your search or filter.
                </div>
                <label v-for="project in filteredFypProjects" :key="project.project_id"
                  class="bg-white p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border border-gray-200 relative shrink-0"
                  :class="{
                    'ring-2 ring-[#5C001F] bg-[#fff5f7] border-[#5C001F]/30':
                      selectedProjectId === project.project_id,
                  }">
                  <div class="flex flex-col gap-1 pr-8">
                    <span class="font-bold text-[#5C001F] text-sm">{{ project.fyp_title || project.project_title }}</span>
                    <span class="text-[10px] font-bold text-gray-600 uppercase tracking-wide">STUDENT</span>
                    <span class="text-xs text-gray-800 font-semibold">{{ project.student?.full_name || project.student_name || 'Student' }}</span>
                    <div class="flex items-center gap-1 mt-0.5">
                      <span class="text-[10px] font-bold text-gray-500 uppercase">SV:</span>
                      <span class="text-xs font-medium text-gray-600">
                        {{ project.supervisor?.email || project.supervisor_email || project.supervisor?.full_name || 'Not assigned' }}
                      </span>
                    </div>
                  </div>
                  <input type="radio" name="project" :value="project.project_id" v-model="selectedProjectId"
                    class="w-5 h-5 absolute right-4 cursor-pointer accent-[#5c001f]" />
                </label>
              </div>
            </div>

            <!-- Generated Meetings Drawer List (Fixed height scrollable) -->
            <div v-if="generatedMeetings.length > 0"
              class="flex flex-col bg-white border border-[#10b981] rounded-2xl shadow-sm overflow-hidden p-4 gap-3 max-h-[220px] overflow-y-auto">
              <div class="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 class="font-extrabold text-[#5C001F] uppercase text-xs tracking-wider">
                  Scheduled Meetings ({{ generatedMeetings.length }})
                </h3>
                <div class="flex items-center gap-2">
                  <button @click="saveAllMeetings" :disabled="isSavingMeetings"
                    class="bg-[#10b981] hover:bg-[#059669] text-white text-[10px] font-bold px-3 py-1 rounded-md transition-all shadow-sm uppercase tracking-wide flex items-center gap-1 cursor-pointer disabled:opacity-50">
                    <CheckCircle class="w-3.5 h-3.5" />
                    <span>{{ isSavingMeetings ? 'Saving...' : 'Save & Notify All' }}</span>
                  </button>
                  <button @click="exportToPdf"
                    class="bg-[#5C001F] text-white text-[10px] font-bold px-3 py-1 rounded-md hover:bg-[#4a0018] transition-colors shadow-sm uppercase tracking-wide flex items-center gap-1 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF
                  </button>
                </div>
              </div>

              <div v-for="meeting in generatedMeetings" :key="meeting.id"
                class="flex flex-col bg-white border border-[#10b981]/40 rounded-xl shadow-xs relative overflow-hidden shrink-0">
                <div class="absolute top-0 left-0 right-0 h-1 bg-[#10b981]"></div>
                <div class="p-3">
                  <div class="flex justify-between items-start mb-1">
                    <span class="font-bold text-gray-800 text-xs leading-tight pr-4">{{
                      meeting.project_title
                    }}</span>
                    <button @click="deleteTempMeeting(meeting.id)"
                      class="text-red-400 hover:text-red-600 transition-colors p-0.5" title="Delete Schedule">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div class="flex items-center justify-between text-[11px] text-gray-600 font-semibold mt-1">
                    <span>📅 {{ meeting.date }}</span>
                    <span>⏰ {{ meeting.start_time }} - {{ meeting.end_time }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT CARD: Meeting Settings & AI Auto-Scheduler -->
          <div
            class="w-full lg:w-1/2 bg-white border-2 border-[#5C001F]/20 p-5 rounded-2xl shadow-md flex flex-col gap-4 relative overflow-hidden">
            <!-- Decorative Header Accent -->
            <div class="absolute top-0 left-0 right-0 h-2 bg-[#5C001F]"></div>

            <h2 class="text-lg font-extrabold text-[#5C001F] uppercase tracking-wider text-center mt-1">
              Meeting Settings & AI Auto-Scheduler
            </h2>

            <div class="max-h-[300px] overflow-y-auto space-y-4 pr-1">
              <!-- Date & Time Row -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="flex flex-col text-center">
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Meeting Date</label>
                  <input type="date" v-model="startingDate"
                    class="rounded-lg px-2 py-1.5 text-center bg-gray-50 border border-gray-200 shadow-inner text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C001F]" />
                </div>
                <div class="flex flex-col text-center">
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Start Time</label>
                  <input type="time" v-model="startingTime"
                    class="rounded-lg px-2 py-1.5 text-center bg-gray-50 border border-gray-200 shadow-inner text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C001F]" />
                </div>
                <div class="flex flex-col text-center">
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">End Time</label>
                  <input type="time" v-model="endingTime"
                    class="rounded-lg px-2 py-1.5 text-center bg-gray-50 border border-gray-200 shadow-inner text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C001F]" />
                </div>
              </div>

              <!-- Duration -->
              <div class="flex flex-col text-center w-full">
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Duration
                  (Minutes)</label>
                <div class="relative w-full">
                  <input type="number" v-model="meetingDuration"
                    class="rounded-lg px-4 py-1.5 text-center bg-gray-50 border border-gray-200 shadow-inner text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C001F] w-full" />
                  <span
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400 bg-gray-50 pl-1">MINUTES</span>
                </div>
              </div>

              <!-- Constraint Checkboxes -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="avoidWeekend"
                    class="w-4 h-4 text-[#5C001F] accent-[#5C001F] rounded" />
                  <span class="text-xs font-bold text-gray-700">Avoid weekend</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="avoidOffWorkingHour"
                    class="w-4 h-4 text-[#5C001F] accent-[#5C001F] rounded" />
                  <span class="text-xs font-bold text-gray-700">Avoid off-hours</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="avoidLunchHour"
                    class="w-4 h-4 text-[#5C001F] accent-[#5C001F] rounded" />
                  <span class="text-xs font-bold text-gray-700">Avoid lunch</span>
                </label>
              </div>

              <!-- Let AI Decide / Auto-Schedule Section -->
              <div
                class="bg-gradient-to-br from-[#5C001F]/5 to-[#F8BE17]/10 border border-[#5C001F]/20 p-3.5 rounded-2xl shadow-inner flex flex-col gap-2.5">
                <div class="flex items-center gap-1.5 justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#5C001F]" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 class="text-xs font-extrabold text-[#5C001F] uppercase tracking-wider m-0">
                    Let AI decide for all FYP
                  </h3>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div class="flex flex-col text-center">
                    <label class="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">Start Date</label>
                    <input type="date" v-model="startingDate"
                      class="rounded-lg px-2 py-1 text-center bg-white border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C001F] w-full" />
                  </div>
                  <div class="flex flex-col text-center">
                    <label class="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">End Date</label>
                    <input type="date" v-model="endingDate"
                      class="rounded-lg px-2 py-1 text-center bg-white border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C001F] w-full" />
                  </div>
                </div>

                <!-- Allowed Weekdays Selector Row -->
                <div class="flex flex-col gap-1">
                  <label class="text-[9px] font-bold text-gray-500 uppercase tracking-wide text-center">Allowed
                    Days</label>
                  <div class="flex justify-between gap-1 px-1">
                    <button v-for="day in [
                      { label: 'M', value: 1 },
                      { label: 'T', value: 2 },
                      { label: 'W', value: 3 },
                      { label: 'T', value: 4 },
                      { label: 'F', value: 5 },
                      { label: 'S', value: 6 },
                      { label: 'S', value: 7 }
                    ]" :key="day.value" type="button" @click="toggleAllowedDay(day.value)"
                      class="w-6 h-6 rounded-full text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer border"
                      :class="allowedDays.includes(day.value)
                        ? 'bg-[#5C001F] text-[#FFFFAB] border-[#5C001F] shadow-sm'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-[#5C001F]/30'">
                      {{ day.label }}
                    </button>
                  </div>
                </div>

                <button @click="autoScheduleAll" type="button"
                  class="mt-1 bg-gradient-to-r from-[#5C001F] to-[#7a0029] hover:from-[#450017] hover:to-[#5c001f] text-white border-2 border-[#F8BE17] px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:shadow-[0_0_10px_rgba(248,190,23,0.4)] transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#F8BE17]" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Auto Schedule All Presentations</span>
                </button>
              </div>

              <!-- Generate Button -->
              <div class="pt-2">
                <button @click="generateSchedule"
                  class="bg-[#5C001F] hover:bg-[#4a0018] text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-[#5C001F]/20 transition-all active:scale-95 text-xs w-full flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span>Generate Schedule</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- MAIN FULL WIDTH CALENDAR SECTION -->
        <div
          class="w-full flex flex-col gap-4 shadow-xl rounded-2xl overflow-hidden bg-white border border-gray-200 p-4 sm:p-6">
          <!-- Warning Banner if one or more actors have missing timetables -->
          <div v-if="missingActors && missingActors.length > 0"
            class="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm space-y-2">
            <div class="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
              <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0" />
              <span>Warning: Missing Timetable Schedule for FYP Party Member(s)</span>
            </div>
            <p class="text-xs font-semibold text-amber-700 leading-relaxed">
              The following member(s) do not have a configured timetable schedule in the system.
              AI auto-scheduling or manual presentation slot selection may cause unverified conflicts for these users:
            </p>
            <div class="flex flex-wrap gap-2 pt-1">
              <span v-for="actor in missingActors" :key="actor.user_id"
                class="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                <strong>{{ actor.role }}:</strong> {{ actor.email }} (No timetable configured)
              </span>
            </div>
          </div>

          <CalendarSchedule :events="combinedEvents" :hideAddMeetingButton="true" :constraints="{
            avoidWeekend,
            avoidOffWorkingHour,
            avoidLunchHour,
            workingHourStart,
            workingHourEnd,
            lunchHourStart,
            lunchHourEnd,
          }" />
        </div>
      </main>
    </div>
    <AppFooter class="mt-auto -mb-[30px]" />

    <!-- AI Scheduling Loading Overlay -->
    <div v-if="isAutoScheduling"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-all">
      <div
        class="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center border border-gray-100">
        <div class="relative w-24 h-24 mb-6">
          <!-- Outer glowing spinning circle -->
          <div
            class="absolute inset-0 rounded-full border-4 border-t-[#5C001F] border-r-transparent border-b-[#F8BE17] border-l-transparent animate-spin">
          </div>
          <!-- Inner pulsing core -->
          <div
            class="absolute inset-4 rounded-full bg-gradient-to-tr from-[#5C001F] to-[#7a0029] animate-pulse flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#F8BE17] animate-bounce" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <h3 class="text-xl font-extrabold text-[#5C001F] mb-2 uppercase tracking-wider">
          AI Scheduling in Progress
        </h3>
        <p class="text-gray-500 text-sm font-medium leading-relaxed">
          Crosschecking lecturer availability, student classes, and avoiding conflicts...
        </p>
      </div>
    </div>
    <!-- Save Success & Notifications Sent Modal -->
    <div v-if="showSaveSuccessModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 transition-all">
      <div
        class="bg-white rounded-3xl shadow-2xl flex flex-col items-center max-w-lg w-full p-6 sm:p-8 text-center border border-gray-100 relative overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="absolute top-0 left-0 right-0 h-3 bg-[#10b981]"></div>

        <div
          class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-[#10b981] shadow-inner">
          <CheckCircle class="w-10 h-10" />
        </div>

        <h3 class="text-xl font-extrabold text-gray-900 mb-2 uppercase tracking-wider">
          Meetings Saved & Actors Notified!
        </h3>
        <p class="text-gray-600 text-xs font-medium leading-relaxed mb-4">
          All {{ savedNotificationSummary.saved_count }} presentation meeting(s) have been saved to the database. All
          relevant FYP actors have been updated on their personal timetables and notified via in-app notifications and
          email.
        </p>

        <div
          class="w-full bg-gray-50 rounded-2xl p-4 border border-gray-200 text-left max-h-[220px] overflow-y-auto space-y-2 mb-6 shadow-inner">
          <div class="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
            Notified Members Breakdown:
          </div>
          <div v-for="(actor, idx) in savedNotificationSummary.notified_actors" :key="idx"
            class="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#10b981] shrink-0"></span>
              <div>
                <strong class="text-gray-800">{{ actor.role }}:</strong>
                <span class="text-gray-600 ml-1">{{ actor.email }}</span>
              </div>
            </div>
            <span
              class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
              Notified ✉️
            </span>
          </div>
        </div>

        <button @click="showSaveSuccessModal = false"
          class="bg-[#5C001F] hover:bg-[#4a0018] text-white font-bold text-xs px-6 py-3 rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer w-full">
          Got it, Close
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
