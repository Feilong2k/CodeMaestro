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

// ============================================================================
// System Log WebSocket Integration Tests (Task 6-10)
// These tests will FAIL until WebSocket composable and system log store are implemented
// ============================================================================

describe("SystemLogPanel WebSocket Integration Tests (Red Phase - Task 6-10)", () => {
  let mockSocket;
  let mockEmit;
  let mockOn;

  beforeEach(() => {
    // Mock WebSocket connection
    mockEmit = vi.fn();
    mockOn = vi.fn();
    mockSocket = {
      connected: true,
      emit: mockEmit,
      on: mockOn,
      off: vi.fn(),
      disconnect: vi.fn(),
    };

    // Mock the WebSocket composable
    vi.mock("../../composables/useWebSocket", () => ({
      useSocket: vi.fn(() => ({
        socket: mockSocket,
        isConnected: { value: mockSocket.connected },
        logEntries: { value: [] },
        stateChanges: { value: [] },
        agentActions: { value: [] },
        connect: vi.fn(),
        disconnect: vi.fn(),
        joinSubtask: vi.fn(),
        leaveSubtask: vi.fn(),
        emitStateChange: vi.fn(),
        emitAgentAction: vi.fn(),
        emitLogEntry: vi.fn(),
        clearEvents: vi.fn(),
      })),
    }));

    // Mock the system log store
    vi.mock("../../stores/systemLogStore", () => ({
      useSystemLogStore: vi.fn(() => ({
        connected: false,
        messages: [],
        formattedMessages: [],
        setConnected: vi.fn(),
        addMessage: vi.fn(),
        clear: vi.fn(),
      })),
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok", message: "Backend is healthy" }),
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("should show disconnected status when WebSocket is not connected", async () => {
    mockSocket.connected = false;

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    const systemLogPanel = wrapper.findComponent(SystemLogPanel);
    expect(systemLogPanel.exists()).toBe(true);

    // This should fail: SystemLogPanel currently shows connected (hardcoded true)
    const statusIndicator = systemLogPanel.find(".w-2.h-2.rounded-full");
    expect(statusIndicator.classes()).toContain("bg-red-500"); // Should be red for disconnected
    const statusText = systemLogPanel
      .findAll(".text-xs.text-text-tertiary.font-matrix-mono")
      .filter((w) => w.text().includes("Disconnected"));
    expect(statusText.length).toBeGreaterThan(0);
  });

  it("should show connected status when WebSocket is connected", async () => {
    mockSocket.connected = true;

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    const systemLogPanel = wrapper.findComponent(SystemLogPanel);
    expect(systemLogPanel.exists()).toBe(true);

    // This should pass (coincidentally, because SystemLogPanel hardcodes wsConnected = true)
    const statusIndicator = systemLogPanel.find(".w-2.h-2.rounded-full");
    expect(statusIndicator.classes()).toContain("bg-green-500");
    const statusText = systemLogPanel
      .findAll(".text-xs.text-text-tertiary.font-matrix-mono")
      .filter((w) => w.text().includes("Connected"));
    expect(statusText.length).toBeGreaterThan(0);
  });

  it("should display system messages from WebSocket events instead of hardcoded data", async () => {
    // Simulate a WebSocket event with a new system message
    const testMessage = {
      timestamp: "12:00:00",
      level: "info",
      text: "WebSocket connected successfully",
    };

    // This test will fail because SystemLogPanel uses hardcoded messages array
    // and doesn't listen to WebSocket events
    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    const systemLogPanel = wrapper.findComponent(SystemLogPanel);
    expect(systemLogPanel.exists()).toBe(true);

    // Check that the hardcoded messages are NOT displayed
    const hardcodedMessages = [
      "System initialized",
      "WebSocket connected",
      "Agent Orion started a new subtask",
      "Tool execution: FileSystemTool",
    ];

    hardcodedMessages.forEach((msg) => {
      const messageElement = systemLogPanel
        .findAll("li")
        .filter((li) => li.text().includes(msg));
      expect(messageElement.length).toBe(0); // Should fail - hardcoded messages are displayed
    });

    // Check that our test message IS displayed (it won't be - test will fail)
    const testMessageElement = systemLogPanel
      .findAll("li")
      .filter((li) => li.text().includes(testMessage.text));
    expect(testMessageElement.length).toBe(1); // Should fail - message not received via WebSocket
  });

  it("should update messages in real-time when WebSocket emits system_message events", async () => {
    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    const systemLogPanel = wrapper.findComponent(SystemLogPanel);
    expect(systemLogPanel.exists()).toBe(true);

    // Get initial message count
    const initialMessageCount = systemLogPanel.findAll("li").length;

    // Simulate WebSocket event (this won't actually update the UI without implementation)
    const newMessage = {
      timestamp: "12:01:00",
      level: "info",
      text: "New agent task started",
    };

    // This test will fail: SystemLogPanel doesn't listen to WebSocket events
    // Trigger mock WebSocket event
    const systemMessageCallback = mockOn.mock.calls.find(
      (call) => call[0] === "system_message"
    );
    if (systemMessageCallback) {
      systemMessageCallback[1](newMessage);
      await wrapper.vm.$nextTick();

      // Check that message count increased
      const newMessageCount = systemLogPanel.findAll("li").length;
      expect(newMessageCount).toBe(initialMessageCount + 1); // Should fail

      // Check that new message is displayed
      const newMessageElement = systemLogPanel
        .findAll("li")
        .filter((li) => li.text().includes(newMessage.text));
      expect(newMessageElement.length).toBe(1); // Should fail
    } else {
      // No event listener registered - test fails
      expect(mockOn).toHaveBeenCalledWith("system_message", expect.any(Function));
    }
  });

  it("should clear messages when Clear button is clicked using store", async () => {
    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    const systemLogPanel = wrapper.findComponent(SystemLogPanel);
    expect(systemLogPanel.exists()).toBe(true);

    // Click Clear button
    const clearButton = systemLogPanel.find("button");
    expect(clearButton.text()).toBe("Clear");
    await clearButton.trigger("click");
    await wrapper.vm.$nextTick();

    // This test will fail: SystemLogPanel uses local clearMessages function
    // instead of store.clear()
    // We expect the store's clear method to be called
    const mockStore = await import("../../../stores/systemLogStore");
    expect(mockStore.useSystemLogStore().clear).toHaveBeenCalled(); // Should fail - not using store
  });
});
