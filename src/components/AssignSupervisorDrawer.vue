<script setup>
import AssignSupervisorPanel from '@/components/AssignSupervisorPanel.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  project: {
    type: Object,
    default: null
  },
  records: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'assigned'])
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end font-sans text-black">
    <!-- Backdrop Scrim Mask Layer -->
    <div 
      @click="$emit('close')" 
      class="fixed inset-0 bg-black/40 z-40 transition-opacity backdrop-blur-xs"
    ></div>
    
    <!-- Right-Side Surface Sheet Box Canvas -->
    <div class="fixed right-0 top-0 h-full w-[520px] bg-white z-50 shadow-2xl flex flex-col border-l border-gray-200 overflow-y-auto p-6">
      
      <!-- Reusable supervisor panel -->
      <AssignSupervisorPanel
        v-if="project"
        :project="project"
        :records="records"
        @close="$emit('close')"
        @assigned="(val) => { $emit('assigned', val); }"
      />

    </div>
  </div>
</template>
