<script setup>
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import InputField from "@/components/create_fyp_components/InputField.vue";
import InputTextArea from "@/components/create_fyp_components/InputTextArea.vue";
import { useCalendarStore } from "@/stores/calendarStore";
import { useRouter } from "vue-router";

const calendarStore = useCalendarStore();
const router = useRouter();
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black"
  >
    <!-- Header -->
    <AppHeader />

    <!-- Main Dashboard Content -->
    <main class="flex-1 flex flex-col px-12.5 py-7.5 gap-8 overflow-y-auto">
      <!-- Session Heading -->
      <h1 class="font-['Inter'] font-bold text-[40px] text-black uppercase">
        {{
          calendarStore.isLoading
            ? "Loading session..."
            : calendarStore.activeSessionId
              ? "Session " + calendarStore.activeSessionId
              : "No active session"
        }}
      </h1>

      <!-- Divider -->
      <hr class="border-[#2f2f2f] w-full" />

      <!-- Create FYP Form-->
      <div class="flex flex-col items-center">
        <h2 class="font-['Inter'] font-medium text-[32px] text-black">
          Create New FYP
        </h2>

        <br />

        <form
          class="bg-white flex flex-col px-6 py-8 rounded-2xl gap-8"
          @submit.prevent
        >
          <!-- Basic Info -->
          <div class="flex flex-col gap-4">
            <p class="font-roboto text-xl font-semibold">
              Please Complete Student Information In Detail. The Proposal Must
              Be Reviewed By The Supervisor Before Submission.
            </p>

            <p class="font-roboto text-base font-semibold text-red-600">
              *Students Are <b>ONLY ALLOWED</b> To Do Research Type Projects If
              They Have A Cgpa Of 3.3 And Above.
            </p>

            <InputField
              id="project-title"
              label="Project Title"
              placeholder="Project title"
              subtext="Enter a project you want to work on."
            />

            <InputField
              id="proposal-1"
              label="Proposal No.1"
              placeholder="Proposal no.1"
              subtext="The highest priority."
            />

            <InputField
              id="proposal-2"
              label="Proposal No.2"
              placeholder="Proposal no.2"
              subtext="The highest priority (optional)."
            />
          </div>

          <!-- Project Type -->
          <div class="flex flex-col gap-4">
            <fieldset
              class="border-2 border-solid border-[#89CFF0] rounded-lg p-5"
            >
              <legend class="font-sans text-[24px] font-normal">
                Project Type
              </legend>

              <label>
                <input type="radio" name="type" value="development" checked />
                Development
              </label>

              <br />

              <label>
                <input type="radio" name="type" value="research" />
                Research
              </label>

              <p class="font-sans text-[16px] font-medium text-[#757575] pt-4">
                Note: Research Is Only Allowed To Be Picked If Your CGPA Is
                Higher Than 3.3
              </p>
            </fieldset>

            <InputTextArea
              id="problem-background"
              label="Problem Background and Proposed Solution"
              placeholder="Write the problem background and proposed solution..."
            />

            <InputTextArea
              id="objectives"
              label="Objectives"
              placeholder="Write the objectives..."
            />

            <InputTextArea
              id="scopes"
              label="Scopes"
              placeholder="Write the scopes..."
            />
          </div>

          <!-- Project Requirements -->
          <div class="flex flex-col gap-4">
            <p class="font-sans text-[24px] font-normal">
              Project Requirements
            </p>

            <InputTextArea
              id="software"
              label="Software"
              placeholder="State the software used..."
            />

            <InputTextArea
              id="hardware"
              label="Hardware"
              placeholder="State the hardware used..."
            />

            <InputTextArea
              id="methodology"
              label="Technology / Technique / Method / Algorithm"
              placeholder="State the methodology used..."
            />

            <InputTextArea
              id="network"
              label="Network Elements"
              placeholder="State the network elements..."
            />

            <InputTextArea
              id="security"
              label="Security Elements"
              placeholder="State the security elements..."
            />

            <InputTextArea
              id="project-area"
              label="Project Area"
              placeholder="State the project area..."
            />
          </div>

          <!-- Buttons & Note -->
          <div class="flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-4">
              <button
                class="border-2 border-[#b1b1b1] bg-[#e2e2e2] rounded-lg p-2"
              >
                Save information
              </button>
              <button
                @click="router.push('/stud-dashboard-filled')"
                class="border-2 border-utm-maroon bg-utm-maroon text-white rounded-lg p-2"
              >
                Register
              </button>
            </div>
            <p class="font-inter text-base font-semibold text-red-600">
              *Save Information If You Do Not Want To Submit The Proposal
            </p>
          </div>
        </form>
      </div>
    </main>

    <!-- Footer -->
    <AppFooter class="mt-auto -mb-7.5" />
  </div>
</template>
