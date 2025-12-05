<template>
  <div class="message bg-bg-elevated border border-line-base rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center shadow-matrix-glow"
        :class="avatarBg"
      >
        <span class="text-bg-base font-bold text-sm">{{ avatarText }}</span>
      </div>
      <div class="flex-1">
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold text-text-primary font-matrix-sans">{{ sender }}</span>
          <span class="text-xs text-text-muted font-matrix-mono">{{ time }}</span>
        </div>
        <div 
          class="message-content text-text-secondary font-matrix-sans whitespace-pre-wrap"
          v-html="renderedMessage"
          ref="messageContent"
        />
      </div>
    </div>
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

const renderedMessage = computed(() => {
  if (props.typingEffect && !isTypingComplete.value) {
    // For typing effect, we need to render markdown incrementally
    // This is complex with markdown, so we'll show plain text while typing
    // and switch to markdown when complete
    return DOMPurify.sanitize(md.render(displayedText.value))
  }
  
  const unsafeHtml = md.render(props.message)
  return DOMPurify.sanitize(unsafeHtml)
})

const startTypingEffect = () => {
  if (!props.typingEffect) return
  
  displayedText.value = ''
  isTypingComplete.value = false
  let index = 0
  
  typingInterval.value = setInterval(() => {
    if (index < props.message.length) {
      displayedText.value += props.message.charAt(index)
      index++
      
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
