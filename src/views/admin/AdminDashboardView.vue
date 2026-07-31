<script setup>
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import RoleSidebar from '@/components/RoleSidebar.vue'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  GraduationCap,
  UserCheck,
} from 'lucide-vue-next'

const router = useRouter()

const cards = [
  { label: 'Total Users', value: '13', icon: Users },
  { label: 'Students', value: '5', icon: GraduationCap },
  { label: 'Staff / Supervisors', value: '6', icon: UserCheck },
  { label: 'Admin Access', value: '1', icon: ShieldCheck },
]

const recentActions = [
  'Review newly registered student accounts',
  'Assign or remove user roles',
  'Reset user password when required',
  'Update student, supervisor and coordinator details',
]
</script>

<template>
  <div class="min-h-screen bg-[#e7ded3] text-black font-sans">
    <AppHeader />

    <div class="flex flex-col md:flex-row flex-1 w-full min-w-0">
      <RoleSidebar role="Coordinator" />

      <main class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 overflow-x-hidden">
        <section class="rounded-2xl sm:rounded-[28px] bg-[#5c001f] text-white p-5 sm:p-8 shadow-lg relative overflow-hidden">
          <p class="uppercase tracking-[0.25em] text-[#f8be17] text-xs sm:text-sm font-bold">I-FAMOUS Admin</p>
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold mt-2">Admin Dashboard</h1>
          <p class="mt-2 text-sm sm:text-base text-white/80 max-w-3xl">Manage user accounts, assign roles, reset passwords and maintain student, supervisor and coordinator access.</p>
          <div class="absolute -right-10 -top-10 w-44 h-44 bg-[#f8be17]/20 rounded-full"></div>
        </section>

        <section class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div v-for="card in cards" :key="card.label" class="bg-white rounded-[20px] p-6 border border-[#d8c9bd] shadow-md">
            <component :is="card.icon" class="w-7 h-7 text-[#5c001f] mb-4" />
            <p class="text-sm font-bold text-gray-500">{{ card.label }}</p>
            <p class="text-3xl font-extrabold text-[#5c001f] mt-2">{{ card.value }}</p>
          </div>
        </section>

        <section class="bg-white rounded-[24px] border border-[#d8c9bd] shadow-md p-7">
          <div class="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 class="text-2xl font-extrabold">Admin Responsibilities</h2>
              <p class="text-gray-600 text-sm mt-1">Use Manage Users to control roles and account access.</p>
            </div>
            <button @click="router.push('/admin-users')" class="px-6 py-3 rounded-full bg-[#5c001f] text-white font-bold hover:bg-[#4a0019]">Open Manage Users</button>
          </div>

          <div class="space-y-3">
            <div v-for="item in recentActions" :key="item" class="flex items-center gap-3 rounded-xl bg-[#f7f1ea] border border-[#d8c9bd] px-4 py-3">
              <KeyRound class="w-5 h-5 text-[#5c001f]" />
              <span class="font-semibold">{{ item }}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>
