<script setup>
const props = defineProps({
  img_url: String,
  title: String,
  username: String,
  email: String,
});
</script>

<template>
  <article
    class="flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-lg"
  >
    <img
      :src="img_url"
      alt="Card preview image"
      class="h-52 w-full object-cover"
    />

    <div class="flex flex-col gap-2 p-5">
      <h2 class="text-xl font-semibold text-gray-900">
        {{ title }}
      </h2>

      <p class="text-sm text-gray-600">
        {{ username }}
      </p>

      <p class="text-sm text-gray-600">Contact: {{ email }}</p>

      <button
        class="mt-3 rounded-lg bg-[#7A0225] px-4 py-2 font-medium text-white transition-colors hover:bg-[#5f011c]"
      >
        View Profile
      </button>
    </div>
  </article>
</template>
