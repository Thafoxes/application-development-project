<script setup>
const props = defineProps({
  id: String,
  label: String,
  placeholder: String,
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id">{{ label }}</label>
    <textarea
      class="border-2 border-solid border-[#ccc] rounded-lg px-2 py-2"
      :placeholder="placeholder"
      :name="id"
      :id="id"
    ></textarea>
  </div>
</template>
