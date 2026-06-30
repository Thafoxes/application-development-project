<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['created'])

// Form fields
const title = ref(props.project?.title || '')
const course = ref('Software Engineering')
const cgpa = ref(3.50)
const projectType = ref('Development')
const proposalNo = ref(1)
const ideaSource = ref('Self-proposed')

// Text content
const problemBackground = ref('')
const objectives = ref('')
const scopes = ref('')

// Technical Matrix
const software = ref('Vue 3, Tailwind CSS, Express.js, MySQL')
const hardware = ref('Application Server, Database Server')
const techniques = ref('JWT Token Claims, Bcrypt Password Hashing')
const security = ref('HTTPS, HttpOnly Cookie Sessions')
const network = ref('Localhost Development Environment')

const errorMsg = ref('')
const isSubmitting = ref(false)

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// CGPA Validation Rule (FR-1.3 & SDD 2.5)
const isResearchCgpaInvalid = computed(() => {
  return projectType.value === 'Research' && parseFloat(cgpa.value) < 3.3
})

const submitProposal = async () => {
  errorMsg.value = ''
  
  if (!title.value.trim()) {
    errorMsg.value = 'Project title is required.'
    return
  }

  if (isResearchCgpaInvalid.value) {
    errorMsg.value = 'Research-type projects require a CGPA of 3.3 or higher.'
    return
  }

  isSubmitting.value = true
  const token = localStorage.getItem('token')

  const payload = {
    initial_proposal_json: {
      title: title.value.trim(),
      student_meta: {
        course: course.value,
        cgpa: parseFloat(cgpa.value)
      },
      project_meta: {
        project_type: projectType.value,
        proposal_no: parseInt(proposalNo.value),
        idea_source: ideaSource.value
      },
      text_content: {
        problem_background: problemBackground.value.trim(),
        objectives: objectives.value.trim(),
        scopes: scopes.value.trim()
      },
      technical_matrix: {
        software: software.value.split(',').map(s => s.trim()).filter(Boolean),
        hardware: hardware.value.split(',').map(s => s.trim()).filter(Boolean),
        techniques_algorithms: techniques.value.split(',').map(s => s.trim()).filter(Boolean),
        security: security.value.split(',').map(s => s.trim()).filter(Boolean),
        network: network.value.split(',').map(s => s.trim()).filter(Boolean)
      }
    }
  }

  try {
    const res = await fetch(`${apiUrl}/api/projects/${props.project.project_id}/proposal`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      emit('created')
    } else {
      const data = await res.json()
      errorMsg.value = data.error || 'Failed to submit proposal.'
    }
  } catch (error) {
    errorMsg.value = 'Network error occurred.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden font-['Inter'] text-black">
    <!-- Header banner -->
    <div class="bg-[#5c001f] px-6 py-5 border-b-4 border-[#eab308]">
      <h2 class="text-xl font-bold text-white tracking-tight">UTM Malaysia-Japan International Institute of Technology (MJIIT) Proposal Form</h2>
      <p class="text-xs text-white/80 mt-1">Please populate the deferred proposal matrix sections below to advance to active milestone submissions.</p>
    </div>
    
    <div class="p-6 md:p-8">
      <!-- Error Alerts -->
      <div v-if="errorMsg" class="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-start gap-2.5">
        <svg class="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Eligibility Check warning -->
      <div v-if="isResearchCgpaInvalid" class="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200 flex items-start gap-2.5">
        <svg class="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div>
          <span class="font-bold">Academic Gate Constraint Active:</span> Research tracks are strictly restricted to students with a CGPA of 3.30 or above. Please switch to "Development" type or correct your CGPA.
        </div>
      </div>

      <form @submit.prevent="submitProposal" class="space-y-8 text-black">
        <!-- Section 1: Academic eligibility -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-[#5c001f] uppercase tracking-wider border-b border-gray-100 pb-2">Section A: Student Details & Eligibility</h3>
          <div class="max-w-xs">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Current CGPA</label>
            <input 
              v-model="cgpa" 
              type="number" 
              step="0.01" 
              min="0.00" 
              max="4.00"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f]"
              required
            />
          </div>
        </div>

        <!-- Section 2: Project track -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-[#5c001f] uppercase tracking-wider border-b border-gray-100 pb-2">Section B: Project Track & Parameters</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Project Title</label>
              <input 
                v-model="title" 
                type="text" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f]"
                required
              />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Project Type</label>
                <select v-model="projectType" class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f]">
                  <option value="Development">Development (System / Web / App)</option>
                  <option value="Research">Research (Thesis / Algorithm / Study)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Priority Choice</label>
                <select v-model="proposalNo" class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f]">
                  <option :value="1">Choice 1 (Primary)</option>
                  <option :value="2">Choice 2 (Secondary)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Project Source</label>
                <select v-model="ideaSource" class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f]">
                  <option value="Self-proposed">Self-proposed</option>
                  <option value="Lecturer Project">Lecturer Allocated Project</option>
                  <option value="Industry Grant">Industry Sponsored Grant</option>
                  <option value="Faculty Industry Grant">Faculty Industry Grant</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Text content definitions -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-[#5c001f] uppercase tracking-wider border-b border-gray-100 pb-2">Section C: Foundations & Scopes</h3>
          <div class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Problem Background</label>
              <textarea 
                v-model="problemBackground" 
                rows="4" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] resize-none"
                placeholder="Detail the evidence of systemic or operational bottlenecks that justify this project..."
                required
              ></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Project Objectives</label>
              <textarea 
                v-model="objectives" 
                rows="4" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] resize-none"
                placeholder="1. To design... 2. To develop... 3. To evaluate..."
                required
              ></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Project Scopes & Boundaries</label>
              <textarea 
                v-model="scopes" 
                rows="4" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f] resize-none"
                placeholder="Define the structural boundaries, system target entities, and limitations of this deployment..."
                required
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Section 4: Technical Matrix -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-[#5c001f] uppercase tracking-wider border-b border-gray-100 pb-2">Section D: Technical & Architecture Matrix</h3>
          <p class="text-xs text-gray-400 mb-2">Please enter the values as comma-separated values (e.g., Node.js, Express, MySQL)</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Software Stack</label>
              <input 
                v-model="software" 
                type="text" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f]"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Hardware Stack</label>
              <input 
                v-model="hardware" 
                type="text" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f]"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Techniques / Algorithms</label>
              <input 
                v-model="techniques" 
                type="text" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f]"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Security Policies</label>
              <input 
                v-model="security" 
                type="text" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f]"
                required
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Network Architecture</label>
              <input 
                v-model="network" 
                type="text" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#5c001f] focus:border-[#5c001f]"
                required
              />
            </div>
          </div>
        </div>

        <!-- Submission Buttons -->
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <button 
            type="submit" 
            :disabled="isSubmitting || isResearchCgpaInvalid"
            class="px-8 py-3 bg-[#5c001f] text-white text-sm font-semibold rounded-lg hover:bg-[#7a0029] transition-colors focus:ring-4 focus:ring-[#e7ded3] outline-none disabled:opacity-40 disabled:cursor-not-allowed shadow-sm uppercase tracking-wider"
          >
            {{ isSubmitting ? 'Submitting...' : 'Save & Submit Proposal' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
