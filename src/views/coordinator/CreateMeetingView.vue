<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import { useCalendarStore } from '@/stores/calendarStore'
import fypMockData from '../../../localData/fyp_mock_structure.json'
import CalendarSchedule from '@/components/calendar_components/CalendarSchedule.vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'

const calendarStore = useCalendarStore()

onMounted(() => {
  if (calendarStore.availableSchedules.lecturers.length === 0) {
    calendarStore.fetchActiveSession()
  }
})

const selectedProjectId = ref(null)
const displayedEvents = ref([])

// Watch for project selection and fetch actual crosscheck schedule data from backend
watch(selectedProjectId, async (newProjectId) => {
  if (!newProjectId) {
    displayedEvents.value = []
    return
  }

  const project = fypMockData.find(p => p.project_id === newProjectId)
  if (!project) {
    displayedEvents.value = []
    return
  }

  const userIds = [project.supervisor.user_id]
  if (project.examiners) {
    project.examiners.forEach(ex => userIds.push(ex.user_id))
  }

  try {
    const response = await axios.post('http://localhost:3000/api/timetable/crosscheck', {
      fyp_session_id: project.fyp_session_id,
      class_id: project.student?.class_id,
      user_ids: userIds
    })
    
    if (response.data && response.data.status === 'success') {
      displayedEvents.value = response.data.data.occupied_events
    } else {
      displayedEvents.value = []
    }
  } catch (err) {
    console.error("Failed to crosscheck timetable:", err)
    displayedEvents.value = []
  }
})

const startingDate = ref('2026-06-28')
const endingDate = ref('2026-06-28')
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

