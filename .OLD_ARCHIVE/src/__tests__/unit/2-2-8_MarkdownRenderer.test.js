// Unit tests for MarkdownRenderer component (subtask 2-2-8)
// Tests markdown rendering, sanitization, and copy actions

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, beforeEach, test, expect, vi } from 'vitest';
import MarkdownRenderer from '../../components/MarkdownRenderer.vue';

// Mock markdown-it
const mockRender = vi.hoisted(() => vi.fn());
const mockMarkdownIt = vi.hoisted(() => vi.fn(() => ({
  render: mockRender,
  use: vi.fn(),
  utils: { escapeHtml: (str) => str.replace(/[&<>"']/g, (c) => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c])) }
})));
vi.mock('markdown-it', () => ({ default: mockMarkdownIt }));

// Mock DOMPurify
const mockSanitize = vi.hoisted(() => vi.fn((html) => html));
vi.mock('dompurify', () => ({ default: { sanitize: mockSanitize } }));

// Mock highlight.js
const mockHighlightElement = vi.hoisted(() => vi.fn());
const mockHighlightAuto = vi.hoisted(() => vi.fn().mockReturnValue({ value: '<span class="hljs">code</span>' }));
const mockGetLanguage = vi.hoisted(() => vi.fn().mockReturnValue(true));
vi.mock('highlight.js', () => ({
  default: {
    highlightAuto: mockHighlightAuto,
    highlightElement: mockHighlightElement,
    getLanguage: mockGetLanguage
  }
}));

// Mock markdown-it-checkbox (optional dependency)
vi.mock('markdown-it-checkbox', () => ({ default: vi.fn() }));

describe('MarkdownRenderer.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock behavior
    mockRender.mockReturnValue('<p>rendered</p>');
    mockSanitize.mockImplementation((html) => html);
    wrapper = mount(MarkdownRenderer);
  });

  describe('initial rendering', () => {
    test('should render empty when content is empty', async () => {
      await wrapper.setProps({ content: '' });
      expect(wrapper.text()).toBe('');
    });

    test('should render provided markdown content', async () => {
      mockRender.mockReturnValue('<h1>Heading</h1>');
      await wrapper.setProps({ content: '# Heading' });
      await nextTick();
      expect(wrapper.html()).toContain('<h1>Heading</h1>');
    });
  });

  describe('markdown parsing', () => {
    test('should call markdown-it with content', async () => {
      await wrapper.setProps({ content: '**bold**' });
      expect(mockRender).toHaveBeenCalledWith('**bold**');
    });

    test('should handle inline rendering when inline prop is true', async () => {
      await wrapper.setProps({ content: 'inline text', inline: true });
      expect(wrapper.props('inline')).toBe(true);
      // Inline mode uses span instead of div
      expect(wrapper.find('span').exists()).toBe(true);
      expect(wrapper.find('.markdown-block').exists()).toBe(false);
    });
  });

  describe('HTML sanitization', () => {
    test('should call DOMPurify.sanitize', async () => {
      mockRender.mockReturnValue('<script>alert("xss")</script>');
      mockSanitize.mockReturnValue('');
      await wrapper.setProps({ content: '<script>alert("xss")</script>' });
      expect(mockSanitize).toHaveBeenCalled();
      // The sanitized output is empty, so no script
      expect(wrapper.html()).not.toContain('script');
    });

    test('should allow safe HTML tags', async () => {
      mockRender.mockReturnValue('<strong>bold</strong>');
      mockSanitize.mockImplementation((html) => html);
      await wrapper.setProps({ content: '<strong>bold</strong>' });
      expect(wrapper.html()).toContain('<strong>bold</strong>');
    });
  });

  describe('code block highlighting', () => {
    test('should call highlight.js for code blocks', async () => {
      // Mock markdown-it's highlight function
      mockRender.mockReturnValue('<pre class="hljs"><code>console.log("test");</code></pre>');
      await wrapper.setProps({ content: '```js\nconsole.log("test");\n```' });
      await nextTick();
      // highlightElement is called after mount/watch
      expect(mockHighlightElement).toHaveBeenCalled();
    });
  });

  describe('copy functionality', () => {
    test('should have copy button when showCopy is true and inline is false', async () => {
      await wrapper.setProps({ showCopy: true, inline: false });
      expect(wrapper.find('.copy-button').exists()).toBe(true);
    });

    test('should not show copy button when inline', async () => {
      await wrapper.setProps({ inline: true });
      expect(wrapper.find('.copy-button').exists()).toBe(false);
    });

    test('should not show copy button when showCopy is false', async () => {
      await wrapper.setProps({ showCopy: false });
      expect(wrapper.find('.copy-button').exists()).toBe(false);
    });

    test('copy button click copies text', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(),
        },
      });
      mockRender.mockReturnValue('<p>some content</p>');
      await wrapper.setProps({ content: 'some content' });
      await nextTick();
      const button = wrapper.find('.copy-button');
      await button.trigger('click');
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('dark theme styling', () => {
    test('should have dark theme CSS classes', () => {
      expect(wrapper.classes()).toContain('markdown-renderer');
    });
  });

  describe('edge cases', () => {
    test('should handle very long content', async () => {
      const longContent = '# '.repeat(1000);
      await wrapper.setProps({ content: longContent });
      expect(wrapper.props('content')).toBe(longContent);
    });

    test('should handle special characters', async () => {
      const content = 'Content with & < > " special characters';
      await wrapper.setProps({ content });
      expect(mockRender).toHaveBeenCalledWith(content);
    });

    test('should handle empty lines and whitespace', async () => {
      await wrapper.setProps({ content: '  \n  \n  ' });
      // Should not crash
      expect(wrapper.text()).toBe('');
    });
  });
});
