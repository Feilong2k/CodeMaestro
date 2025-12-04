<template>
  <div class="markdown-renderer" :class="{ 'inline': inline }">
    <div v-if="!inline" class="markdown-block" v-html="renderedHtml" ref="contentRef"></div>
    <span v-else v-html="renderedHtml"></span>
    <!-- Copy button for block mode (whole content) -->
    <button v-if="showCopy && !inline" class="copy-button" @click="copyWholeContent" :title="copyButtonTitle">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import markdownItCheckbox from 'markdown-it-checkbox'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  inline: {
    type: Boolean,
    default: false
  },
  showCopy: {
    type: Boolean,
    default: true
  }
})

const contentRef = ref(null)

// Configure markdown-it with common extensions
const md = new MarkdownIt({
  html: false, // Disable HTML tags in source
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
      } catch (__) {}
    }
    // fallback
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

// Enable checkbox rendering
md.use(markdownItCheckbox)

const renderedHtml = computed(() => {
  const raw = props.inline ? props.content : md.render(props.content)
  // Sanitize with DOMPurify
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'del', 'code', 'pre', 'blockquote',
      'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'input', 'label', 'span', 'div'
    ],
    ALLOWED_ATTR: {
      'a': ['href', 'title', 'target'],
      'img': ['src', 'alt', 'title'],
      'input': ['type', 'checked', 'disabled'],
      'code': ['class'],
      'pre': ['class'],
      'span': ['class']
    }
  })
})

const copyButtonTitle = ref('Copy to clipboard')

async function copyWholeContent() {
  if (!contentRef.value) return
  const text = contentRef.value.innerText || props.content
  try {
    await navigator.clipboard.writeText(text)
    copyButtonTitle.value = 'Copied!'
    setTimeout(() => { copyButtonTitle.value = 'Copy to clipboard' }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    copyButtonTitle.value = 'Failed'
  }
}

// Highlight code blocks after mount or content change
onMounted(() => {
  highlightCodeBlocks()
})

watch(() => props.content, () => {
  // Wait for DOM update
  setTimeout(highlightCodeBlocks, 0)
})

function highlightCodeBlocks() {
  if (contentRef.value) {
    contentRef.value.querySelectorAll('pre code').forEach((block) => {
      // If not already highlighted
      if (!block.classList.contains('hljs')) {
        hljs.highlightElement(block)
      }
    })
  }
}
</script>

<style lang="scss" scoped>
.markdown-renderer {
  position: relative;
  &.inline {
    display: inline;
  }
}

.markdown-block {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  word-break: break-word;
  overflow-wrap: break-word;

  // Headings
  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    color: var(--text-primary);
    border-bottom: 1px solid var(--line-base);
    padding-bottom: 0.3em;
  }

  h1 { font-size: 1.8em; }
  h2 { font-size: 1.5em; }
  h3 { font-size: 1.3em; }
  h4 { font-size: 1.1em; }

  // Paragraphs
  p {
    margin: 1em 0;
  }

  // Lists
  ul, ol {
    margin: 1em 0;
    padding-left: 2em;
  }

  li {
    margin: 0.3em 0;
  }

  // Inline code
  code:not(.hljs) {
    font-family: 'JetBrains Mono', 'Roboto Mono', Consolas, monospace;
    background-color: var(--bg-subtle);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
    color: var(--accent-primary);
  }

  // Code blocks
  pre.hljs {
    background-color: var(--bg-elevated);
    border: 1px solid var(--line-base);
    border-radius: var(--radius-md);
    padding: 1em;
    overflow-x: auto;
    margin: 1.5em 0;
    position: relative;

    code {
      background: transparent;
      padding: 0;
      border-radius: 0;
      color: inherit;
    }
  }

  // Links
  a {
    color: var(--accent-secondary);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  // Blockquotes
  blockquote {
    border-left: 4px solid var(--line-circuit);
    padding-left: 1em;
    margin: 1.5em 0;
    color: var(--text-muted);
    font-style: italic;
  }

  // Tables
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.5em 0;
  }
  th, td {
    border: 1px solid var(--line-base);
    padding: 0.5em 1em;
    text-align: left;
  }
  th {
    background-color: var(--bg-subtle);
    font-weight: 600;
  }

  // Checkboxes
  input[type="checkbox"] {
    margin-right: 0.5em;
  }
}

.copy-button {
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  background: var(--bg-elevated);
  border: 1px solid var(--line-base);
  border-radius: var(--radius-sm);
  padding: 0.4em 0.6em;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 1;
    background: var(--bg-layer);
  }
}
</style>
