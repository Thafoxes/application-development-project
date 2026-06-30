<script setup>
const emit = defineEmits(['create-new'])
</script>

<template>
  <div class="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
    <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 class="text-xl font-bold text-gray-900 mb-2">No Active FYP Project Found</h3>
    <p class="text-gray-500 mb-8 max-w-md">You currently have no active project registered under your profile. Start by creating a new proposal for this session.</p>
    
    <button 
      @click="emit('create-new')"
      class="px-6 py-3 bg-[#5c001f] text-white font-medium rounded-lg hover:bg-[#7a0029] transition-colors focus:ring-4 focus:ring-[#e7ded3] outline-none"
    >
      Create New FYP Project
    </button>
  </div>
</template>
