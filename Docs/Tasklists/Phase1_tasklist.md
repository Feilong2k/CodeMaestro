# Phase 1: The "Control Panel" Task List

**Objective:** Build the dashboard visual shell. It won't "work" fully yet, but it will look real and allow navigation.

## Task 1.1: Header & Navigation (Priority: High)
- [ ] **Component:** `TheHeader`
    - [ ] **Project Context Switcher:** Dropdown showing current project (mock data).
    - [ ] **"New Project" Button:** Visual button (no logic yet).
    - [ ] **Plan/Act Toggle:** Segmented control or switch (Visual only: Plan/Act).
    - [ ] **Theme:** Dark mode styling (Slate-800 bg, Cyan accents).
- [ ] **State:** Define a simple Pinia store (`useAppStore`) to hold the "Current View" state (Plan vs Act).

## Task 1.2: Layout Grid (Priority: High)
- [ ] **Component:** `MainLayout`
    - [ ] **Grid Structure:** 3-column or 2-column layout (Chat vs Activity).
    - [ ] **Responsive:** Adjusts for screen size.

## Task 1.3: Chat Interface Shell (Priority: Medium)
- [ ] **Component:** `ChatPanel`
    - [ ] **Message List:** Area to scroll through messages.
    - [ ] **Input Area:** Text box for user input.
    - [ ] **Mock Message:** One "Welcome" message from Orion.

## Task 1.4: Activity Log Shell (Priority: Medium)
- [ ] **Component:** `ActivityLog`
    - [ ] **List View:** Rows for Agent actions.
    - [ ] **Mock Data:** Static rows ("Orion: Planning", "Tara: Pending").

## Task 1.5: Status Bar (Priority: Low)
- [ ] **Component:** `StatusBar`
    - [ ] **Traffic Light:** Visual indicator (Green/Yellow/Red).
    - [ ] **Current State Text:** e.g., "System Idle".

