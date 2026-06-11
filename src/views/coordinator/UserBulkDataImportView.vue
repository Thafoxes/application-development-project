<script setup>
import { ref, computed } from 'vue'
import AppHeader from '../../components/common_components/AppHeader.vue'
import AppFooter from '../../components/common_components/AppFooter.vue'
import AppSidebar from '../../components/common_components/AppSidebar.vue'

const isSidebarVisible = ref(true)

// --- Reactive State ---
const rawImportedRows = ref([])
const searchQuery = ref('')
const activeTab = ref('students')

// --- Mock Data Generator (15 records) ---
const triggerSimulation = () => {
  rawImportedRows.value = [
    {
      id: 1,
      name: 'Ahmad Faiz',
      email: 'ahmad@graduate.utm.my',
      identifier: 'MC220101',
      status: 'ready',
    },
    {
      id: 2,
      name: 'Siti Nurhaliza',
      email: 'siti@graduate.utm.my',
      identifier: 'MC220102',
      status: 'ready',
    },
    { id: 3, name: 'John Doe', email: 'johndoe@utm.my', identifier: 'ST0012', status: 'ready' },
    { id: 4, name: 'Jane Smith', email: 'jane.smith@utm.my', identifier: '', status: 'warning' },
    {
      id: 5,
      name: 'Ali Bin Abu',
      email: 'ali@graduate.utm.my',
      identifier: 'MC220103',
      status: 'ready',
    },
    { id: 6, name: 'Muthu Kumar', email: 'muthu@gmail.com', identifier: 'EXT001', status: 'ready' },
    { id: 7, name: 'Sarah Lee', email: 'sarah.lee@utm.my', identifier: 'ST0014', status: 'ready' },
    {
      id: 8,
      name: 'Wong Wei',
      email: 'wong.wei@graduate.utm.my',
      identifier: '',
      status: 'warning',
    },
    {
      id: 9,
      name: 'Fatima Zahra',
      email: 'fatima@graduate.utm.my',
      identifier: 'MC220105',
      status: 'ready',
    },
    {
      id: 10,
      name: 'Robert Chen',
      email: 'robert@company.com',
      identifier: 'CORP101',
      status: 'ready',
    },
    { id: 11, name: 'Dr. Zulkifli', email: 'zul@utm.my', identifier: 'ST0015', status: 'ready' },
    {
      id: 12,
      name: 'Aisyah',
      email: 'aisyah@graduate.utm.my',
      identifier: 'MC220106',
      status: 'ready',
    },
    { id: 13, name: 'Kumar', email: 'kumar@utm.my', identifier: 'ST0016', status: 'ready' },
    { id: 14, name: 'Elena', email: 'elena@external.org', identifier: '', status: 'warning' },
    {
      id: 15,
      name: 'Raju',
      email: 'raju@graduate.utm.my',
      identifier: 'MC220107',
      status: 'ready',
    },
  ]
}

// --- Regex Expressions ---
const studentRegex = /^[a-zA-Z0-9._%+-]+@graduate\.utm\.my$/
const staffRegex = /^[a-zA-Z0-9._%+-]+@utm\.my$/
const generalEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// --- Filter Arrays via Computed Matrix ---
const studentsData = computed(() => {
  return rawImportedRows.value.filter((row) => studentRegex.test(row.email))
})

const utmStaffData = computed(() => {
  return rawImportedRows.value.filter((row) => staffRegex.test(row.email))
})

const normalUsersData = computed(() => {
  return rawImportedRows.value.filter(
    (row) =>
      !studentRegex.test(row.email) &&
      !staffRegex.test(row.email) &&
      generalEmailRegex.test(row.email),
  )
})

// --- Instant Substring Filtering ---
const filterBySearch = (dataArray) => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return dataArray
  return dataArray.filter(
    (row) => row.name.toLowerCase().includes(query) || row.email.toLowerCase().includes(query),
  )
}

