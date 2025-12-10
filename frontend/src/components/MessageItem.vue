<template>
  <div class="message mb-4">
    <div 
      class="message-content font-matrix-sans whitespace-pre-wrap rounded-lg px-4 py-3 w-[95%] mx-auto"
      :class="[
        alignment === 'right' ? 'bg-gray-100 text-text-primary' : 'bg-bg-elevated text-text-secondary border border-line-base'
      ]"
      v-html="renderedMessage"
      ref="messageContent"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const props = defineProps({
  avatarBg: {
    type: String,
    default: 'bg-accent-primary'
  },
  avatarText: {
    type: String,
    default: 'O'
  },
  sender: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  typingEffect: {
    type: Boolean,
    default: false
  },
  typingSpeed: {
    type: Number,
    default: 20 // ms per character
  },
  compact: {
    type: Boolean,
    default: false
  },
  alignment: {
    type: String,
    default: 'left', // 'left' or 'right'
    validator: (value) => ['left', 'right'].includes(value)
  }
})

const emit = defineEmits(['typing-complete'])

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
})

const messageContent = ref(null)
const displayedText = ref('')
const typingInterval = ref(null)
const isTypingComplete = ref(false)

// Simple HTML escape for plain text display during typing
const escapeHtml = (text) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const renderedMessage = computed(() => {
  if (props.typingEffect && !isTypingComplete.value) {
    // During typing, show plain text (escaped) with line breaks
    const escaped = escapeHtml(displayedText.value)
    return escaped.replace(/\n/g, '<br>')
  }
  
  // After typing complete, render markdown
  const unsafeHtml = md.render(props.message)
  return DOMPurify.sanitize(unsafeHtml)
})

const startTypingEffect = () => {
  if (!props.typingEffect) return
  
  displayedText.value = ''
  isTypingComplete.value = false
  let index = 0
  // Adaptive chunk size: larger chunks for longer messages to reduce updates
  const baseChunkSize = 5
  const chunkSize = props.message.length > 1000 ? 20 : baseChunkSize
  
  typingInterval.value = setInterval(() => {
    if (index < props.message.length) {
      // Add chunk of characters per tick
      const endIndex = Math.min(index + chunkSize, props.message.length)
      displayedText.value = props.message.substring(0, endIndex)
      index = endIndex
      
      // Auto-scroll the parent container when typing
      if (messageContent.value?.parentElement?.parentElement?.parentElement) {
        const container = messageContent.value.parentElement.parentElement.parentElement
        container.scrollTop = container.scrollHeight
      }
    } else {
      isTypingComplete.value = true
      clearInterval(typingInterval.value)
      emit('typing-complete')
    }
  }, props.typingSpeed)
}

onMounted(() => {
  if (props.typingEffect) {
    startTypingEffect()
  }
})

onUnmounted(() => {
  if (typingInterval.value) {
    clearInterval(typingInterval.value)
  }
})

watch(() => props.message, () => {
  if (props.typingEffect && !isTypingComplete.value) {
    // Restart typing effect if message changes
    startTypingEffect()
  }
})
</script>
