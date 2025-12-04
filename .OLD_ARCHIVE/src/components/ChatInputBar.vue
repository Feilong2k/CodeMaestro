<template>
  <div class="chat-input-bar">
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        :placeholder="placeholder"
        :disabled="isSending"
        @keydown.enter.exact.prevent="handleSend"
        @keydown.shift.enter.prevent="handleNewline"
        @keydown.esc="blurInput"
        aria-label="Message"
        rows="1"
        class="textarea"
      />
      <button
        class="send-button"
        :disabled="isSendDisabled"
        @click="handleSend"
        aria-label="Send message"
      >
        <span v-if="isSending">…</span>
        <span v-else>Send</span>
      </button>
    </div>
    <div v-if="validationError" class="validation-error">
      {{ validationError }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const inputText = ref('')
const isSending = ref(false)
const textareaRef = ref(null)

const placeholder = 'Describe your app idea or ask a question…'

const validationError = computed(() => {
  if (inputText.value.trim() === '' && inputText.value.length > 0) {
    return 'Enter a message before sending.'
  }
  return ''
})

const isSendDisabled = computed(() => {
  return inputText.value.trim() === '' || isSending.value || validationError.value
})

const handleSend = async () => {
  if (isSendDisabled.value) return

  const text = inputText.value.trim()
  console.log('Sending:', text)
  // TODO: call API
  isSending.value = true
  // Simulate network delay
  setTimeout(() => {
    isSending.value = false
    inputText.value = ''
  }, 800)
}

const handleNewline = () => {
  const textarea = textareaRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  inputText.value = inputText.value.substring(0, start) + '\n' + inputText.value.substring(end)
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 1
  })
}

const blurInput = () => {
  const textarea = textareaRef.value
  if (textarea) textarea.blur()
}
</script>

<style lang="scss" scoped>
.chat-input-bar {
  .input-wrapper {
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }

  .textarea {
    flex: 1;
    background-color: var(--bg-layer);
    color: var(--text-primary);
    border: 1px solid var(--line-base);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    font-family: inherit;
    font-size: 16px;
    line-height: 1.5;
    resize: none;
    min-height: 48px;
    max-height: 144px; // ~6 lines
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: var(--focus-ring);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &::placeholder {
      color: var(--text-muted);
    }
  }

  .send-button {
    background-color: var(--accent-primary);
    color: var(--bg-base);
    border: none;
    border-radius: var(--radius-md);
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
    min-height: 48px;
    min-width: 80px;

    &:hover:not(:disabled) {
      background-color: color-mix(in oklab, var(--accent-primary) 90%, white);
      box-shadow: var(--glow-cyan);
    }

    &:focus {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    &:disabled {
      background-color: var(--text-muted);
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  .validation-error {
    margin-top: 8px;
    font-size: 14px;
    color: #FF5A6E;
    padding-left: 4px;
  }
}
</style>
