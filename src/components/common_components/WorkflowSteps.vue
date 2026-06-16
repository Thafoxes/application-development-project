<script setup>
defineProps({
  steps: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
    <div
      v-for="(step, index) in steps"
      :key="index"
      class="bg-white rounded-lg p-6 shadow-lg border border-black/10 transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
    >
      <div class="w-14 h-14 rounded-lg bg-[#5c001f] p-3 flex items-center justify-center">
        <!-- Render the dynamic icon component if provided -->
        <component
          :is="step.icon"
          class="w-7 h-7 text-[#f8be17]"
        />
      </div>
      <p class="text-gray-500 font-semibold mt-5">{{ step.stepLabel || `Step ${index + 1}` }}</p>
      <h3 class="text-xl font-bold text-black mt-1">{{ step.title }}</h3>
      <p class="text-sm text-gray-500 mt-2">
        {{ step.description }}
      </p>
    </div>
  </section>
</template>
