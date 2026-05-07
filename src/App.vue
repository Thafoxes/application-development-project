<script setup>
import { onMounted } from 'vue';
import axios from 'axios';

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/status');
    if (response.data && response.data.message === 'connected') {
      console.log('connected');
    }
  } catch (error) {
    console.error('Failed to connect to backend:', error);
  }
});
</script>

<template>
  <router-view />
</template>
