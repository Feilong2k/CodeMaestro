<template>
  <div class="message mb-2">
    <div 
      class="message-content compact-message font-matrix-sans whitespace-pre-wrap break-words rounded-lg px-4 pt-2 w-[95%] mx-auto max-w-full"
      :class="alignment === 'right' ? 'user-message' : 'bg-bg-elevated text-text-secondary border border-line-base'"
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
  typographer: true,
  breaks: false
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

<style scoped>
.message-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  max-width: 100%;
}

.compact-message {
  font-size: 0.875rem; /* 14px, 2 points smaller than base 16px */
  line-height: 1.3;
  padding: 0.5rem 1rem 0 1rem !important; /* top, right, bottom, left - bottom padding removed */
}

.compact-message :deep(*) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  font-size: 0.875rem;
  line-height: 1.3;
}

.compact-message :deep(p),
.compact-message :deep(h1),
.compact-message :deep(h2),
.compact-message :deep(h3),
.compact-message :deep(h4),
.compact-message :deep(h5),
.compact-message :deep(h6) {
  margin: 0;
  padding: 0;
}

.compact-message :deep(p + p) {
  margin-top: 0.25rem;
}

.compact-message :deep(ul),
.compact-message :deep(ol) {
  margin: 0;
  padding-left: 1.25rem;
}

.compact-message :deep(li) {
  margin: 0;
  padding: 0;
}

.compact-message :deep(li + li) {
  margin-top: 0;
}

/* Remove spacing between lists and surrounding content */
.compact-message :deep(ul + *),
.compact-message :deep(ol + *),
.compact-message :deep(* + ul),
.compact-message :deep(* + ol) {
  margin-top: 0;
}

/* Remove all heading spacing including before/after */
.compact-message :deep(h1),
.compact-message :deep(h2),
.compact-message :deep(h3),
.compact-message :deep(h4),
.compact-message :deep(h5),
.compact-message :deep(h6) {
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* Remove spacing between consecutive headings */
.compact-message :deep(h1 + h2),
.compact-message :deep(h2 + h3),
.compact-message :deep(h3 + h4),
.compact-message :deep(h4 + h5),
.compact-message :deep(h5 + h6),
.compact-message :deep(h1 + h1),
.compact-message :deep(h2 + h2),
.compact-message :deep(h3 + h3),
.compact-message :deep(h4 + h4),
.compact-message :deep(h5 + h5),
.compact-message :deep(h6 + h6) {
  margin-top: 0;
}

.user-message {
  background-color: #d1d5db !important; /* gray-300 */
  color: #111827 !important; /* gray-900 */
}

.user-message :deep(*) {
  color: #111827 !important;
}
</style>
