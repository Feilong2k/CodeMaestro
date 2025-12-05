<template>
  <div class="chat-panel bg-bg-layer border border-line-base rounded-xl p-6 shadow-matrix-glow h-full flex flex-col">
    <!-- Message list area - takes available space -->
    <div class="message-list flex-1 space-y-4 mb-6 overflow-y-auto pr-2" ref="messageList">
      <MessageItem
        v-for="(msg, index) in messages"
        :key="index"
        :avatar-bg="msg.avatarBg"
        :avatar-text="msg.avatarText"
        :sender="msg.sender"
        :time="msg.time"
        :message="msg.text"
        :typing-effect="msg.typingEffect"
        :typing-speed="msg.typingSpeed"
        @typing-complete="onTypingComplete(index)"
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
import { ref, onMounted, nextTick } from 'vue'
import MessageItem from './MessageItem.vue'

const inputEl = ref(null)
const messageList = ref(null)

// Messages array
const messages = ref([
  {
    avatarBg: 'bg-accent-primary',
    avatarText: 'O',
    sender: 'Orion',
    time: 'Just now',
    text: 'Welcome to CodeMaestro. I\'m Orion, your AI development assistant. Ready to help you plan, build, and test.',
    typingEffect: false,
    typingSpeed: 20
  }
])

const onTypingComplete = (index) => {
  // Optionally handle when typing is complete for a message
  console.log(`Typing complete for message ${index}`)
}

const sendMessage = () => {
  const text = inputEl.value?.innerText?.trim()
  if (!text) return

  // Add user message
  messages.value.push({
    avatarBg: 'bg-accent-secondary',
    avatarText: 'U',
    sender: 'You',
    time: 'Now',
    text: text,
    typingEffect: false
  })

  // Clear input
  inputEl.value.innerText = ''

  // Simulate a response from Orion with typing effect
  setTimeout(() => {
    const response = `I received your message: "${text}". Here's a **bold** example and a \`code snippet\`.`
    messages.value.push({
      avatarBg: 'bg-accent-primary',
      avatarText: 'O',
      sender: 'Orion',
      time: 'Just now',
      text: response,
      typingEffect: true,
      typingSpeed: 20
    })
    
    // Scroll to bottom after adding new message
    nextTick(() => {
      if (messageList.value) {
        messageList.value.scrollTop = messageList.value.scrollHeight
      }
    })
  }, 500)
}

// Auto-scroll to bottom when messages change
onMounted(() => {
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
})
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
