<script setup>
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import UserCard from "@/components/UserCard.vue";
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

        <p class="font-roboto font-medium text-3xl">Project: Project name</p>

        <!-- Grid Container -->
        <div class="grid-container">
          <div class="tracker-card" style="grid-area: box-1">
            <h1 class="text-lg font-medium">FYP Progress Tracker</h1>

            <div class="progress-container">
              <div class="progress-line"></div>

              <div class="step">
                <div class="circle active">01</div>
                <p style="color: black">1. Proposal Phase</p>
              </div>

              <div class="step">
                <div class="circle">02</div>
                <p>2. Document Submission</p>
              </div>

              <div class="step">
                <div class="circle">03</div>
                <p>3. Progress Report</p>
              </div>

              <div class="step">
                <div class="circle">04</div>
                <p>4. Presentation</p>
              </div>

              <div class="step">
                <div class="circle">05</div>
                <p>5. Final Deliverables</p>
              </div>
            </div>

            <div class="current-step">
              <strong>Current Step:</strong>
              Phase 1 - Submit Presentation Slide
            </div>

            <button class="submit-btn">Submit Now</button>
          </div>
          <div class="calendar" style="grid-area: box-2">
            <h1 class="text-lg font-medium pb-4">Important Dates</h1>
            <div class="cal-header">
              <span class="cal-title">June, 2026</span>
              <div class="cal-nav">
                <button aria-label="Previous month">&#8249;</button>
                <button aria-label="Next month">&#8250;</button>
              </div>
            </div>

            <div class="cal-grid">
              <!-- Day labels -->
              <div class="cal-label">Sun</div>
              <div class="cal-label">Mon</div>
              <div class="cal-label">Tue</div>
              <div class="cal-label">Wed</div>
              <div class="cal-label">Thu</div>
              <div class="cal-label">Fri</div>
              <div class="cal-label">Sat</div>

              <!-- Week 1: overflow from August -->
              <div class="cal-cell muted">31</div>
              <div class="cal-cell">1</div>
              <div class="cal-cell">2</div>
              <div class="cal-cell">3</div>
              <div class="cal-cell highlight-maroon">4</div>
              <div class="cal-cell">5</div>
              <div class="cal-cell">6</div>

              <!-- Week 2 -->
              <div class="cal-cell">7</div>
              <div class="cal-cell highlight-maroon">8</div>
              <div class="cal-cell">9</div>
              <div class="cal-cell">10</div>
              <div class="cal-cell">11</div>
              <div class="cal-cell">12</div>
              <div class="cal-cell">13</div>

              <!-- Week 3 -->
              <div class="cal-cell">14</div>
              <div class="cal-cell">15</div>
              <div class="cal-cell">16</div>
              <div class="cal-cell">17</div>
              <div class="cal-cell">18</div>
              <div class="cal-cell">19</div>
              <div class="cal-cell">20</div>

              <!-- Week 4 -->
              <div class="cal-cell">21</div>
              <div class="cal-cell">22</div>
              <div class="cal-cell">23</div>
              <div class="cal-cell highlight-maroon">24</div>
              <div class="cal-cell">25</div>
              <div class="cal-cell">26</div>
              <div class="cal-cell">27</div>

              <!-- Week 5 -->
              <div class="cal-cell">28</div>
              <div class="cal-cell">29</div>
              <div class="cal-cell">30</div>
              <div class="cal-cell muted">1</div>
              <div class="cal-cell muted">2</div>
              <div class="cal-cell muted">3</div>
              <div class="cal-cell muted">4</div>
            </div>
          </div>
          <UserCard
            style="grid-area: box-3"
            img_url="/images/man-1.jpg"
            title="My Supervisor"
            username="Dr. John Michael Smith"
            email="john.m@utm.my"
          />
          <UserCard
            style="grid-area: box-4"
            img_url="/images/woman-1.jpg"
            title="My Examiner"
            username="Dr. Elizabeth Ann Smith"
            email="elizabeth.a@utm.my"
          />
          <UserCard
            style="grid-area: box-5"
            img_url="/images/woman-2.jpg"
            title="My Examiner"
            username="Dr. Margaret Mary Johnson"
            email="margaret.m@utm.my"
          />
          <div style="grid-area: box-6">
            
          </div>
        </div>
      </main>
    </div>

    <!-- Footer -->
    <AppFooter class="mt-auto -mb-7.5" />
  </div>
</template>

<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-auto-rows: auto;
  gap: 1rem;
  grid-template-areas:
    "box-1 box-1 box-2"
    "box-3 box-4 box-5"
    "box-6 box-6 box-6";
}

/* Progress tracker */

.tracker-card {
  padding: 20px;
  border-radius: 0.75rem;
  background: white;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.tracker-card h1 {
  margin-bottom: 30px;
}

.progress-container {
  position: relative;
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.progress-line {
  position: absolute;
  top: 14px;
  left: 35px;
  right: 35px;
  height: 4px;
  background: #cbd5e1;
  z-index: 0;
}

.step {
  position: relative;
  z-index: 1;
  width: 100px;
  text-align: center;
}

.circle {
  width: 30px;
  height: 30px;
  margin: 0 auto;
  border-radius: 50%;
  border: 2px solid #7a0225;
  background: white;
  color: #666;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
}

.circle.active {
  background: #6b7280;
  color: white;
}

.step p {
  margin-top: 10px;
  font-size: 12px;
  color: #94a3b8;
}

.current-step {
  margin-bottom: 20px;
  font-size: 18px;
}

.submit-btn {
  margin-top: 0.75rem;
  border-radius: 2rem;
  background-color: #7a0225;
  padding: 0.5rem 1rem;
  font-weight: 500;
  color: white;

  transition: background-color 150ms ease-in-out;
}

.submit-btn:hover {
  background-color: #5f011c;
}

/* Calendar */

.calendar {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 20px 18px 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.cal-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.cal-nav {
  display: flex;
  gap: 4px;
}

.cal-nav button {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 18px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 6px;
  transition:
    background 0.15s,
    color 0.15s;
}

.cal-nav button:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Day-of-week labels */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  row-gap: 4px;
}

.cal-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  padding-bottom: 6px;
  letter-spacing: 0.02em;
}

/* Individual day cells */
.cal-cell {
  font-size: 12px;
  color: #374151;
  height: 30px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border-radius: 50%;
  cursor: default;
  transition: background 0.1s;
}

.cal-cell:hover {
  background: #f3f4f6;
}

.cal-cell.muted {
  color: #d1d5db;
}

/* Highlighted dots */
.cal-cell.highlight-maroon {
  background: #7a0225;
  color: white;
  font-weight: 600;
}
</style>
