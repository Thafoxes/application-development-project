<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { apiService } from '@/services/api'

const { user } = useAuth()
const router = useRouter()

const recentUsers = ref({ students: [], lecturers: [], outsiders: [] })
const isLoadingUsers = ref(false)

const loadRecentUsers = async () => {
  isLoadingUsers.value = true
  try {
    const data = await apiService.getRecentUsers()
    recentUsers.value = data
  } catch (err) {
    console.error("Failed to load users:", err)
  } finally {
    isLoadingUsers.value = false
  }
}

onMounted(() => {
  if (user.value && Number(user.value.is_coordinator) === 1) {
    loadRecentUsers()
  }
})


import CreateUserForm from '@/components/CreateUserForm.vue'
import EditUserModal from '@/components/EditUserModal.vue'

const isEditModalOpen = ref(false)
const selectedUserToEdit = ref(null)

const openEditModal = (userToEdit) => {
  selectedUserToEdit.value = userToEdit
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedUserToEdit.value = null
}

const onUserUpdatedOrCreated = () => {
  closeEditModal()
  loadRecentUsers()
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black">
    <AppHeader />

    <div v-if="!user || Number(user.is_coordinator) !== 1" class="flex-1 flex flex-col items-center justify-center text-center px-4">
      <h1 class="text-4xl font-bold text-[#5c001f] mb-4">Access Restricted</h1>
      <p class="text-xl text-gray-700 mb-6">You do not have coordinator permissions to manage users.</p>
    </div>

    <div v-else class="flex flex-1 w-full relative">
      <AppSidebar />

      <main class="flex-1 flex flex-col px-[50px] py-[30px] gap-8 overflow-y-auto">
        <div>
          <h1 class="font-['Inter'] font-bold text-[40px] text-[#5c001f] uppercase">Manage User</h1>
          <p class="text-gray-700 mt-2">Create new internal or external users, and view recently joined users.</p>
        </div>

        <div class="flex flex-col xl:flex-row gap-8">
          <!-- Create User Form (Left Panel) -->
          <CreateUserForm @user-created="onUserUpdatedOrCreated" />

        <!-- Recent Users Tables (Right Panel) -->
        <div class="flex-[1.5] flex flex-col gap-8">
          <div v-if="isLoadingUsers" class="text-gray-600">Loading recent users...</div>
          <template v-else>
            <!-- LECTURERS TABLE -->
            <div class="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
              <div class="bg-[#5c001f] text-white px-4 py-3 font-bold text-lg flex justify-between items-center">
                <span>Recent Lecturers / Staff</span>
                <span class="text-sm bg-white/20 px-2 py-1 rounded">Last 20</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-gray-100 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th class="p-3 font-semibold">Name</th>
                      <th class="p-3 font-semibold">Email</th>
                      <th class="p-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="l in recentUsers.lecturers" :key="l.user_id" class="border-b border-gray-100 hover:bg-gray-50">
                      <td class="p-3">{{ l.full_name }}</td>
                      <td class="p-3 text-gray-500">{{ l.email }}</td>
                      <td class="p-3"><button @click="openEditModal(l)" class="text-blue-600 font-semibold hover:underline">Edit</button></td>
                    </tr>
                    <tr v-if="recentUsers.lecturers.length === 0">
                      <td colspan="3" class="p-4 text-center text-gray-500">No recent lecturers found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- STUDENTS TABLE -->
            <div class="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
              <div class="bg-blue-800 text-white px-4 py-3 font-bold text-lg flex justify-between items-center">
                <span>Recent Students</span>
                <span class="text-sm bg-white/20 px-2 py-1 rounded">Last 20</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-gray-100 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th class="p-3 font-semibold">Name</th>
                      <th class="p-3 font-semibold">Metric</th>
                      <th class="p-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in recentUsers.students" :key="s.user_id" class="border-b border-gray-100 hover:bg-gray-50">
                      <td class="p-3">{{ s.full_name }}</td>
                      <td class="p-3 text-gray-500">{{ s.metric_number }}</td>
                      <td class="p-3"><button @click="openEditModal(s)" class="text-blue-600 font-semibold hover:underline">Edit</button></td>
                    </tr>
                    <tr v-if="recentUsers.students.length === 0">
                      <td colspan="3" class="p-4 text-center text-gray-500">No recent students found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- OUTSIDERS TABLE -->
            <div class="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
              <div class="bg-green-700 text-white px-4 py-3 font-bold text-lg flex justify-between items-center">
                <span>Recent Outsiders</span>
                <span class="text-sm bg-white/20 px-2 py-1 rounded">Last 20</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-gray-100 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th class="p-3 font-semibold">Name</th>
                      <th class="p-3 font-semibold">Email / Org</th>
                      <th class="p-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="o in recentUsers.outsiders" :key="o.user_id" class="border-b border-gray-100 hover:bg-gray-50">
                      <td class="p-3">{{ o.full_name }}</td>
                      <td class="p-3 text-gray-500">{{ o.email }} <br/> <span class="text-xs text-gray-400">{{ o.co_org_name }}</span></td>
                      <td class="p-3"><button @click="openEditModal(o)" class="text-blue-600 font-semibold hover:underline">Edit</button></td>
                    </tr>
                    <tr v-if="recentUsers.outsiders.length === 0">
                      <td colspan="3" class="p-4 text-center text-gray-500">No recent outsiders found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
        
        </div>
      </main>
    </div>
    <AppFooter />

    <EditUserModal 
      v-if="isEditModalOpen" 
      :user="selectedUserToEdit" 
      @close="closeEditModal" 
      @user-updated="onUserUpdatedOrCreated" 
    />
  </div>
</template>
