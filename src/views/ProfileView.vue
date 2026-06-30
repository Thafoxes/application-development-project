<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { User, Mail, Lock, Shield, Loader2, CheckCircle2 } from 'lucide-vue-next'
import AppHeader from '@/components/common_components/AppHeader.vue'
import AppSidebar from '@/components/common_components/AppSidebar.vue'
import AppFooter from '@/components/common_components/AppFooter.vue'

const { user, login } = useAuth()

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const isUpdating = ref(false)
const updateSuccess = ref(false)
const updateError = ref('')

const isSavingProfile = ref(false)
const profileSuccess = ref(false)
const profileError = ref('')

const profileForm = ref({
  salutationId: '',
  fullName: '',
  phoneNumber: ''
})

const salutations = ref([])

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/lookups/salutations`)
    if (res.ok) {
      salutations.value = await res.json()
    }
  } catch (error) {
    console.error('Failed to load salutations:', error)
  }
})

watch(user, (newUser) => {
  if (newUser) {
    profileForm.value.salutationId = newUser.salutation_id || ''
    profileForm.value.fullName = newUser.full_name || ''
    profileForm.value.phoneNumber = newUser.phone_number || ''
  }
}, { immediate: true })

const roleDisplay = computed(() => {
  if (!user.value) return 'Unknown Role'
  if (Number(user.value.is_coordinator) === 1) return 'Coordinator'
  if (Number(user.value.is_supervisor) === 1) return 'Supervisor'
  if (Number(user.value.is_examiner) === 1) return 'Examiner'
  return 'Student'
})

const handleUpdateProfile = async () => {
  profileError.value = ''
  profileSuccess.value = false

  if (!profileForm.value.salutationId || !profileForm.value.fullName.trim()) {
    profileError.value = 'Salutation and Full Name are required.'
    return
  }

  isSavingProfile.value = true

  try {
    const tokenVal = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenVal}`
      },
      body: JSON.stringify({
        salutation_id: profileForm.value.salutationId,
        full_name: profileForm.value.fullName,
        phone_number: profileForm.value.phoneNumber
      })
    })

    const data = await response.json()

    if (response.ok && data.user && data.token) {
      // Invalidate active session and refresh with the new claims (FR-UC103-02)
      login(data.user, data.token)
      profileSuccess.value = true
    } else {
      profileError.value = data.error || 'Failed to update profile.'
    }
  } catch (error) {
    console.error('Profile update error:', error)
    profileError.value = 'An error occurred while communicating with the server.'
  } finally {
    isSavingProfile.value = false
  }
}

