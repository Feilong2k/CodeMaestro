<template>
  <div class="chat-panel bg-bg-layer border border-line-base rounded-xl p-6 shadow-matrix-glow h-full flex flex-col overflow-x-hidden">
    <!-- Message list area - takes available space -->
    <div ref="messageListEl" class="message-list flex-1 space-y-4 mb-6 overflow-y-auto overflow-x-hidden pr-2 break-words">
      <MessageItem
        v-for="msg in chatStore.messages"
        :key="msg.id"
        :avatar-bg="getAvatarBg(msg.sender)"
        :avatar-text="getAvatarText(msg.sender)"
        :sender="msg.sender"
        :time="formatTimeAgo(msg.timestamp)"
        :message="msg.content"
        :typing-effect="msg.typingEffect || false"
        :typing-speed="5"
        :alignment="getAlignment(msg.sender)"
      />
      
      <!-- Typing indicator when waiting for response -->
      <div v-if="chatStore.sending" class="typing-indicator flex items-center space-x-2">
        <div class="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
        <div class="w-2 h-2 bg-accent-primary rounded-full animate-pulse animation-delay-200"></div>
        <div class="w-2 h-2 bg-accent-primary rounded-full animate-pulse animation-delay-400"></div>
        <span class="text-text-muted text-sm ml-2">Orion is typing...</span>
      </div>
    </div>

    <!-- Control area above input -->
    <div class="flex items-center justify-between mb-4">
      <!-- Plan/Act Toggle -->
      <div class="flex items-center bg-bg-layer/60 rounded-md p-1 border border-line-base/60">
        <button
          @click="setView('plan')"
          :class="[
            'px-4 py-1.5 rounded-sm text-sm font-medium transition-colors duration-fast font-matrix-sans',
            currentView === 'plan'
              ? 'bg-accent-primary text-bg-base shadow-matrix-glow'
              : 'text-text-secondary hover:text-text-primary hover:shadow-matrix-glow'
          ]"
        >
          Plan
        </button>
        <button
          @click="setView('act')"
          :disabled="chatStore.isActDisabled"
          :class="[
            'px-4 py-1.5 rounded-sm text-sm font-medium transition-colors duration-fast font-matrix-sans',
            currentView === 'act'
              ? 'bg-accent-primary text-bg-base shadow-matrix-glow'
              : 'text-text-secondary hover:text-text-primary hover:shadow-matrix-glow',
            chatStore.isActDisabled ? 'opacity-50 cursor-not-allowed hover:text-text-secondary hover:shadow-none' : ''
          ]"
        >
          Act
        </button>
      </div>

      <!-- Clear button only (compact toggle removed) -->
      <div class="flex items-center space-x-2">
        <button
          @click="chatStore.clearHistory()"
          class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-fast font-matrix-sans border bg-bg-layer/60 text-text-secondary border-line-base/60 hover:text-status-error hover:border-status-error hover:shadow-matrix-glow"
          title="Clear Chat History"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Input area - fixed at bottom -->
    <div class="flex items-end space-x-3">
      <!-- Normal mode: contenteditable div -->
      <div
        v-if="!terminalMode"
        ref="inputEl"
        class="chat-input flex-1 bg-bg-base border border-line-base rounded-lg p-3 min-h-[3rem] max-h-32 overflow-y-auto focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary"
        contenteditable="true"
        placeholder="Type your message..."
        role="textbox"
        aria-label="Chat input"
        @keydown.enter.prevent="sendMessage"
      />
      <!-- Terminal mode: textarea with multiline support -->
      <textarea
        v-else
        ref="textareaEl"
        class="terminal-input flex-1 bg-bg-base border border-line-base rounded-lg p-3 min-h-[3rem] max-h-32 overflow-y-auto focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary font-matrix-mono text-sm text-accent-primary placeholder:text-accent-primary/60 resize-none"
        placeholder="> Type your command (Alt+Enter for new line)..."
        aria-label="Terminal input"
        rows="1"
        @keydown="handleTerminalKeydown"
        @input="adjustTextareaHeight"
      ></textarea>
      <button
        class="send-button px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-bg-base rounded-lg font-medium transition-colors duration-fast shadow-matrix-glow hover:shadow-matrix-glow-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
        type="button"
        aria-label="Send message"
        :disabled="chatStore.sending"
        @click="sendMessage"
      >
        <span v-if="!chatStore.sending">Send</span>
        <span v-else class="inline-flex items-center">
          <svg class="animate-spin h-4 w-4 mr-2 text-bg-base" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Sending...
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '../stores/chat'
import { useAppStore } from '../stores/appStore'
import { storeToRefs } from 'pinia'
import MessageItem from './MessageItem.vue'

