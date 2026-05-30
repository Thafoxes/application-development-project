<script setup>
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { useCalendarStore } from "@/stores/calendarStore";

const calendarStore = useCalendarStore();
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black"
  >
    <!-- Header -->
    <AppHeader />

    <div class="flex flex-1 w-full relative">
      <!-- Side Navigation -->
      <!-- Not implemented yet -->

      <!-- Main Dashboard Content -->
      <main class="flex-1 flex flex-col px-12.5 py-7.5 gap-8 overflow-y-auto">
        <!-- Session Heading -->
        <div class="flex items-center justify-between w-full">
          <h1 class="font-['Inter'] font-bold text-[40px] text-black uppercase">
            {{
              calendarStore.isLoading
                ? "Loading session..."
                : calendarStore.activeSessionId
                  ? "Session " + calendarStore.activeSessionId
                  : "No active session"
            }}
          </h1>
        </div>

        <!-- Divider -->
        <hr class="border-[#2f2f2f] w-full" />

        <!-- Create FYP -->
        <div class="flex flex-col items-center">
          <h2 class="font-['Inter'] font-medium text-[32px] text-black">
            Hmm... It is empty here.
          </h2>
          <h2 class="font-['Inter'] font-medium text-[32px] text-black">
            Create your first project?
          </h2>

          <br />

          <button
            type="submit"
            class="bg-utm-maroon hover:bg-[#4a0019] text-white rounded-3xl font-medium transition-colors mt-2 px-8 py-3"
          >
            Create FYP
          </button>
        </div>
      </main>
    </div>

    <!-- Footer -->
    <AppFooter class="mt-auto -mb-7.5" />
  </div>
</template>
