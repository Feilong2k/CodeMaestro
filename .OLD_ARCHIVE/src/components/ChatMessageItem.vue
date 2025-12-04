<template>
  <div class="chat-message" :class="role" role="article" :aria-label="`${role} message`">
    <div class="avatar">
      <span v-if="role === 'user'">U</span>
      <span v-else>A</span>
    </div>
    <div class="bubble">
      <div class="content">
        <!-- User messages: plain text with basic formatting -->
        <template v-if="role === 'user'">
          <span v-html="formattedContent"></span>
        </template>
        <!-- Assistant messages: full markdown rendering -->
        <template v-else>
          <MarkdownRenderer :content="content" :showCopy="true" />
        </template>
      </div>
      <div class="meta">
        <span class="timestamp">{{ formattedTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps({
  role: {
    type: String,
    required: true,
    validator: (val) => ['user', 'assistant'].includes(val),
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: String,
    required: true,
  },
})

const formattedTime = computed(() => {
  const date = new Date(props.timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

const formattedContent = computed(() => {
  // Very basic markdown-lite: bold **text** and inline `code`
  return props.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
})
</script>

<style lang="scss" scoped>
.chat-message {
  display: flex;
  gap: 12px;
  max-width: 85%;

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;

    .avatar {
      background-color: color-mix(in oklab, var(--accent-primary) 20%, var(--bg-layer));
      color: var(--accent-primary);
    }

    .bubble {
      background-color: var(--bg-layer);
      border-left: 2px solid var(--accent-primary);
      border-right: none;
    }
  }

  &.assistant {
    align-self: flex-start;

    .avatar {
      background-color: color-mix(in oklab, var(--accent-secondary) 20%, var(--bg-layer));
      color: var(--accent-secondary);
    }

    .bubble {
      background-color: var(--bg-elevated);
      border-right: 2px solid var(--line-circuit);
      border-left: none;

      &:hover {
        box-shadow: var(--glow-cyan);
      }
    }
  }
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 4px;
}

.bubble {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-base);
  transition: box-shadow 0.2s ease;

  .content {
    font-size: 16px;
    line-height: 1.5;
    color: var(--text-primary);
    word-break: break-word;

    :deep(strong) {
      font-weight: 600;
      color: var(--text-primary);
    }

    :deep(code) {
      font-family: 'JetBrains Mono', 'Roboto Mono', Consolas, monospace;
      background-color: var(--bg-subtle);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 14px;
      color: var(--accent-primary);
    }
  }

  .meta {
    margin-top: 8px;
    display: flex;
    justify-content: flex-end;
  }

  .timestamp {
    font-size: 12px;
    color: var(--text-muted);
  }
}
</style>
