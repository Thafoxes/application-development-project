<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Loader2, Save, UserRound, X } from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'
import RoleSidebar from '@/components/RoleSidebar.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { api, roleFlags } from '@/services/ifamousApi'

const roles = roleFlags()
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const error = ref('')

const specialisationTags = ref([])
const tagInput = ref('')

const form = reactive({
  fullName: '', phoneNumber: '', companyName: '', expertise: '', affiliation: '',
  department: '', organisation: '', biography: '', profilePhotoUrl: '', professionalLink: '',
  isAvailable: true, specialisation: '', supervisorSpecialisation: '', examinerSpecialisation: '',
})

function parseTags(rawString) {
  if (!rawString) return []
  return rawString
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function syncExpertiseFields() {
  const joined = specialisationTags.value.join(', ')
  form.expertise = joined
  form.specialisation = joined
  form.supervisorSpecialisation = joined
  form.examinerSpecialisation = joined
}

function addTag() {
  const val = tagInput.value.trim().replace(/^[,\s]+|[,\s]+$/g, '')
  if (val && !specialisationTags.value.includes(val)) {
    specialisationTags.value.push(val)
    syncExpertiseFields()
  }
  tagInput.value = ''
}

function removeTag(index) {
  specialisationTags.value.splice(index, 1)
  syncExpertiseFields()
}

function handleKeydown(event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTag()
  } else if (event.key === 'Backspace' && tagInput.value === '' && specialisationTags.value.length > 0) {
    specialisationTags.value.pop()
    syncExpertiseFields()
  }
}

onMounted(async () => {
  try {
    const profile = (await api.get('/profile')).data.profile || {}
    const rawSpec = [
      profile.expertise,
      profile.specialisation,
      profile.supervisor_specialisation,
      profile.examiner_specialisation
    ].filter(Boolean).join(', ')

    specialisationTags.value = parseTags(rawSpec)
    const spec = specialisationTags.value.join(', ')

    Object.assign(form, {
      fullName: profile.full_name || '', phoneNumber: profile.phone_number || '', companyName: profile.company_name || '',
      expertise: spec, affiliation: profile.affiliation || '', department: profile.department || '',
      organisation: profile.organisation || '', biography: profile.biography || '', profilePhotoUrl: profile.profile_photo_url || '',
      professionalLink: profile.professional_link || '', isAvailable: Number(profile.is_available ?? 1) === 1,
      specialisation: spec, supervisorSpecialisation: spec, examinerSpecialisation: spec,
    })
  } catch (err) { error.value = err.response?.data?.error || err.message }
  finally { loading.value = false }
})

async function save() {
  saving.value = true; error.value = ''; message.value = ''
  try {
    if (tagInput.value.trim()) {
      addTag()
    }
    syncExpertiseFields()

    await api.patch('/profile', form); message.value = 'Profile updated successfully.'
  }
  catch (err) { error.value = err.response?.data?.error || err.message }
  finally { saving.value = false }
}
</script>

