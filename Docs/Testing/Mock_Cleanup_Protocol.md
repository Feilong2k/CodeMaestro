# Mock Cleanup Protocol

**Purpose**: This document tracks temporary mocks used in testing and ensures they are removed when the corresponding implementation is complete.

## Process

1. **When creating a mock**, add an entry below under "Active Mocks".
2. **When the dependent subtask is completed**, move the entry to "Cleaned Up Mocks" and update the test files to use the real implementation.
3. **Verification**: After cleaning up a mock, run the relevant tests to ensure they still pass.

## Active Mocks

| Mock ID | Component | Test File | Dependent Subtask | Created Date | Notes |
|---------|-----------|-----------|-------------------|--------------|-------|
| MOCK-001 | Tool Registry | `backend/__tests__/unit/unifiedAdapter.test.js` | 6-100 | 2025-12-10 | Mock tool registry until 6-100 (UnifiedAdapter) is complete. |
| MOCK-002 | WebSocket Client | `backend/__tests__/unit/unifiedAdapter.test.js` | 6-100 | 2025-12-10 | Mock WebSocket for live UI streaming tests. |
| MOCK-003 | LLM Client | `backend/__tests__/unit/observationStage.test.js` | 6-101 | 2025-12-10 | Mock LLM client for classification tests. |
| MOCK-004 | Constraint Service | `backend/__tests__/unit/thinkingProtocols.test.js` | 6-102 | 2025-12-10 | Mock constraint service for CDP Level 0 audit trail tests. |
| MOCK-005 | WebSocket Events (Frontend) | `frontend/__tests__/integration/otaLoop.spec.ts` | 6-099, 6-100 | 2025-12-10 | Mock WebSocket events for UI integration tests. 6-099 completed (UI ready), but mock remains for 6-100 (streaming). |

## Cleaned Up Mocks

| Mock ID | Component | Test File | Dependent Subtask | Cleaned Up Date | Notes |
|---------|-----------|-----------|-------------------|-----------------|-------|
| *None yet* | | | | | |

## Responsibilities

- **Tara**: Maintain this document, update the status of mocks, and perform cleanup when dependent subtasks are completed.
- **Devon**: Notify Tara when a subtask is ready for real implementation testing.
- **Orion**: Monitor the manifest and ensure mock cleanup is part of the verification for each subtask.

## Verification Checklist

After cleaning up a mock:

- [ ] Update the test file to use the real implementation.
- [ ] Run the specific test suite to ensure no regressions.
- [ ] Move the mock entry to "Cleaned Up Mocks".
- [ ] Update the test coverage report (if applicable).

## Notes

- This protocol is part of subtask 6‑111 (OTA/CDP Integration Test Suite).
- Mocks should be kept as minimal as possible and only used when the real component is unavailable due to dependencies.
- The goal is to have zero mocks by the end of Phase 6 Milestone 1.
