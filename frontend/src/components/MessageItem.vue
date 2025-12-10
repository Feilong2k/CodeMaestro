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
// Compact markup: minimize spacing in paragraphs, headings, and lists
md.renderer.rules.paragraph_open = () => '<p style="margin:0 0 1em 0;">';
md.renderer.rules.paragraph_close = () => '</p>';
md.renderer.rules.heading_open = (tokens, idx) => {
  const tag = tokens[idx].tag;
  return `<${tag} style="margin:0.5em 0 0.25em 0;padding:0;">`;
};
md.renderer.rules.heading_close = (tokens, idx) => `</${tokens[idx].tag}>`;
md.renderer.rules.bullet_list_open = () => '<ul style="margin:0 0 1em 0;padding-left:1.25rem;list-style-type:disc;">';
md.renderer.rules.bullet_list_close = () => '</ul>';
md.renderer.rules.ordered_list_open = () => '<ol style="margin:0 0 1em 0;padding-left:1.25rem;list-style-type:decimal;">';
md.renderer.rules.ordered_list_close = () => '</ol>';
md.renderer.rules.list_item_open = () => '<li style="margin:0;padding:0;">';
md.renderer.rules.list_item_close = () => '</li>';
// Collapse softbreaks to a single space; keep hardbreaks as single <br>
const _soft = md.renderer.rules.softbreak || (() => '\n');
md.renderer.rules.softbreak = () => ' ';
const _hard = md.renderer.rules.hardbreak || (() => '<br/>');
md.renderer.rules.hardbreak = () => '<br/>';

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

// Preprocess message to enforce single-space after sentence punctuation when a newline is used
// Does not alter list items, headings, or code blocks
function preprocessMessage(src) {
  if (!src) return ''
  // Protect code fences by splitting on ``` blocks
  const parts = String(src).split(/```/)
  for (let i = 0; i < parts.length; i += 2) {
    // Only process non-code segments (even indices)
    parts[i] = parts[i]
      // Replace newline after sentence punctuation with a single space
      // when the next line does not start with list/heading markers
      .replace(/([.!?])\s*\n(?!\s*(?:[-*+]\s|\d+\.\s|#{1,6}\s))/g, '$1 ')
      // Enforce exactly one space after sentence punctuation (collapse multiple spaces)
      .replace(/([.!?])\s{2,}/g, '$1 ')
  }
  // Rejoin, preserving code blocks
  return parts.join('```')
}

const renderedMessage = computed(() => {
  if (props.typingEffect && !isTypingComplete.value) {
    // During typing, show plain text (escaped) with line breaks
    const escaped = escapeHtml(displayedText.value)
    return escaped.replace(/\n/g, '<br>')
  }
  
  // After typing complete, render markdown (with compact sentence spacing)
  const preprocessed = preprocessMessage(props.message)
  const unsafeHtml = md.render(preprocessed)
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
  padding: 0.5rem 1rem 1em 1rem !important; /* add 1em bottom padding inside bubble */
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
  margin-top: 0; /* spacing handled by paragraph bottom margin (1em) */
}

.compact-message :deep(ul),
.compact-message :deep(ol) {
  margin: 0 0 1em 0;
  padding-left: 1.25rem;
  list-style-position: outside;
}
.compact-message :deep(ul) { list-style-type: disc; }
.compact-message :deep(ol) { list-style-type: decimal; }

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
  margin-top: 0.5em;
  margin-bottom: 0.25em;
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

/* Ensure last paragraph doesn't add extra bottom gap */
.message-content :deep(p:last-child) {
  margin-bottom: 0 !important;
}
.message-content :deep(h1:last-child),
.message-content :deep(h2:last-child),
.message-content :deep(h3:last-child),
.message-content :deep(h4:last-child),
.message-content :deep(h5:last-child),
.message-content :deep(h6:last-child) {
  margin-bottom: 0 !important;
}
.message-content :deep(ul:last-child),
.message-content :deep(ol:last-child) {
  margin-bottom: 0 !important;
}
</style>
