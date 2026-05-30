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

const form = ref({
  fullName: '',
  email: '',
  password: '',
  phoneNumber: '',
  coOrgName: '',
  affiliation: ''
})

// Expertise tags logic
const expertiseTags = ref([])
const expertiseInput = ref('')

const addTag = (event) => {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    const val = expertiseInput.value.trim().replace(/,$/, '')
    if (val && !expertiseTags.value.includes(val)) {
      expertiseTags.value.push(val)
    }
    expertiseInput.value = ''
  }
}

const removeTag = (index) => {
  expertiseTags.value.splice(index, 1)
}

const isSubmitting = ref(false)

const submitForm = async () => {
  if (!form.value.fullName || !form.value.email || !form.value.password) {
    alert("Full Name, Email, and Password are required!")
    return
  }

  try {
    isSubmitting.value = true
    const expertiseString = expertiseTags.value.join(', ')
    
    await apiService.createUser({
      full_name: form.value.fullName,
      email: form.value.email,
      password: form.value.password,
      phone_number: form.value.phoneNumber,
      co_org_name: form.value.coOrgName,
      expertise: expertiseString,
      affiliation: form.value.affiliation
    })
    
    alert("User successfully created!")
    
    // Reset form
    form.value = {
      fullName: '', email: '', password: '', phoneNumber: '', coOrgName: '', affiliation: ''
    }
    expertiseTags.value = []
    
    // Reload recent users
    loadRecentUsers()
  } catch (error) {
    console.error("Error creating user:", error)
    alert("Failed to create user. Email or Phone number might already exist.")
  } finally {
    isSubmitting.value = false
  }
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
          <div class="bg-white border border-gray-300 rounded-lg p-8 shadow-sm flex-1 h-fit">
            <h2 class="text-2xl font-bold text-[#5c001f] mb-6">Create New User</h2>
          <form @submit.prevent="submitForm" class="flex flex-col gap-6">
            
            <!-- Full Name -->
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-gray-800">Full Name *</label>
              <input v-model="form.fullName" type="text" required placeholder="e.g. Dr. John Doe" class="border border-gray-300 p-3 rounded focus:outline-none focus:border-[#5c001f]" />
            </div>

            <!-- Email -->
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-gray-800">Email Address *</label>
              <input v-model="form.email" type="email" required placeholder="e.g. john@utm.my" class="border border-gray-300 p-3 rounded focus:outline-none focus:border-[#5c001f]" />
              <span class="text-sm text-gray-500 italic">Note: Use @utm.my email for automatic Staff privileges</span>
            </div>

            <!-- Password -->
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-gray-800">Password *</label>
              <input v-model="form.password" type="password" required placeholder="Enter temporary password" class="border border-gray-300 p-3 rounded focus:outline-none focus:border-[#5c001f]" />
            </div>

            <!-- Phone Number -->
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-gray-800">Phone Number</label>
              <input v-model="form.phoneNumber" type="tel" maxlength="12" placeholder="e.g. 0123456789" class="border border-gray-300 p-3 rounded focus:outline-none focus:border-[#5c001f]" />
            </div>

            <!-- Organization Name -->
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-gray-800">Company / Organization Name</label>
              <input v-model="form.coOrgName" type="text" placeholder="e.g. Tech Corp" class="border border-gray-300 p-3 rounded focus:outline-none focus:border-[#5c001f]" />
            </div>

            <!-- Affiliation -->
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-gray-800">Affiliation</label>
              <input v-model="form.affiliation" type="text" placeholder="e.g. Industry Expert" class="border border-gray-300 p-3 rounded focus:outline-none focus:border-[#5c001f]" />
            </div>

            <!-- Expertise (Tags) -->
             <div class="flex flex-col gap-2">
              <label class="font-semibold text-gray-800">Area of Expertise</label>
              <div class="border border-gray-300 p-2 rounded flex flex-wrap gap-2 items-center focus-within:border-[#5c001f]">
                <div v-for="(tag, index) in expertiseTags" :key="index" class="bg-[#e7ded3] text-[#5c001f] px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                  {{ tag }}
                  <button type="button" @click="removeTag(index)" class="text-[#5c001f] hover:text-red-600 font-bold leading-none">&times;</button>
                </div>
                <input 
                  v-model="expertiseInput" 
                  @keydown="addTag"
                  type="text" 
                  placeholder="Type tag and press Enter" 
                  class="flex-1 min-w-[150px] outline-none bg-transparent"
                />
              </div>
            </div> -->

            <div class="mt-4">
              <button type="submit" :disabled="isSubmitting" class="bg-[#5c001f] text-white font-bold py-3 px-8 rounded shadow hover:bg-[#4a0019] transition-colors" :class="{ 'opacity-50 cursor-not-allowed': isSubmitting }">
                {{ isSubmitting ? 'Creating...' : 'Create User' }}
              </button>
            </div>

          </form>
        </div>

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
                      <td class="p-3"><button class="text-blue-600 font-semibold hover:underline">Edit</button></td>
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
                      <td class="p-3"><button class="text-blue-600 font-semibold hover:underline">Edit</button></td>
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
                      <td class="p-3"><button class="text-blue-600 font-semibold hover:underline">Edit</button></td>
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
  </div>
</template>
