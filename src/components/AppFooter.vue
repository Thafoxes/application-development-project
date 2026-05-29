<script setup>
import { computed } from 'vue'
import utmLogo from '@/assets/UTM_ASCEND2030_WT.png'

const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="bg-[#2d000f] text-gray-300 border-t-4 border-[#f8be17] w-full py-8 px-6 lg:px-[50px] mt-auto font-['Inter'] relative z-10 shrink-0">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      
      <!-- Left side: UTM & MJIIT Branding -->
      <div class="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
        <div class="h-12 flex items-center justify-center shrink-0">
          <img 
            :src="utmLogo" 
            alt="UTM Logo" 
            class="h-full object-contain filter brightness-100 select-none pointer-events-none" 
          />
        </div>
        <div class="h-8 w-px bg-white/20 hidden md:block"></div>
        <div class="flex flex-col">
          <h4 class="text-white font-bold text-base tracking-wide leading-tight">
            Universiti Teknologi Malaysia (UTM)
          </h4>
          <p class="text-[#f8be17] text-xs font-semibold uppercase tracking-wider mt-1">
            Malaysia-Japan International Institute of Technology (MJIIT)
          </p>
        </div>
      </div>

      <!-- Right side: Creator Attribution -->
      <div class="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
        <div class="flex items-center gap-2 bg-[#5c001f]/40 border border-[#f8be17]/30 rounded-full px-4 py-1.5 text-xs text-white shadow-md backdrop-blur-sm select-none">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
          <span>Made by the <strong class="font-bold text-white">Fukushima, Japan Team</strong></span>
        </div>
        <span class="text-[11px] text-white/50">
          © {{ currentYear }} MJIIT-UTM. All rights reserved.
        </span>
      </div>

    </div>
  </footer>
</template>

<style scoped>
/* Scoped styles can be added here if needed, but Tailwind classes cover everything */
</style>
