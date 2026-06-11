<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppHeader from '@/components/common_components/AppHeader.vue'
import AppSidebar from '@/components/common_components/AppSidebar.vue'
import AppFooter from '@/components/common_components/AppFooter.vue'
import { apiService } from '@/services/api'

const { user } = useAuth()
const router = useRouter()
const route = useRoute()

const userId = route.params.id
const userData = ref(null)
const userRole = ref('')
const isLoading = ref(true)
const errorMessage = ref('')

// Helper to format MySQL date strings to a readable format
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(async () => {
  if (!user.value || Number(user.value.is_coordinator) !== 1) {
    isLoading.value = false
    return
  }

  try {
    const res = await apiService.getUserDetail(userId)
    userData.value = res.data
    userRole.value = res.role
  } catch (err) {
    console.error('Failed to load user details:', err)
    errorMessage.value = err.response?.data?.error || 'Failed to retrieve user details.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black">
    <AppHeader />

    <!-- Access Control Check -->
    <div
      v-if="!user || Number(user.is_coordinator) !== 1"
      class="flex-1 flex flex-col items-center justify-center text-center px-4"
    >
      <h1 class="text-4xl font-bold text-[#5c001f] mb-4">Access Restricted</h1>
      <p class="text-xl text-gray-700 mb-6">
        You do not have coordinator permissions to view user accounts.
      </p>
      <button
        @click="router.push('/dashboard')"
        class="bg-[#5c001f] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#4a0019] transition-all shadow-md"
      >
        Go to Dashboard
      </button>
    </div>

    <div v-else class="flex flex-1 w-full relative">
      <AppSidebar />

      <main class="flex-1 flex flex-col px-[50px] py-[30px] overflow-y-auto">
        <!-- Breadcrumbs -->
        <div class="text-[#5c001f] text-sm mb-4">
          <span class="hover:underline cursor-pointer" @click="router.push('/manage-user')">
            Manage User
          </span>
          <span class="mx-2">&gt;</span>
          <span class="font-bold underline">View User Details</span>
        </div>

        <!-- Main Content Area -->
        <div class="flex flex-col gap-6 max-w-5xl w-full">
          <!-- Loading State -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 bg-white border border-gray-300 rounded-2xl shadow-sm">
            <div class="w-12 h-12 border-4 border-gray-200 border-t-[#5c001f] rounded-full animate-spin"></div>
            <p class="mt-4 text-gray-600 font-semibold">Loading user details...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
            <svg class="w-16 h-16 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 class="text-xl font-bold text-red-800 mb-2">Error Loading User</h3>
            <p class="text-red-600 text-center mb-4">{{ errorMessage }}</p>
            <button
              @click="router.push('/manage-user')"
              class="bg-gray-800 text-white px-5 py-2 rounded-lg font-bold hover:bg-gray-700 transition"
            >
              Back to User Directory
            </button>
          </div>

          <!-- User Data Display -->
          <template v-else-if="userData">
            <!-- Header Profile card -->
            <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row items-center p-6 gap-6 relative">
              <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#5c001f] to-blue-800"></div>
              
              <!-- Avatar Placeholder -->
              <div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 text-3xl font-bold text-gray-700 uppercase">
                {{ userData.full_name?.charAt(0) || 'U' }}
              </div>

              <!-- General Info -->
              <div class="flex-1 flex flex-col gap-1 text-center md:text-left">
                <div class="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 class="text-2xl font-bold text-black">{{ userData.full_name }}</h2>
                  <!-- Role Badges -->
                  <span
                    v-if="userRole === 'student'"
                    class="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase"
                  >
                    Student
                  </span>
                  <span
                    v-else-if="userRole === 'lecturer'"
                    class="bg-maroon-light text-[#5c001f] bg-[#5c001f]/10 text-xs font-bold px-2.5 py-1 rounded-full uppercase"
                  >
                    UTM Staff / Lecturer
                  </span>
                  <span
                    v-else
                    class="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase"
                  >
                    Outsider / Industry Partner
                  </span>
                </div>
                <p class="text-gray-500">{{ userData.email }}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                  <span>Registered: {{ formatDate(userData.date_created) }}</span>
                  <span class="hidden sm:inline">|</span>
                  <span>Last Login: {{ formatDate(userData.last_date_login) }}</span>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="flex gap-2">
                <button
                  @click="router.push('/manage-user')"
                  class="px-5 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Back
                </button>
              </div>
            </div>

            <!-- Profile Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <!-- Left Details Panel (General Info) -->
              <div class="md:col-span-1 flex flex-col gap-6">
                <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
                  <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Contact Profile
                  </h3>
                  
                  <div class="flex flex-col gap-4 text-sm">
                    <div>
                      <span class="text-gray-400 block mb-0.5">Full Name</span>
                      <span class="font-medium">{{ userData.full_name }}</span>
                    </div>
                    <div>
                      <span class="text-gray-400 block mb-0.5">Email Address</span>
                      <span class="font-medium text-blue-600 break-all">{{ userData.email }}</span>
                    </div>
                    <div>
                      <span class="text-gray-400 block mb-0.5">Phone Number</span>
                      <span class="font-medium">{{ userData.phone_number || '-' }}</span>
                    </div>
                    <div v-if="userData.affiliation">
                      <span class="text-gray-400 block mb-0.5">Affiliation</span>
                      <span class="font-medium">{{ userData.affiliation }}</span>
                    </div>
                    <div v-if="userData.co_org_name">
                      <span class="text-gray-400 block mb-0.5">Organization</span>
                      <span class="font-medium">{{ userData.co_org_name }}</span>
                    </div>
                    <div v-if="userData.expertise">
                      <span class="text-gray-400 block mb-0.5">Expertise</span>
                      <span class="font-medium">{{ userData.expertise }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Detail Panels (Role specific) -->
              <div class="md:col-span-2 flex flex-col gap-6">
                
                <!-- STUDENT SPECIFIC PANELS -->
                <template v-if="userRole === 'student'">
                  <!-- Academic details -->
                  <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
                    <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Academic Record
                    </h3>
                    
                    <div class="grid grid-cols-2 gap-6 text-sm">
                      <div>
                        <span class="text-gray-400 block mb-0.5">Metric Number</span>
                        <span class="font-semibold text-lg text-gray-800">{{ userData.metric_number }}</span>
                      </div>
                      <div>
                        <span class="text-gray-400 block mb-0.5">Section / Class</span>
                        <span class="font-semibold text-lg text-gray-800">{{ userData.section_name || 'Unassigned' }}</span>
                      </div>
                      <div>
                        <span class="text-gray-400 block mb-0.5">CGPA</span>
                        <span class="font-semibold text-lg text-gray-800">{{ userData.CGPA || '-' }}</span>
                      </div>
                      <div>
                        <span class="text-gray-400 block mb-0.5">GPA</span>
                        <span class="font-semibold text-lg text-gray-800">{{ userData.GPA || '-' }}</span>
                      </div>
                      <div>
                        <span class="text-gray-400 block mb-0.5">Credit Hours Completed</span>
                        <span class="font-semibold text-lg text-gray-800">{{ userData.credit_hours_completed }} hrs</span>
                      </div>
                      <div>
                        <span class="text-gray-400 block mb-0.5">Proof of Credit Hours</span>
                        <a
                          v-if="userData.proof_of_credit_hours"
                          :href="userData.proof_of_credit_hours"
                          target="_blank"
                          class="text-blue-600 font-medium hover:underline inline-flex items-center gap-1"
                        >
                          View Attachment
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <span v-else class="text-gray-500">Not Uploaded</span>
                      </div>
                    </div>
                  </div>

                  <!-- FYP details -->
                  <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
                    <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Final Year Project (FYP)
                    </h3>

                    <div v-if="userData.project_id" class="flex flex-col gap-4 text-sm">
                      <div class="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span class="text-gray-400 block mb-0.5">Project Title</span>
                          <span class="font-bold text-gray-800 text-lg leading-snug">{{ userData.project_title }}</span>
                        </div>
                        <span
                          class="px-2.5 py-1 text-xs font-bold uppercase rounded-full"
                          :class="{
                            'bg-green-100 text-green-800': userData.project_status?.toLowerCase() === 'approved',
                            'bg-yellow-100 text-yellow-800': userData.project_status?.toLowerCase() === 'pending',
                            'bg-red-100 text-red-800': userData.project_status?.toLowerCase() === 'rejected'
                          }"
                        >
                          {{ userData.project_status || 'Pending' }}
                        </span>
                      </div>

                      <div>
                        <span class="text-gray-400 block mb-0.5">Project Description</span>
                        <p class="text-gray-600 whitespace-pre-line leading-relaxed">{{ userData.project_description || 'No description provided.' }}</p>
                      </div>

                      <div class="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <span class="text-gray-400 block mb-0.5">Supervisor</span>
                          <span class="font-semibold text-gray-700">{{ userData.supervisor_name || 'Not assigned' }}</span>
                        </div>
                        <div>
                          <span class="text-gray-400 block mb-0.5">FYP Session</span>
                          <span class="font-semibold text-gray-700">Session {{ userData.project_fyp_session_id }}</span>
                        </div>
                      </div>

                      <div class="flex gap-4 pt-3">
                        <a
                          v-if="userData.project_github"
                          :href="userData.project_github"
                          target="_blank"
                          class="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                          GitHub Repository
                        </a>
                        <a
                          v-if="userData.project_drive"
                          :href="userData.project_drive"
                          target="_blank"
                          class="px-4 py-2 bg-blue-800 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                          Shared Folder / Drive
                        </a>
                      </div>
                    </div>

                    <div v-else class="text-center py-6 text-gray-500">
                      No active FYP Project connected to this student yet.
                    </div>
                  </div>
                </template>

                <!-- LECTURER / UTM STAFF SPECIFIC PANELS -->
                <template v-else-if="userRole === 'lecturer'">
                  <!-- Academic & research profile -->
                  <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
                    <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Academic & Research Profile
                    </h3>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                      <div>
                        <span class="text-gray-400 block mb-0.5">Faculty / Institution</span>
                        <span class="font-medium text-gray-800">{{ userData.affiliation || 'Universiti Teknologi Malaysia (UTM)' }}</span>
                      </div>
                      <div>
                        <span class="text-gray-400 block mb-0.5">Expertise / Research Area</span>
                        <span class="font-medium text-gray-800">{{ userData.expertise || userData.research_expertise || '-' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Supervisor capacity profile -->
                  <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
                    <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Supervisor Capacity Profile
                    </h3>

                    <div v-if="Number(userData.is_supervisor) === 1" class="grid grid-cols-3 gap-6 text-center text-sm">
                      <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <span class="text-gray-400 block mb-1">Students Capacity</span>
                        <span class="font-bold text-2xl text-gray-800">{{ userData.sv_capacity || 0 }}</span>
                      </div>
                      <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <span class="text-gray-400 block mb-1">Current Capacity</span>
                        <span class="font-bold text-2xl text-blue-800">{{ userData.current_capacity || 0 }}</span>
                      </div>
                      <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <span class="text-gray-400 block mb-1">Status</span>
                        <span 
                          class="font-bold text-sm block mt-1.5 uppercase"
                          :class="(userData.current_capacity || 0) >= (userData.sv_capacity || 0) ? 'text-red-600' : 'text-green-600'"
                        >
                          {{ (userData.current_capacity || 0) >= (userData.sv_capacity || 0) ? 'Full' : 'Available' }}
                        </span>
                      </div>
                      
                      <div class="col-span-3 text-left pt-2">
                        <span class="text-gray-400 block mb-0.5">Research Expertise Details</span>
                        <p class="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">{{ userData.research_expertise || 'Not specified' }}</p>
                      </div>
                    </div>

                    <div v-else class="text-center py-6 text-gray-500">
                      This UTM Staff is not registered as an active FYP Supervisor.
                    </div>
                  </div>

                  <!-- Examiner profile -->
                  <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
                    <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Examiner Profile
                    </h3>

                    <div v-if="Number(userData.is_examiner) === 1" class="text-sm flex flex-col gap-3">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        <span class="font-bold text-gray-700">Active FYP Examiner</span>
                      </div>
                      <div v-if="userData.industry_background">
                        <span class="text-gray-400 block mb-0.5">Background Experience</span>
                        <p class="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{{ userData.industry_background }}</p>
                      </div>
                    </div>

                    <div v-else class="text-center py-6 text-gray-500">
                      This UTM Staff is not registered as an active FYP Examiner.
                    </div>
                  </div>
                </template>

                <!-- OUTSIDER SPECIFIC PANELS -->
                <template v-else>
                  <!-- Industry profile -->
                  <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
                    <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Industry Profile Details
                    </h3>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                      <div>
                        <span class="text-gray-400 block mb-0.5">Co-Organization / Company</span>
                        <span class="font-semibold text-lg text-gray-800">{{ userData.co_org_name || '-' }}</span>
                      </div>
                      <div>
                        <span class="text-gray-400 block mb-0.5">Professional Affiliation</span>
                        <span class="font-medium text-gray-800">{{ userData.affiliation || '-' }}</span>
                      </div>
                      <div class="sm:col-span-2">
                        <span class="text-gray-400 block mb-0.5">Areas of Expertise</span>
                        <p class="text-gray-700 font-medium">{{ userData.expertise || '-' }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Examiner profile -->
                  <div class="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
                    <h3 class="text-lg font-bold text-[#5c001f] border-b pb-3 mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Industry Examiner Status
                    </h3>

                    <div v-if="Number(userData.is_examiner) === 1" class="text-sm flex flex-col gap-3">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        <span class="font-bold text-gray-700">Active External Examiner</span>
                      </div>
                      <div v-if="userData.industry_background">
                        <span class="text-gray-400 block mb-0.5">Industry Background Details</span>
                        <p class="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{{ userData.industry_background }}</p>
                      </div>
                    </div>

                    <div v-else class="text-center py-6 text-gray-500">
                      This user is not registered as an external FYP Examiner.
                    </div>
                  </div>
                </template>

              </div>
            </div>
          </template>
        </div>
      </main>
    </div>
    <AppFooter />
  </div>
</template>

<style scoped>
.bg-maroon-light {
  background-color: rgba(92, 0, 31, 0.1);
}
</style>
