<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import utmLogo from '@/assets/UTM_ASCEND2030_WT.png'

const router = useRouter()
const currentYear = computed(() => new Date().getFullYear())

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const navigateTo = (path) => {
  router.push(path)
}
</script>

<template>
  <footer
    class="bg-[#4a0019] text-gray-200 border-t-4 border-[#f8be17] w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-[50px] mt-auto font-['Inter'] relative z-10 shrink-0 select-none"
  >
    <div class="max-w-7xl mx-auto flex flex-col gap-6">
      <!-- Top / Main Footer Row -->
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <!-- Left side: UTM & MJIIT Branding -->
        <div class="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div class="h-12 sm:h-14 flex items-center justify-center shrink-0">
            <img
              :src="utmLogo"
              alt="UTM Logo"
              class="h-full object-contain filter brightness-100 select-none pointer-events-none"
            />
          </div>
          <div class="h-8 w-px bg-white/20 hidden sm:block"></div>
          <div class="flex flex-col">
            <h4 class="text-white font-bold text-sm sm:text-base tracking-wide leading-tight">
              Universiti Teknologi Malaysia (UTM)
            </h4>
            <p class="text-[#ffea79] text-xs font-bold uppercase tracking-wider mt-1">
              Malaysia-Japan International Institute of Technology (MJIIT)
            </p>
          </div>
        </div>

        <!-- Right side: Quick Interactive Nav & Back To Top -->
        <div class="flex flex-col items-center md:items-end gap-3 text-center md:text-right w-full md:w-auto">
          <!-- Interactive Quick Nav Buttons for Mobile & Tablet -->
          <div class="flex items-center flex-wrap justify-center gap-2 text-xs">
            <button
              @click="navigateTo('/dashboard')"
              class="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg transition-all font-medium cursor-pointer"
            >
              Dashboard
            </button>
            <button
              @click="navigateTo('/profile')"
              class="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg transition-all font-medium cursor-pointer"
            >
              Profile
            </button>
            <button
              @click="scrollToTop"
              class="px-3 py-1.5 bg-[#f8be17] hover:bg-[#e0ab12] active:scale-95 text-[#4a0019] rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              title="Scroll to Top"
            >
              <span>Back to Top</span>
              <span>↑</span>
            </button>
          </div>

          <!-- Team Attribution & Copyright -->
          <div class="flex flex-col items-center md:items-end gap-1">
            <div class="text-xs text-white/90 font-medium">
              Made by the team: <strong class="font-bold text-white">Fukushima, Japan</strong>
            </div>
            <span class="text-[11px] text-white/60">
              © {{ currentYear }} MJIIT-UTM. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* Scoped styles clean and covered by Tailwind */
</style>
