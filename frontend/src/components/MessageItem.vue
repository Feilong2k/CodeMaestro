<template>
  <div 
    class="message rounded-lg p-4"
    :class="[
      compact ? 'p-2' : 'p-4',
      alignment === 'right' ? 'user-message' : 'orion-message'
    ]"
  >
    <div class="flex items-start space-x-3" :class="{ 'flex-row-reverse space-x-reverse': alignment === 'right' }">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center shadow-matrix-glow shrink-0"
        :class="avatarBg"
      >
        <span class="text-bg-base font-bold" :class="compact ? 'text-xs' : 'text-sm'">{{ avatarText }}</span>
      </div>
      <div class="flex-1" :class="{ 'text-right': alignment === 'right' }">
        <div class="flex items-center justify-between mb-1" :class="{ 'flex-row-reverse': alignment === 'right' }">
          <span class="font-semibold text-text-primary font-matrix-sans" :class="compact ? 'text-sm' : ''">{{ sender }}</span>
          <span class="text-xs text-text-muted font-matrix-mono">{{ time }}</span>
        </div>
        <div 
          class="message-content font-matrix-sans whitespace-pre-wrap rounded-lg px-3 py-2 max-w-[80%]"
          :class="[
            compact ? 'text-sm' : 'text-text-secondary',
            alignment === 'right' 
              ? 'bg-accent-secondary text-bg-base ml-auto' 
              : 'bg-bg-elevated text-text-secondary border border-line-base'
          ]"
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
  const chunkSize = 5 // Type 5 characters at a time for faster display
  
  typingInterval.value = setInterval(() => {
    if (index < props.message.length) {
      // Add multiple characters per tick
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