const handleUpdatePassword = async () => {
  updateError.value = ''
  updateSuccess.value = false

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    updateError.value = 'All fields are required.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    updateError.value = 'New password and confirm password do not match.'
    return
  }


  isUpdating.value = true

  try {
    const token = localStorage.getItem('token')
    
    // Attempting to update password
    const response = await fetch(`${API_BASE_URL}/api/users/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      updateSuccess.value = true
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      updateError.value = data.error || 'Failed to update password.'
    }
  } catch (error) {
    console.error('Password update error:', error)
    updateError.value = 'An error occurred while communicating with the server.'
  } finally {
    isUpdating.value = false
  }
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

      <!-- Main Profile Content -->
      <main class="flex-1 flex flex-col px-6 md:px-10 py-8 overflow-y-auto animate-fadeIn">
        <div class="max-w-5xl w-full mx-auto">
          
          <!-- Breadcrumbs -->
          <nav class="flex text-xs text-gray-500 mb-3 font-medium" aria-label="Breadcrumb">
            <ol class="inline-flex items-center space-x-1 md:space-x-2">
              <li class="inline-flex items-center">
                <router-link to="/dashboard" class="hover:text-[#5c001f] transition-colors">Home</router-link>
              </li>
              <li>
                <div class="flex items-center">
                  <span class="mx-1.5">/</span>
                  <span class="text-gray-800 font-bold">My Profile</span>
                </div>
              </li>
            </ol>
          </nav>

          <!-- Header Title -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
            <p class="text-sm text-gray-600 mt-1">Manage your account information and security settings.</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Personal Information Card -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1 bg-[#5c001f]"></div>
          
          <div class="flex flex-col items-center mt-2 mb-6">
            <div class="w-20 h-20 rounded-full bg-[#5c001f] flex items-center justify-center text-white font-bold text-3xl shadow-md mb-4 uppercase">
              {{ user?.full_name ? user.full_name.charAt(0) : 'U' }}
            </div>
            <h2 class="text-xl font-bold text-gray-900 text-center capitalize">
              {{ user?.title_name ? user.title_name + ' ' + user.full_name : (user?.full_name || 'User Name') }}
            </h2>
            <div class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider">
              <Shield class="w-3.5 h-3.5" />
              {{ roleDisplay }}
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Mail class="w-3.5 h-3.5" /> Email Address
              </label>
              <p class="text-sm font-medium text-gray-800">{{ user?.email || 'N/A' }}</p>
            </div>
            <div v-if="user?.phone_number">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <User class="w-3.5 h-3.5" /> Phone Number
              </label>
              <p class="text-sm font-medium text-gray-800">{{ user?.phone_number }}</p>
            </div>
            <div v-if="Number(user?.is_student) === 1">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <User class="w-3.5 h-3.5" /> Matric Number
              </label>
              <p class="text-sm font-medium text-gray-800 uppercase">{{ user?.metric_number || 'N/A' }}</p>
            </div>
            <div v-else-if="user?.affiliation">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Shield class="w-3.5 h-3.5" /> Affiliation
              </label>
              <p class="text-sm font-medium text-gray-800">{{ user?.affiliation }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Cards -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Profile Details Card -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div class="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <User class="w-5 h-5 text-[#5c001f]" />
            <h2 class="text-lg font-bold text-gray-900">Profile Details</h2>
          </div>

          <!-- Alert States -->
          <div v-if="profileSuccess" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
            <CheckCircle2 class="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p class="font-bold text-sm">Profile Details Updated</p>
              <p class="text-xs mt-0.5 text-green-650">Your profile information has been successfully saved.</p>
            </div>
          </div>

          <div v-if="profileError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2 font-medium">
            <Shield class="w-4 h-4 shrink-0 text-red-600" />
            {{ profileError }}
          </div>

          <form @submit.prevent="handleUpdateProfile" class="space-y-5 max-w-md">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">Salutation / Title</label>
              <select
                v-model="profileForm.salutationId"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c001f] focus:border-transparent transition-shadow bg-white"
              >
                <option value="" disabled>Select Salutation</option>
                <option
                  v-for="sal in salutations"
                  :key="sal.salutation_id"
                  :value="sal.salutation_id"
                >
                  {{ sal.title_name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">Full Name</label>
              <input 
                type="text" 
                v-model="profileForm.fullName"
                required
                placeholder="Enter full name"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c001f] focus:border-transparent transition-shadow"
              />
            </div>
            
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">Phone Number</label>
              <input 
                type="text" 
                v-model="profileForm.phoneNumber"
                placeholder="Enter phone number"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c001f] focus:border-transparent transition-shadow"
              />
            </div>
            
            <div class="pt-4 border-t border-gray-100 flex justify-end">
              <button 
                type="submit" 
                :disabled="isSavingProfile"
                class="bg-[#5c001f] hover:bg-[#4a0019] text-white py-2.5 px-6 rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="isSavingProfile" class="w-4 h-4 animate-spin text-white" />
                <span>{{ isSavingProfile ? 'Saving...' : 'Save Profile' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Security Settings Card -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div class="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <Lock class="w-5 h-5 text-[#5c001f]" />
            <h2 class="text-lg font-bold text-gray-900">Security & Password</h2>
          </div>

          <!-- Alert States -->
          <div v-if="updateSuccess" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
            <CheckCircle2 class="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p class="font-bold text-sm">Password Updated Successfully</p>
              <p class="text-xs mt-0.5 text-green-650">Your new password is now active. Please use it the next time you log in.</p>
            </div>
          </div>

          <div v-if="updateError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2 font-medium">
            <Shield class="w-4 h-4 shrink-0 text-red-650" />
            {{ updateError }}
          </div>

          <form @submit.prevent="handleUpdatePassword" class="space-y-5 max-w-md">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">Current Password</label>
              <input 
                type="password" 
                v-model="currentPassword"
                required
                placeholder="Enter current password"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c001f] focus:border-transparent transition-shadow bg-gray-50"
              />
            </div>
            
            <div class="pt-2">
              <label class="block text-xs font-bold text-gray-700 mb-1.5">New Password</label>
              <input 
                type="password" 
                v-model="newPassword"
                required
                placeholder="Enter new password"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c001f] focus:border-transparent transition-shadow"
              />
            </div>
            
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">Confirm New Password</label>
              <input 
                type="password" 
                v-model="confirmPassword"
                required
                placeholder="Re-enter new password"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c001f] focus:border-transparent transition-shadow"
              />
            </div>
            
            <div class="pt-4 border-t border-gray-100 flex justify-end">
              <button 
                type="submit" 
                :disabled="isUpdating"
                class="bg-[#5c001f] hover:bg-[#4a0019] text-white py-2.5 px-6 rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="isUpdating" class="w-4 h-4 animate-spin text-white" />
                <span>{{ isUpdating ? 'Updating...' : 'Update Password' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      
    </div>
        </div>
      </main>
    </div>

    <!-- Footer -->
    <AppFooter class="mt-auto -mb-[30px]" />
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.4s ease-out forwards;
}
</style>