const filteredStudents = computed(() => filterBySearch(studentsData.value))
const filteredStaff = computed(() => filterBySearch(utmStaffData.value))
const filteredNormal = computed(() => filterBySearch(normalUsersData.value))

const currentViewData = computed(() => {
  if (activeTab.value === 'students') return filteredStudents.value
  if (activeTab.value === 'staff') return filteredStaff.value
  if (activeTab.value === 'external') return filteredNormal.value
  return []
})

// --- Action Listeners ---
const handleConfirm = () => {
  alert(
    `Bulk Import Breakdown Sync:\n` +
      `- Students: ${studentsData.value.length}\n` +
      `- UTM Staff: ${utmStaffData.value.length}\n` +
      `- External Users: ${normalUsersData.value.length}\n\n` +
      `Total Staged: ${rawImportedRows.value.length}`,
  )
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-between">
    <!-- 1. Absolute Top Header -->
    <AppHeader />

    <!-- Split View Layout for Sidebar -->
    <div class="flex flex-1 w-full relative">
      <!-- Reusable Dynamic Sidebar with toggle state -->
      <AppSidebar v-if="isSidebarVisible" />

      <!-- Main Content Container with Toggle button -->
      <div class="flex-grow flex flex-col overflow-y-auto">
        <main class="flex-grow flex flex-col max-w-7xl mx-auto w-full px-8 py-6 space-y-6 mb-4">
          <!-- 2. Breadcrumbs & Interface Headings -->
          <div class="flex items-center justify-between w-full">
            <nav class="text-sm font-semibold tracking-wide flex items-center space-x-1">
              <router-link
                to="/dashboard"
                class="text-[#5C001F] hover:text-[#4A0019] transition-colors"
                >Dashboard</router-link
              >
              <span class="text-gray-400 font-normal">&gt;</span>
              <span class="text-[#5C001F]/70">Bulk Import Users</span>
            </nav>

            <!-- Sidebar Toggle Button -->
            <button
              @click="isSidebarVisible = !isSidebarVisible"
              class="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-xs font-semibold text-gray-700 focus:outline-none"
            >
              <svg
                class="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
              <span>{{ isSidebarVisible ? 'Hide Sidebar' : 'Show Sidebar' }}</span>
            </button>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h1 class="text-3xl font-bold text-gray-900 tracking-tight">User Data Ingestion Hub</h1>
          </div>

          <!-- 3. Notice Bar -->
          <div
            class="bg-amber-50 text-amber-900 border border-amber-200 p-3 rounded-lg text-sm flex items-center space-x-3 shadow-sm"
          >
            <svg
              class="w-5 h-5 text-amber-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span class="font-medium"
              >File processed entirely in client-side memory. Grid validation flags are live.</span
            >
          </div>

          <!-- 3. File Interception Dropzone -->
          <div
            @click="triggerSimulation"
            class="border-2 border-dashed border-gray-300 bg-white hover:border-[#5C001F] hover:bg-gray-50 transition-all duration-300 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer group shadow-sm"
          >
            <svg
              class="w-16 h-16 text-gray-300 group-hover:text-[#5C001F] mb-4 transition-colors duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            <p class="text-gray-700 font-semibold text-lg">
              Click or Drag to Upload Target Target Data File
            </p>
            <p class="text-gray-400 text-sm mt-2 font-medium">
              Click to execute simulation hook (seeds 15 records)
            </p>
          </div>

          <!-- 5. Shadcn-Vue style Tab Panel Nav Matrix & Data Tables -->
          <div
            class="bg-white rounded-xl shadow-sm border border-gray-200 flex-grow flex flex-col overflow-hidden"
          >
            <!-- Tab Headers -->
            <div class="border-b border-gray-200 px-6 flex space-x-8 bg-gray-50/30">
              <button
                @click="activeTab = 'students'"
                :class="[
                  'py-4 text-sm font-semibold transition-colors relative outline-none',
                  activeTab === 'students' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                ]"
              >
                Students ({{ studentsData.length }})
                <div
                  v-if="activeTab === 'students'"
                  class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F8BE17] rounded-t-md"
                ></div>
              </button>
              <button
                @click="activeTab = 'staff'"
                :class="[
                  'py-4 text-sm font-semibold transition-colors relative outline-none',
                  activeTab === 'staff' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                ]"
              >
                UTM Staff ({{ utmStaffData.length }})
                <div
                  v-if="activeTab === 'staff'"
                  class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F8BE17] rounded-t-md"
                ></div>
              </button>
              <button
                @click="activeTab = 'external'"
                :class="[
                  'py-4 text-sm font-semibold transition-colors relative outline-none',
                  activeTab === 'external' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                ]"
              >
                External Users ({{ normalUsersData.length }})
                <div
                  v-if="activeTab === 'external'"
                  class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F8BE17] rounded-t-md"
                ></div>
              </button>
            </div>

            <!-- 6. Local Reactive Filter Model -->
            <div class="p-4 border-b border-gray-100 flex items-center bg-white">
              <div class="relative w-96">
                <svg
                  class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search by Name or Email..."
                  class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C001F] focus:border-transparent outline-none text-sm transition-all shadow-sm"
                />
              </div>
            </div>

            <!-- Data Table Grid -->
            <div class="overflow-x-auto flex-grow bg-white">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr
                    class="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold"
                  >
                    <th class="px-6 py-4">Name</th>
                    <th class="px-6 py-4">Email</th>
                    <th class="px-6 py-4">Primary Identifier</th>
                    <th class="px-6 py-4 text-right">Status Badge</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="row in currentViewData"
                    :key="row.id"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-6 py-4 text-sm font-semibold text-gray-900">{{ row.name }}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">{{ row.email }}</td>
                    <td class="px-6 py-4 text-sm text-gray-600 font-mono">
                      {{ row.identifier || 'N/A' }}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <span
                        v-if="row.identifier"
                        class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200"
                      >
                        Ready to Import
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200"
                      >
                        Missing Details
                      </span>
                    </td>
                  </tr>
                  <tr v-if="currentViewData.length === 0">
                    <td colspan="4" class="px-6 py-16 text-center text-gray-500 text-sm">
                      <div class="flex flex-col items-center justify-center space-y-3">
                        <svg
                          class="w-10 h-10 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          ></path>
                        </svg>
                        <p class="font-medium">No records to display.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Structural Mock Pagination Buttons -->
            <div
              class="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50"
            >
              <button
                class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5C001F] focus:border-transparent"
              >
                [Prev]
              </button>
              <span class="text-sm text-gray-600 font-medium">Page 1 of 3</span>
              <button
                class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5C001F] focus:border-transparent"
              >
                [Next]
              </button>
            </div>
          </div>
        </main>

        <!-- 7. Floating Action Container Bar (within the fluid layout base) -->
        <div
          class="bg-white border border-gray-200 rounded-xl p-4 shadow-md max-w-7xl mx-auto w-full mb-6 flex items-center justify-between"
        >
          <div class="flex items-center space-x-3 text-sm text-gray-600 font-medium">
            <svg
              class="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <p>Review categorization results. Unsaved changes will be lost on exit.</p>
          </div>
          <div class="flex space-x-4">
            <button
              class="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              @click="handleConfirm"
              class="px-6 py-2.5 bg-[#5C001F] text-white font-bold rounded-lg hover:bg-[#4a0019] transition-colors text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5C001F] focus:ring-offset-2"
            >
              Confirm Bulk Import
            </button>
          </div>
        </div>
      </div>
      <!-- Close split-view flex-grow container -->
    </div>
    <!-- Close split-view outer division -->

    <!-- 1. Absolute Bottom Footer -->
    <AppFooter />
  </div>
</template>
