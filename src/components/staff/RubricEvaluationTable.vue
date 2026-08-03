<script setup>
import { computed } from 'vue'

const props = defineProps({
  rubric: {
    type: Array,
    default: () => [],
  },
  scoreMap: {
    type: Object,
    default: () => ({}),
  },
  commentMap: {
    type: Object,
    default: () => ({}),
  },
  locked: {
    type: Boolean,
    default: false,
  },
})

const total = computed(() =>
  props.rubric.reduce((sum, item) => sum + Number(props.scoreMap[item.rubric_item_id] || 0), 0),
)

const maxTotal = computed(() =>
  props.rubric.reduce((sum, item) => sum + Number(item.max_score || 0), 0),
)

const percentage = computed(() =>
  maxTotal.value ? ((total.value / maxTotal.value) * 100).toFixed(2) : '0.00',
)
</script>

<template>
  <section class="bg-white rounded-[26px] p-6 shadow border border-slate-200/90 space-y-4">
    <div class="flex justify-between items-center gap-4 flex-wrap">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-900">Official grading rubric</h2>
        <p class="text-slate-500 font-medium mt-0.5">Maximum scores are enforced for each criterion.</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-slate-500">Calculated score</p>
        <p class="text-3xl font-extrabold text-[#5c001f]">
          {{ total }} / {{ maxTotal }}
          <span class="text-lg text-slate-600 font-bold">({{ percentage }}%)</span>
        </p>
      </div>
    </div>

    <div class="overflow-x-auto mt-4">
      <table class="w-full min-w-[760px]">
        <thead>
          <tr class="bg-[#f7f1ea] text-left text-slate-900 font-bold border-b border-[#e1d5cc]">
            <th class="p-3">Criterion</th>
            <th class="p-3">Description</th>
            <th class="p-3 w-28">Max Score</th>
            <th class="p-3 w-36">Assigned Score</th>
            <th class="p-3">Criterion feedback / comments</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="item in rubric" :key="item.rubric_item_id" class="hover:bg-slate-50/60 transition-colors">
            <td class="p-3 font-bold text-slate-900">{{ item.criterion }}</td>
            <td class="p-3 text-sm text-slate-600 font-medium">{{ item.description }}</td>
            <td class="p-3 font-bold text-slate-800">{{ item.max_score }}</td>
            <td class="p-3">
              <input
                v-model.number="scoreMap[item.rubric_item_id]"
                :disabled="locked"
                type="number"
                min="0"
                :max="item.max_score"
                class="w-28 border-2 border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 disabled:bg-slate-100 disabled:text-slate-700 transition-all"
              />
            </td>
            <td class="p-3">
              <input
                v-model="commentMap[item.rubric_item_id]"
                :disabled="locked"
                class="w-full border-2 border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:border-[#5c001f] focus:outline-none focus:ring-4 focus:ring-[#5c001f]/15 disabled:bg-slate-100 disabled:text-slate-700 transition-all"
                placeholder="Optional criterion comment..."
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
