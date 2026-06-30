# Visual Layout Consistency

## Core Shell Components
Always structure primary page views and role-based workspaces inside the global application layout frame. Utilize the following three common shell components:
- **Header**: `@/components/common_components/AppHeader.vue`
- **Sidebar**: `@/components/common_components/AppSidebar.vue`
- **Footer**: `@/components/common_components/AppFooter.vue`

## Implementation Pattern
Maintain a clear split layout that embeds the main body dynamically while keeping the outer shell stable. Avoid complex styling inside structural frames; prioritize clean, simple, and readable structures that are easy to study. For example:

```vue
<script setup>
import AppHeader from '@/components/common_components/AppHeader.vue'
import AppSidebar from '@/components/common_components/AppSidebar.vue'
import AppFooter from '@/components/common_components/AppFooter.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#e7ded3] w-full font-['Inter'] text-black">
    <!-- 1. Header (Fixed top) -->
    <AppHeader />

    <!-- 2. Middle section (Sidebar + Main viewport area) -->
    <div class="flex flex-1 w-full relative">
      <AppSidebar />
      <main class="flex-1 flex flex-col px-4 md:px-10 py-8 gap-6 overflow-y-auto">
        <!-- Main contents go here -->
      </main>
    </div>

    <!-- 3. Footer (Fixed bottom) -->
    <AppFooter />
  </div>
</template>
```