const inputEl = ref(null)
const textareaEl = ref(null)
const messageListEl = ref(null)
const chatStore = useChatStore()
const appStore = useAppStore()
const { currentView, terminalMode } = storeToRefs(appStore)
const { setCurrentView } = appStore

const sendMessage = async () => {
  let text = ''
  if (terminalMode.value && textareaEl.value) {
    text = textareaEl.value.value.trim()
  } else if (!terminalMode.value && inputEl.value) {
    text = inputEl.value.innerText.trim()
  }
  if (!text || chatStore.sending) return

  // Clear input
  if (terminalMode.value && textareaEl.value) {
    textareaEl.value.value = ''
    adjustTextareaHeight()
  } else if (!terminalMode.value && inputEl.value) {
    inputEl.value.innerText = ''
  }
  
  await chatStore.sendMessage(text)
  // Focus back on input
  nextTick(() => {
    if (terminalMode.value && textareaEl.value) {
      textareaEl.value.focus()
    } else if (!terminalMode.value && inputEl.value) {
      inputEl.value.focus()
    }
  })
}

const getAlignment = (sender) => {
  return sender === 'user' ? 'right' : 'left'
}

const setView = (view) => {
  setCurrentView(view)
}

const getAvatarBg = (sender) => {
  return sender === 'Orion' ? 'bg-accent-primary' : 'bg-accent-secondary'
}

const handleTerminalKeydown = (event) => {
  // Alt+Enter for new line
  if (event.altKey && event.key === 'Enter') {
    event.preventDefault()
    const textarea = event.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    textarea.value = text.substring(0, start) + '\n' + text.substring(end)
    textarea.selectionStart = textarea.selectionEnd = start + 1
    adjustTextareaHeight()
    return
  }
  // Enter without Alt to send
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault()
    sendMessage()
  }
}

const adjustTextareaHeight = () => {
  if (!textareaEl.value) return
  textareaEl.value.style.height = 'auto'
  const newHeight = Math.min(textareaEl.value.scrollHeight, 128) // max 128px
  textareaEl.value.style.height = newHeight + 'px'
}

const getAvatarText = (sender) => {
  return sender === 'Orion' ? 'O' : 'U'
}

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return `${diffDay}d ago`
}

// Auto-scroll to bottom when new messages are added
watch(() => chatStore.messages.length, async () => {
  await nextTick()
  scrollToBottom()
})

// Also scroll when the last message content changes (for typewriter effect)
watch(() => chatStore.messages[chatStore.messages.length - 1]?.content, async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })

// Scroll helper function
const scrollToBottom = () => {
  if (messageListEl.value) {
    messageListEl.value.scrollTo({
      top: messageListEl.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

// Periodic scroll during typewriter (for long messages)
let scrollInterval = null
// Focus management when terminal mode changes
watch(terminalMode, (isTerminal) => {
  nextTick(() => {
    if (isTerminal && textareaEl.value) {
      textareaEl.value.focus()
      adjustTextareaHeight()
    } else if (!isTerminal && inputEl.value) {
      inputEl.value.focus()
    }
  })
})

watch(() => chatStore.sending, (sending) => {
  if (sending) {
    scrollInterval = setInterval(scrollToBottom, 500)
  } else {
    if (scrollInterval) {
      clearInterval(scrollInterval)
      scrollInterval = null
    }
    // Final scroll after sending complete
    setTimeout(scrollToBottom, 100)
  }
})

onMounted(() => {
  // Initial scroll to bottom
  if (messageListEl.value) {
    messageListEl.value.scrollTop = messageListEl.value.scrollHeight
  }
  // Initial focus on normal input
  if (!terminalMode.value && inputEl.value) {
    inputEl.value.focus()
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
.typing-indicator {
  padding: 12px 16px;
}
.animation-delay-200 {
  animation-delay: 0.2s;
}
.animation-delay-400 {
  animation-delay: 0.4s;
}
</style>
