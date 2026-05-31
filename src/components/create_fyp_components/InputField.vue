<script setup>
const props = defineProps({
  id: String,
  label: String,
  placeholder: String,
  subtext: String
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id">{{ label }}</label>
    <input
      class="border-2 border-solid border-[#ccc] rounded-lg px-1 py-1"
      type="text"
      :id="id"
      :name="id"
      :placeholder="placeholder"
    />
    <small class="text-gray-600">{{ subtext }}</small>
  </div>
</template>
