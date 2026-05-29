<template>
  <div>
    <!-- State 1: Collapsed (Floating Action Button) -->
    <button
      v-if="widgetState === 1"
      @click="widgetState = 2"
      class="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#5C001F] hover:bg-[#5C001F]/90 shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-105 p-0 border-none cursor-pointer"
    >
      <Bot class="h-7 w-7 text-[#F8BE17]" />
    </button>

    <!-- State 2 & 3: Expanded / Maximized Chat Window -->
    <div
      v-else
      class="fixed bottom-6 right-6 flex flex-col shadow-2xl transition-all duration-300 ease-in-out z-50 bg-white border border-gray-200 overflow-hidden"
      :class="{
        'w-[350px] h-[500px] rounded-xl': widgetState === 2,
        'w-[90vw] h-[90vh] max-w-[800px] max-h-[800px] rounded-xl sm:right-1/2 sm:bottom-1/2 sm:translate-x-1/2 sm:translate-y-1/2': widgetState === 3
      }"
    >
      <!-- Header -->
      <div class="bg-[#5C001F] text-white px-4 py-3 flex flex-row items-center justify-between space-y-0 shadow-sm shrink-0 rounded-t-xl">
        <div class="flex items-center gap-2">
          <Sparkles class="h-5 w-5 text-[#F8BE17]" />
          <h3 class="text-base font-semibold tracking-wide m-0">I-FAMOUS AI Assistant</h3>
        </div>
        <div class="flex items-center gap-1">
          <button 
            class="h-8 w-8 inline-flex items-center justify-center text-white hover:text-[#F8BE17] hover:bg-white/10 transition-colors rounded-md border-none bg-transparent cursor-pointer" 
            @click="toggleMaximize"
          >
            <Maximize2 v-if="widgetState === 2" class="h-4 w-4" />
            <Minimize2 v-else class="h-4 w-4" />
          </button>
          <button 
            class="h-8 w-8 inline-flex items-center justify-center text-white hover:text-[#F8BE17] hover:bg-white/10 transition-colors rounded-md border-none bg-transparent cursor-pointer" 
            @click="widgetState = 1"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <!-- Body -->
      <div class="flex-1 p-4 bg-gray-50 flex flex-col gap-3 overflow-y-auto" ref="scrollAreaRef">
        <div class="flex flex-col gap-4 pb-4">
          <div 
            v-for="(msg, idx) in chatHistory" 
            :key="idx" 
            class="flex w-full"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div 
              class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm"
              :class="msg.role === 'user' 
                ? 'bg-[#5C001F] text-white rounded-br-sm' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'"
            >
              {{ msg.content }}
            </div>
          </div>
          
          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex justify-start w-full">
             <div class="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 bg-white border border-gray-100 shadow-sm flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
             </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-3 bg-white border-t rounded-b-xl shrink-0 m-0">
        <form @submit.prevent="sendMessage" class="flex w-full items-center gap-2">
          <input 
            v-model="newMessage" 
            placeholder="Ask about UTM FYP rules or schedules..." 
            class="flex-1 focus:outline-none focus:ring-2 focus:ring-[#5C001F] rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm"
            :disabled="isLoading"
          />
          <button 
            type="submit" 
            class="rounded-full bg-[#5C001F] hover:bg-[#5C001F]/90 text-white shrink-0 shadow-sm h-10 w-10 flex items-center justify-center p-0 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isLoading || !newMessage.trim()"
          >
            <Send class="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import axios from 'axios'

// Lucide Icons
import { Bot, Sparkles, Maximize2, Minimize2, X, Send } from 'lucide-vue-next'

// Widget State: 1 = Collapsed, 2 = Expanded, 3 = Maximized
const widgetState = ref(1)

// Chat State
const newMessage = ref('')
const isLoading = ref(false)
const chatHistory = ref([
  { role: 'assistant', content: 'Hello! I am the I-FAMOUS AI Assistant. How can I help you with your FYP schedule today?' }
])

const scrollAreaRef = ref(null)

const toggleMaximize = () => {
  widgetState.value = widgetState.value === 2 ? 3 : 2
}

const scrollToBottom = async () => {
  await nextTick()
  const scrollElement = scrollAreaRef.value
  if (scrollElement) {
    scrollElement.scrollTop = scrollElement.scrollHeight
  }
}

const sendMessage = async () => {
  const content = newMessage.value.trim()
  if (!content || isLoading.value) return

  chatHistory.value.push({ role: 'user', content })
  newMessage.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    const response = await axios.post('http://localhost:3000/api/assistant/chat', {
      messages: chatHistory.value
    })

    if (response.data.success && response.data.reply) {
      chatHistory.value.push(response.data.reply)
    } else {
      chatHistory.value.push({ role: 'assistant', content: "I'm sorry, I received an invalid response from the server." })
    }
  } catch (error) {
    console.error("Chat error:", error)
    chatHistory.value.push({ role: 'assistant', content: "Sorry, the AI Assistant is currently unavailable." })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>
