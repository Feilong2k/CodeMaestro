<template>
  <div class="chat-transcript" role="log" aria-live="polite">
    <div v-if="messages.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <h3>Start a conversation</h3>
      <p>Describe your app idea or ask a question to get a minimal plan.</p>
    </div>
    <div v-else class="messages">
      <ChatMessageItem
        v-for="(msg, idx) in messages"
        :key="idx"
        :role="msg.role"
        :content="msg.content"
        :timestamp="msg.timestamp"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChatMessageItem from './ChatMessageItem.vue'

// Mock data for now; will be replaced with real data from store/API
const messages = ref([
  {
    role: 'assistant',
    content: 'Hi! Share a short brief and I’ll propose a minimal plan.',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    role: 'user',
    content: 'Build a simple todo app with Vue and Express',
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    role: 'assistant',
    content: 'Got it. I’ll generate a plan with backend (Express + MongoDB) and frontend (Vue 3 + Element Plus). Ready to proceed?',
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
])
</script>

<style lang="scss" scoped>
.chat-transcript {
  flex: 1;
  background-color: var(--bg-subtle);
  border-radius: var(--radius-md);
  border: 1px solid var(--line-base);
  padding: var(--space-6);
  overflow-y: auto;
  min-height: 400px;
  max-height: 60vh;

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--text-muted);
    padding: 48px 24px;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.6;
    }

    h3 {
      font-size: 20px;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    p {
      font-size: 16px;
      max-width: 400px;
      line-height: 1.5;
    }
  }

  .messages {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
