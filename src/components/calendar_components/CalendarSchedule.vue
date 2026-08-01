<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import SystemCalendarGrid from '@/components/calendar_components/SystemCalendarGrid.vue'

const props = defineProps({
  events: {
    type: Array,
    default: () => [],
  },
  hideAddMeetingButton: {
    type: Boolean,
    default: false,
  },
  constraints: {
    type: Object,
    default: () => ({ avoidWeekend: false, avoidOffWorkingHour: false, avoidLunchHour: false }),
  },
})

const router = useRouter()

// Convert events array into specificEvents and weeklyRecurring for SystemCalendarGrid
const specificEvents = computed(() => {
  return (props.events || []).map((e) => ({
    event_id: e.id || e.event_id || Math.random().toString(),
    target_date: e.date || e.target_date,
    start_time: e.start_time || '09:00',
    end_time: e.end_time || '10:00',
    title: e.title || e.label || 'Scheduled Event',
    color: e.color || 'bg-[#5c001f] text-white',
    type: e.type || 'event',
  }))
})
</script>

<template>
  <div class="w-full space-y-4 font-['Inter']">
    <div v-if="!hideAddMeetingButton" class="flex justify-end mb-2">
      <button
        @click="router.push('/create-meeting')"
        class="bg-[#f8be17] hover:bg-[#e0ab15] text-[#5c001f] font-bold px-5 py-2.5 rounded-2xl shadow transition-all inline-flex items-center gap-2 cursor-pointer"
      >
        <Plus class="w-5 h-5" /> Add New Meeting
      </button>
    </div>

    <!-- Unified Master System Calendar Grid -->
    <SystemCalendarGrid
      :weeklyRecurring="[]"
      :specificEvents="specificEvents"
      :readOnly="true"
      :interactive="true"
      initialView="week"
    />
  </div>
</template>
