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
  return (props.events || [])
    .filter((e) => !e.is_recurring && (e.date || e.target_date))
    .map((e) => ({
      event_id: e.id || e.event_id || Math.random().toString(),
      target_date: e.date || e.target_date,
      start_time: e.start_time || '09:00',
      end_time: e.end_time || '10:00',
      title: e.owner ? `[${e.owner}] ${e.title || e.label || 'Scheduled Event'}` : (e.title || e.label || 'Scheduled Event'),
      color: e.color || 'bg-[#5c001f] text-white',
      type: e.type || 'event',
    }))
})

const weeklyRecurring = computed(() => {
  const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 }
  return (props.events || [])
    .filter((e) => e.is_recurring || e.day_of_week || e.day_name)
    .map((e) => ({
      day_of_week: e.day_of_week || dayMap[e.day_name] || 1,
      day_name: e.day_name || 'Monday',
      start_time: e.start_time || '09:00',
      end_time: e.end_time || '10:00',
      label: e.owner ? `[${e.owner}] ${e.title || e.label || 'Slot'}` : (e.title || e.label || 'Slot'),
      type: e.type || 'class',
      code: e.code || '',
      color: e.color,
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
      :weeklyRecurring="weeklyRecurring"
      :specificEvents="specificEvents"
      :readOnly="true"
      :interactive="true"
      initialView="week"
    />
  </div>
</template>
