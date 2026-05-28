<template>
  <div class="flex flex-col lg:flex-row gap-6 h-full min-h-[800px] w-full font-sans">
    
    <!-- 1. LEFT SIDEBAR (FILTERS) -->
    <aside class="w-full lg:w-80 flex flex-col bg-[#FFFFAB] border border-gray-200 rounded-xl overflow-hidden shrink-0 relative shadow-sm">
      <!-- Sidebar Header -->
      <div class="p-6 pb-2">
        <h2 class="text-xl font-bold text-[#5C001E] leading-tight">
          Lecturer/section<br />schedule
        </h2>
      </div>

      <!-- Accordion Area (Scrollable) -->
      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        
        <!-- Accordion 1: STUDENT SCHEDULES (Lecturers) -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <button 
            @click="accordions.lecturers = !accordions.lecturers"
            class="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors"
          >
            <span class="text-xs font-bold text-gray-800 tracking-wider">STUDENT SCHEDULES</span>
            <svg 
              class="w-4 h-4 text-gray-600 transition-transform duration-200" 
              :class="{ 'rotate-180': accordions.lecturers }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div v-show="accordions.lecturers" class="border-t border-gray-100 p-3 space-y-3">
            <div class="text-xs font-semibold text-gray-500 mb-2">sample:</div>
            
            <!-- Lecturer Item 1 -->
            <label class="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                v-model="selectedSchedules"
                value="lecturer1"
                class="mt-1 w-4 h-4 text-[#5C001E] rounded border-gray-300 focus:ring-[#5C001E] cursor-pointer"
              />
              <div class="flex items-center gap-2">
                <!-- Color Indicator -->
                <div class="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" :style="{ backgroundColor: colorMap.lecturer1 }"></div>
                <!-- Avatar Mock -->
                <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  <svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs font-medium text-gray-900">User1@graduate.utm.my</span>
                  <span class="text-xs text-gray-500">(Lecturer 1)</span>
                </div>
              </div>
            </label>

            <!-- Lecturer Item 2 -->
            <label class="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                v-model="selectedSchedules"
                value="lecturer2"
                class="mt-1 w-4 h-4 text-[#5C001E] rounded border-gray-300 focus:ring-[#5C001E] cursor-pointer"
              />
              <div class="flex items-center gap-2">
                <!-- Color Indicator -->
                <div class="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" :style="{ backgroundColor: colorMap.lecturer2 }"></div>
                <!-- Avatar Mock -->
                <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  <svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs font-medium text-gray-900">User2@graduate.utm.my</span>
                  <span class="text-xs text-gray-500">(Lecturer 2)</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Accordion 2: CLASS SECTIONS -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <button 
            @click="accordions.classes = !accordions.classes"
            class="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors"
          >
            <span class="text-xs font-bold text-gray-800 tracking-wider">CLASS SECTIONS</span>
            <svg 
              class="w-4 h-4 text-gray-600 transition-transform duration-200" 
              :class="{ 'rotate-180': accordions.classes }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div v-show="accordions.classes" class="border-t border-gray-100 p-3 space-y-3">
            <div class="text-xs font-semibold text-gray-500 mb-2">sample:</div>
            
            <!-- Class Item 1 -->
            <label class="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                v-model="selectedSchedules"
                value="class15"
                class="w-4 h-4 text-[#5C001E] rounded border-gray-300 focus:ring-[#5C001E] cursor-pointer"
              />
              <div class="flex items-center gap-2 text-gray-700">
                <!-- Color Indicator -->
                <div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: colorMap.class15 }"></div>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span class="text-sm font-medium">Class Section 15</span>
              </div>
            </label>
          </div>
        </div>

      </div>

      <!-- Action Buttons -->
      <div class="p-4 flex flex-col gap-2 mt-auto border-t border-[#d6d68b]">
        <router-link to="/add-time-table" class="w-full bg-[#5C001E] hover:bg-[#4a0018] text-white font-bold py-3 rounded-md shadow text-xs transition-colors flex justify-center items-center gap-2">
          <span>+</span> Add new time table
        </router-link>
      </div>
    </aside>

    <!-- 2. MAIN CONTENT (CALENDAR) -->
    <div class="flex-1 min-w-0">
      <CalendarSchedule :events="visibleEvents" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CalendarSchedule from '@/components/CalendarSchedule.vue'

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
})

// --- ACCORDION STATE ---
const accordions = ref({
  lecturers: true,
  classes: true
})

// --- STATE MANAGEMENT: Sidebar Checkboxes ---
const selectedSchedules = ref([])

// Map to assign distinct colors to each filter option
const colorMap = {
  lecturer1: '#3b82f6', // blue
  lecturer2: '#10b981', // green
  class15: '#f59e0b'    // orange
}

// Since the JSON data doesn't have an owner field, we simulate it deterministically 
// based on the event's title so the filtering looks realistic and stable.
const getMockOwner = (event) => {
  const owners = ['lecturer1', 'lecturer2', 'class15']
  const hash = event.title.length + (event.start_time ? event.start_time.length : 0)
  return owners[hash % 3]
}

// Filter logic
const visibleEvents = computed(() => {
  if (selectedSchedules.value.length === 0) return []
  
  return props.events
    .map(event => {
      const owner = getMockOwner(event)
      return { ...event, owner, color: colorMap[owner] }
    })
    .filter(event => selectedSchedules.value.includes(event.owner))
})
</script>