<template>
  <div class="min-h-screen bg-[#f5efe6] flex flex-col">
    <AppHeader />
    <div class="flex flex-col md:flex-row flex-1 w-full min-w-0">
      <AppSidebar v-if="roles.isCoordinator" />
      <RoleSidebar v-else :role="roles.isStudent ? 'Student' : 'Staff'" />
      <main class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full">
        <!-- Header Banner -->
        <section class="bg-[#5c001f] text-white rounded-[24px] p-6 sm:p-8 shadow-lg border border-[#400015]">
          <p class="text-[#ffea79] font-bold uppercase tracking-[0.15em] text-xs sm:text-sm flex items-center gap-2">
            <UserRound class="w-5 h-5 text-[#ffea79]" /> My Profile
          </p>
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-2 tracking-tight">User Profile</h1>
          <p class="text-slate-100 text-sm sm:text-base font-medium mt-1">Manage and update your personal account information and specialisations.</p>
        </section>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white rounded-[24px] p-12 text-center shadow-md border border-slate-200">
          <Loader2 class="animate-spin mx-auto w-10 h-10 text-[#5c001f]" />
          <p class="text-slate-900 font-bold text-base mt-3">Loading profile data...</p>
        </div>

        <!-- Profile Form -->
        <form v-else @submit.prevent="save" class="bg-white rounded-[24px] p-5 sm:p-8 shadow-md border border-slate-200 space-y-6">
          <div v-if="message" class="bg-emerald-50 text-emerald-950 border-2 border-emerald-300 p-4 rounded-xl font-bold flex items-center gap-2">
            <span>✓</span> {{ message }}
          </div>
          <div v-if="error" class="bg-rose-50 text-rose-950 border-2 border-rose-300 p-4 rounded-xl font-bold flex items-center gap-2">
            <span>⚠️</span> {{ error }}
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            <label class="space-y-1.5 block">
              <span class="text-slate-900 font-bold text-sm sm:text-base block">Full name</span>
              <input v-model="form.fullName" class="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 transition-all" />
            </label>

            <label class="space-y-1.5 block">
              <span class="text-slate-900 font-bold text-sm sm:text-base block">Phone number</span>
              <input v-model="form.phoneNumber" class="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 transition-all" />
            </label>

            <label class="space-y-1.5 block">
              <span class="text-slate-900 font-bold text-sm sm:text-base block">Department</span>
              <input v-model="form.department" class="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 transition-all" />
            </label>

            <label class="space-y-1.5 block">
              <span class="text-slate-900 font-bold text-sm sm:text-base block">Organisation / Company</span>
              <input v-model="form.organisation" class="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 transition-all" />
            </label>

            <!-- Unified Expertise & Specialisation Tag Input -->
            <div class="space-y-1.5 block lg:col-span-2">
              <span class="text-slate-900 font-bold text-sm sm:text-base block">
                Expertise & Specialisation
                <span class="text-xs text-slate-500 font-normal ml-1">(Press Enter or comma to add tag)</span>
              </span>
              
              <div class="w-full border-2 border-slate-300 rounded-xl p-2.5 bg-slate-50/50 focus-within:bg-white focus-within:border-[#5c001f] focus-within:ring-4 focus-within:ring-[#5c001f]/15 transition-all flex flex-wrap items-center gap-2 min-h-[52px]">
                <span
                  v-for="(tag, index) in specialisationTags"
                  :key="index"
                  class="inline-flex items-center gap-1.5 bg-[#5c001f] text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-xs transition-all hover:bg-[#430016]"
                >
                  <span>{{ tag }}</span>
                  <button
                    type="button"
                    @click.prevent="removeTag(index)"
                    class="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer inline-flex items-center justify-center w-4 h-4 text-xs font-extrabold"
                    title="Remove tag"
                  >
                    ✕
                  </button>
                </span>

                <input
                  v-model="tagInput"
                  @keydown="handleKeydown"
                  @blur="addTag"
                  type="text"
                  class="flex-1 bg-transparent border-none outline-none text-slate-900 font-medium text-base min-w-[200px] placeholder:text-slate-400 py-1 px-1"
                  placeholder="Type expertise/specialisation and press Enter or comma..."
                />
              </div>
            </div>

            <label class="space-y-1.5 block lg:col-span-2">
              <span class="text-slate-900 font-bold text-sm sm:text-base block">Biography</span>
              <textarea v-model="form.biography" class="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 transition-all min-h-32" />
            </label>

            <label class="space-y-1.5 block">
              <span class="text-slate-900 font-bold text-sm sm:text-base block">Professional link</span>
              <input v-model="form.professionalLink" class="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 transition-all" placeholder="https://..." />
            </label>

            <label class="space-y-1.5 block">
              <span class="text-slate-900 font-bold text-sm sm:text-base block">Profile photo URL</span>
              <input v-model="form.profilePhotoUrl" class="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 transition-all" placeholder="https://..." />
            </label>
          </div>

          <label v-if="roles.isSupervisor || roles.isExaminer" class="flex items-center gap-3 font-bold text-slate-900 text-sm sm:text-base cursor-pointer select-none bg-slate-50 p-4 rounded-xl border border-slate-200">
            <input v-model="form.isAvailable" type="checkbox" class="w-5 h-5 accent-[#5c001f] rounded cursor-pointer" />
            <span>Available for new assignments</span>
          </label>

          <div class="pt-2">
            <button type="submit" :disabled="saving" class="bg-[#5c001f] hover:bg-[#430016] active:scale-[0.98] text-white rounded-xl px-7 py-3.5 font-bold inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all text-base cursor-pointer disabled:opacity-60 w-full sm:w-auto">
              <Loader2 v-if="saving" class="w-5 h-5 animate-spin" />
              <Save v-else class="w-5 h-5" />
              <span>Save profile</span>
            </button>
          </div>
        </form>
      </main>
    </div>
    <AppFooter />
  </div>
</template>