const generateSchedule = () => {
  console.log('Generate meeting schedule clicked')
}
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
      <main class="flex-1 flex flex-col px-[50px] py-[30px] gap-6 overflow-y-auto">
        
        <!-- Breadcrumbs -->
        <div class="text-[#5c001f] text-sm mb-4">
          <span class="hover:underline cursor-pointer" @click="$router.push('/calendar')">View Calendar</span> &gt; 
          <span class="font-bold underline">Add new meeting</span>
        </div>

        <div class="flex flex-1 gap-6 w-full">
          <!-- LEFT COLUMN: Projects & Constraints -->
          <div class="w-1/4 flex flex-col gap-6 shrink-0">
            <!-- FYP Projects Card -->
            <div class="flex flex-col h-1/2 min-h-[300px]">
              <div class="bg-[#FFFFAB] p-4 font-extrabold text-[#5C001F] text-xl tracking-wider rounded-t-lg shadow-sm border-b-2 border-gray-200">
                FYP PROJECTS
              </div>
              <div class="flex flex-col gap-4 bg-[#FFFFAB]/80 p-4 flex-1 rounded-b-lg shadow-sm overflow-y-auto">
                <label 
                  v-for="project in fypMockData" 
                  :key="project.project_id"
                  class="bg-white p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border border-gray-200 relative min-h-[120px] shrink-0"
                  :class="{'ring-2 ring-[#5C001F] bg-[#fff5f7] border-[#5C001F]/30': selectedProjectId === project.project_id}"
                >
                  <div class="flex flex-col gap-1 pr-8">
                    <span class="font-bold text-[#5C001F]">{{ project.fyp_title }}</span>
                    <span class="text-xs font-semibold text-gray-700 mt-2 uppercase tracking-wide">STUDENT</span>
                    <span class="text-sm text-gray-800">{{ project.student.full_name }}</span>
                    <div class="flex items-center gap-1 mt-1">
                      <span class="text-[10px] font-bold text-gray-500 uppercase">SV:</span>
                      <span class="text-xs font-medium text-gray-600">{{ project.supervisor.email }}</span>
                    </div>
                  </div>
                  <input 
                    type="radio" 
                    name="project" 
                    :value="project.project_id" 
                    v-model="selectedProjectId"
                    class="w-5 h-5 absolute right-4 cursor-pointer accent-[#5c001f]"
                  />
                </label>
              </div>
            </div>
          </div>

          <!-- Middle: Calendar Component (Sidebar removed) -->
          <div class="flex-1 flex flex-col shadow-lg rounded-xl overflow-hidden bg-white min-w-0 border border-gray-100">
            <!-- Render empty state if no project selected, otherwise show events and hide the native Add Meeting button -->
            <CalendarSchedule 
              :events="displayedEvents" 
              :hideAddMeetingButton="true"
              :constraints="{ avoidWeekend, avoidOffWorkingHour, avoidLunchHour, workingHourStart, workingHourEnd, lunchHourStart, lunchHourEnd }"
            />
          </div>

          <!-- Right Sidebar: Meeting Settings -->
          <div class="w-1/4 bg-white border-2 border-[#5C001F]/20 p-6 rounded-[2rem] shadow-xl flex flex-col gap-6 shrink-0 relative overflow-hidden">
            <!-- Decorative Header Accent -->
            <div class="absolute top-0 left-0 right-0 h-3 bg-[#5C001F]"></div>
            
            <h2 class="text-xl font-extrabold text-[#5C001F] mb-1 uppercase tracking-wider text-center mt-2">Meeting Settings</h2>
            
            <div class="h-px w-full bg-gray-100 mb-2"></div>

            <!-- Date Settings -->
            <div class="flex items-center justify-between gap-3">
              <div class="flex flex-col flex-1 text-center min-w-0">
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Start Date</label>
                <input type="date" v-model="startingDate" class="rounded-lg px-2 py-2 text-center bg-gray-50 border border-gray-200 shadow-inner text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5C001F]/50 focus:border-[#5C001F] w-full transition-all" />
              </div>
              <span class="font-bold text-gray-300 mt-5">-</span>
              <div class="flex flex-col flex-1 text-center min-w-0">
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">End Date</label>
                <input type="date" v-model="endingDate" class="rounded-lg px-2 py-2 text-center bg-gray-50 border border-gray-200 shadow-inner text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5C001F]/50 focus:border-[#5C001F] w-full transition-all" />
              </div>
            </div>

            <!-- Time Settings -->
            <div class="flex items-center justify-between gap-3">
              <div class="flex flex-col flex-1 text-center min-w-0">
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Start Time</label>
                <input type="time" v-model="startingTime" class="rounded-lg px-2 py-2 text-center bg-gray-50 border border-gray-200 shadow-inner text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5C001F]/50 focus:border-[#5C001F] w-full transition-all" />
              </div>
              <span class="font-bold text-gray-300 mt-5">-</span>
              <div class="flex flex-col flex-1 text-center min-w-0">
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">End Time</label>
                <input type="time" v-model="endingTime" class="rounded-lg px-2 py-2 text-center bg-gray-50 border border-gray-200 shadow-inner text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5C001F]/50 focus:border-[#5C001F] w-full transition-all" />
              </div>
            </div>

            <!-- Duration -->
            <div class="flex flex-col text-center w-full">
              <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Duration</label>
              <div class="relative w-full">
                <input type="number" v-model="meetingDuration" class="rounded-lg px-4 py-2 text-center bg-gray-50 border border-gray-200 shadow-inner text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5C001F]/50 focus:border-[#5C001F] w-full pr-16 transition-all" />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 bg-gray-50 pl-2">MINUTES</span>
              </div>
            </div>

            <div class="h-px w-full bg-gray-100 my-1"></div>

            <!-- Checkboxes -->
            <div class="flex flex-col gap-4 px-2">
              <label class="flex items-center gap-4 cursor-pointer group">
                <input type="checkbox" v-model="avoidWeekend" class="w-5 h-5 border-2 border-gray-300 rounded appearance-none checked:border-[#5C001F] checked:bg-[#5C001F] checked:after:content-['✓'] checked:after:text-white checked:after:absolute checked:after:left-[3px] checked:after:top-[0px] checked:after:text-sm relative flex items-center justify-center cursor-pointer shrink-0 transition-colors shadow-sm group-hover:border-[#5C001F]/50" />
                <span class="text-sm font-bold text-gray-700 group-hover:text-[#5C001F] transition-colors">Avoid weekend</span>
              </label>

              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-4 cursor-pointer group">
                  <input type="checkbox" v-model="avoidOffWorkingHour" class="w-5 h-5 border-2 border-gray-300 rounded appearance-none checked:border-[#5C001F] checked:bg-[#5C001F] checked:after:content-['✓'] checked:after:text-white checked:after:absolute checked:after:left-[3px] checked:after:top-[0px] checked:after:text-sm relative flex items-center justify-center cursor-pointer shrink-0 transition-colors shadow-sm group-hover:border-[#5C001F]/50" />
                  <span class="text-sm font-bold text-gray-700 group-hover:text-[#5C001F] transition-colors">Avoid off-working hours</span>
                </label>
                <p class="text-xs text-gray-500 font-medium pl-9 -mt-2">Time for working duration</p>
                <div v-if="avoidOffWorkingHour" class="flex items-center gap-2 pl-9">
                  <div class="flex flex-col flex-1 min-w-0">
                    <input type="time" v-model="workingHourStart" class="rounded-lg px-2 py-1.5 text-center bg-gray-50 border border-gray-200 shadow-inner text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5C001F]/50 focus:border-[#5C001F] w-full transition-all" />
                  </div>
                  <span class="text-xs font-bold text-gray-400">-</span>
                  <div class="flex flex-col flex-1 min-w-0">
                    <input type="time" v-model="workingHourEnd" class="rounded-lg px-2 py-1.5 text-center bg-gray-50 border border-gray-200 shadow-inner text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5C001F]/50 focus:border-[#5C001F] w-full transition-all" />
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-4 cursor-pointer group">
                  <input type="checkbox" v-model="avoidLunchHour" class="w-5 h-5 border-2 border-gray-300 rounded appearance-none checked:border-[#5C001F] checked:bg-[#5C001F] checked:after:content-['✓'] checked:after:text-white checked:after:absolute checked:after:left-[3px] checked:after:top-[0px] checked:after:text-sm relative flex items-center justify-center cursor-pointer shrink-0 transition-colors shadow-sm group-hover:border-[#5C001F]/50" />
                  <span class="text-sm font-bold text-gray-700 group-hover:text-[#5C001F] transition-colors">Avoid lunch hour</span>
                </label>
                <div v-if="avoidLunchHour" class="flex items-center gap-2 pl-9">
                  <div class="flex flex-col flex-1 min-w-0">
                    <input type="time" v-model="lunchHourStart" class="rounded-lg px-2 py-1.5 text-center bg-gray-50 border border-gray-200 shadow-inner text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5C001F]/50 focus:border-[#5C001F] w-full transition-all" />
                  </div>
                  <span class="text-xs font-bold text-gray-400">-</span>
                  <div class="flex flex-col flex-1 min-w-0">
                    <input type="time" v-model="lunchHourEnd" class="rounded-lg px-2 py-1.5 text-center bg-gray-50 border border-gray-200 shadow-inner text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5C001F]/50 focus:border-[#5C001F] w-full transition-all" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Generate Button -->
            <div class="mt-auto pt-6 pb-2">
              <button @click="generateSchedule" class="bg-[#5C001F] hover:bg-[#4a0018] text-white px-4 py-3.5 rounded-xl font-bold shadow-lg shadow-[#5C001F]/20 transition-all active:scale-95 text-sm w-full flex items-center justify-center gap-2 uppercase tracking-wide">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                Generate Schedule
              </button>
            </div>
          </div>
        </div>
        
      </main>
    </div>
    <AppFooter class="mt-auto -mb-[30px]" />
  </div>
</template>

<style scoped>
</style>
