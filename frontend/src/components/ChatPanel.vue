<template>
  <div class="chat-panel bg-bg-layer border border-line-base rounded-xl p-6 shadow-matrix-glow h-full flex flex-col">
    <!-- Message list area - takes available space -->
    <div class="message-list flex-1 space-y-4 mb-6 overflow-y-auto pr-2">
      <MessageItem
        avatar-bg="bg-accent-primary"
        avatar-text="O"
        sender="Orion"
        time="Just now"
        message="Welcome to CodeMaestro. I'm Orion, your AI development assistant. Ready to help you plan, build, and test."
      />
    </div>

    <!-- Input area - fixed at bottom -->
    <div class="flex items-end space-x-3">
      <div
        ref="inputEl"
        class="chat-input flex-1 bg-bg-base border border-line-base rounded-lg p-3 min-h-[3rem] max-h-32 overflow-y-auto focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary"
        contenteditable="true"
        placeholder="Type your message..."
        role="textbox"
        aria-label="Chat input"
        @keydown.enter.prevent="sendMessage"
      />
      <button
        class="send-button px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-bg-base rounded-lg font-medium transition-colors duration-fast shadow-matrix-glow hover:shadow-matrix-glow-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
        type="button"
        aria-label="Send message"
        @click="sendMessage"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MessageItem from './MessageItem.vue'

const inputEl = ref(null)

const sendMessage = () => {
  const text = inputEl.value?.innerText?.trim()
  if (!text) return
  // In a real app, you would emit an event or call an API here.
  console.log('Sending message:', text)
  inputEl.value.innerText = ''
}
</script>

<style scoped>
.chat-panel {
  /* No fixed min-height, let it fill parent via flex */
}
.message-list::-webkit-scrollbar {
  width: 6px;
}
.message-list::-webkit-scrollbar-track {
  background: rgba(12, 15, 18, 0.3);
  border-radius: 3px;
}
.message-list::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.4);
  border-radius: 3px;
}
.message-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 229, 255, 0.6);
}
.chat-input[placeholder]:empty:before {
  content: attr(placeholder);
  color: var(--text-muted);
  pointer-events: none;
}
</style>
