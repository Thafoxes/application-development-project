<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { apiService } from '@/services/api'

const { user } = useAuth()
const router = useRouter()

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
          <p class="text-gray-700 mt-2">Create new internal or external users for the system.</p>
        </div>

        <div class="bg-white border border-gray-300 rounded-lg p-8 shadow-sm max-w-3xl">
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
      </main>
    </div>
    <AppFooter />
  </div>
</template>
