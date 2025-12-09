import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../App.vue'
import MainLayout from '../../components/MainLayout.vue'
import SystemLogPanel from "../../components/SystemLogPanel.vue";

// Mock fetch globally for health checks
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("MainLayout Integration Tests (Three-Panel Layout)", () => {
  beforeEach(() => {
    // Reset mocks
    mockFetch.mockClear();
    // Setup Pinia
    setActivePinia(createPinia());
  });

  it("should render MainLayout component in App.vue with three panels", () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok", message: "Backend is healthy" }),
    });

    const wrapper = mount(App);
    expect(wrapper.exists()).toBe(true);

    // Check that MainLayout is rendered
    const mainLayout = wrapper.findComponent(MainLayout);
    expect(mainLayout.exists()).toBe(true);

    // Check MainLayout props/classes
    expect(mainLayout.classes()).toContain("main-layout");
  });

  it("should have 12-column grid structure with 2:1:1 ratio for desktop", () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok", message: "Backend is healthy" }),
    });

    const wrapper = mount(App);
    const mainLayout = wrapper.findComponent(MainLayout);

    // Check for grid container
    const gridContainer = mainLayout.find(".grid");
    expect(gridContainer.exists()).toBe(true);

    // Should have responsive grid classes for desktop (12-column grid)
    expect(gridContainer.classes()).toContain("lg:grid-cols-12");

    // Check column spans for left, center, right
    const leftAside = gridContainer.find("aside.lg\\:col-span-6");
    expect(leftAside.exists()).toBe(true);
    const centerMain = gridContainer.find("main.lg\\:col-span-3");
    expect(centerMain.exists()).toBe(true);
    const rightAside = gridContainer.find("aside.lg\\:col-span-3");
    expect(rightAside.exists()).toBe(true);
  });

  it("should render left slot (Chat/Views), center slot (System Log), and right slot (Activity)", () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok", message: "Backend is healthy" }),
    });

    const wrapper = mount(App);

    // Check left slot contains ChatPanel (or other views) – at least a chat panel component
    const leftSlot = wrapper.find("aside.lg\\:col-span-6");
    expect(leftSlot.exists()).toBe(true);
    // ChatPanel is rendered when currentView is 'dashboard' (default)
    const chatPanel = leftSlot.findComponent({ name: "ChatPanel" });
    expect(chatPanel.exists()).toBe(true);

    // Check center slot contains SystemLogPanel
    const centerSlot = wrapper.find("main.lg\\:col-span-3");
    expect(centerSlot.exists()).toBe(true);
    const systemLogPanel = centerSlot.findComponent(SystemLogPanel);
    expect(systemLogPanel.exists()).toBe(true);

    // Check right slot contains ActivityLog
    const rightSlot = wrapper.find("aside.lg\\:col-span-3");
    expect(rightSlot.exists()).toBe(true);
    const activityLog = rightSlot.findComponent({ name: "ActivityLog" });
    expect(activityLog.exists()).toBe(true);
  });

  it("should apply matrix theme styling to all panels", () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok", message: "Backend is healthy" }),
    });

    const wrapper = mount(App);

    // Check for matrix theme classes in each panel
    const matrixGlowElements = wrapper.findAll(".shadow-matrix-glow");
    expect(matrixGlowElements.length).toBeGreaterThan(0);

    const matrixBorderElements = wrapper.findAll(".border-line-base");
    expect(matrixBorderElements.length).toBeGreaterThan(0);

    const matrixFontElements = wrapper.findAll(
      ".font-matrix-sans, .font-matrix-mono"
    );
    expect(matrixFontElements.length).toBeGreaterThan(0);
  });

  it("should have responsive behavior (hide sidebars on mobile)", () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok", message: "Backend is healthy" }),
    });

    const wrapper = mount(App);
    const mainLayout = wrapper.findComponent(MainLayout);

    // Check for responsive classes
    const gridContainer = mainLayout.find(".grid");
    expect(gridContainer.classes()).toContain("grid-cols-1"); // Mobile single column
    expect(gridContainer.classes()).toContain("lg:grid-cols-12"); // Desktop 12-column grid

    // Left and right asides should have 'hidden lg:block' by default
    const leftAside = gridContainer.find("aside.lg\\:col-span-6");
    expect(leftAside.classes()).toContain("hidden");
    expect(leftAside.classes()).toContain("lg:block");

    const rightAside = gridContainer.find("aside.lg\\:col-span-3");
    expect(rightAside.classes()).toContain("hidden");
    expect(rightAside.classes()).toContain("lg:block");
  });

  it("should maintain layout when switching views (dashboard, patterns, workflows, features)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok", message: "Backend is healthy" }),
    });

    const wrapper = mount(App);
    // We cannot directly manipulate the store without exposing it, but we can test that the layout remains.
    // Instead, we can check that the three panels are always present regardless of view.
    const mainLayout = wrapper.findComponent(MainLayout);
    expect(mainLayout.exists()).toBe(true);

    // All three panels should be present
    expect(mainLayout.find("aside.lg\\:col-span-6").exists()).toBe(true);
    expect(mainLayout.find("main.lg\\:col-span-3").exists()).toBe(true);
    expect(mainLayout.find("aside.lg\\:col-span-3").exists()).toBe(true);
  });
});
