// Vitest setup file for Vue 3 testing (ES Module)
import { config } from '@vue/test-utils';
import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Global configuration for Vue Test Utils
config.global.stubs = {};
config.global.mocks = {};
config.global.plugins = [];
config.global.components = {};
config.global.directives = {};

// Mock for global objects
global.fetch = vi.fn();
global.Headers = vi.fn();
global.Request = vi.fn();
global.Response = vi.fn();

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
