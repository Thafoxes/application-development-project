<script setup>
import { ClipboardCheck, FolderKanban } from 'lucide-vue-next'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
  role: {
    type: String,
    default: 'supervisor', // 'supervisor' | 'examiner'
  },
})

const emit = defineEmits(['click'])
</script>

<template>
  <article
    @click="emit('click', project)"
    class="bg-white rounded-[24px] p-6 shadow-md border-2 border-slate-200/90 flex flex-col justify-between space-y-4 hover:border-[#5c001f] transition-all cursor-pointer group"
  >
    <div>
      <div class="flex justify-between items-center gap-3">
        <div class="flex items-center gap-2">
          <FolderKanban v-if="role === 'supervisor'" class="w-6 h-6 text-[#5c001f]" />
          <ClipboardCheck v-else class="w-6 h-6 text-[#5c001f]" />
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {{ role === 'supervisor' ? 'Supervised FYP' : 'Examination Case' }}
          </span>
        </div>

        <span
          class="px-3 py-1 rounded-full text-xs font-bold"
          :class="
            project.evaluation_status === 'Submitted' || project.status === 'Active'
              ? 'bg-green-100 text-green-800'
              : 'bg-amber-100 text-amber-800'
          "
        >
          {{ project.evaluation_status || project.status || 'Active' }}
        </span>
      </div>

      <h3 class="text-xl font-extrabold text-slate-900 mt-3 group-hover:text-[#5c001f] transition-colors leading-snug">
        {{ project.project_title || project.title }}
      </h3>

      <div class="mt-2 space-y-1 text-sm">
        <p class="font-semibold text-slate-700">
          {{ project.student_name || project.studentName }}
          <span class="text-slate-500 font-normal" v-if="project.matric_no || project.matricNo">
            ({{ project.matric_no || project.matricNo }})
          </span>
        </p>
        <p class="text-slate-600 font-medium text-xs" v-if="role === 'examiner' && project.supervisor_name">
          <strong>Supervisor:</strong> {{ project.supervisor_name }}
        </p>
        <p class="text-slate-600 font-medium text-xs" v-if="role === 'supervisor' && project.examiner_name">
          <strong>Examiner:</strong> {{ project.examiner_name }}
        </p>
      </div>
    </div>

    <div class="pt-2">
      <button
        class="w-full bg-[#5c001f] group-hover:bg-[#430016] text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow transition-all cursor-pointer"
      >
        {{ role === 'supervisor' ? 'Open FYP Assessment & Journey' : project.evaluation_status === 'Submitted' ? 'View Evaluation' : 'Review and Grade' }}
      </button>
    </div>
  </article>
</template>
