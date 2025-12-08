const { describe, test, expect, beforeEach, jest } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let ConstraintService;
try {
  ConstraintService = require('../../../src/services/ConstraintService');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  ConstraintService = {};
}

// Helper to ensure we have a method to test, otherwise skip the test.
function requireConstraintService() {
  if (Object.keys(ConstraintService).length === 0) {
    throw new Error('ConstraintService module not found. Tests are expected to fail.');
  }
  return ConstraintService;
}

describe('Constraint Service (RBAC & Override)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Permission Matrix (RBAC)', () => {
    test('Devon should be blocked from writing to tests/ directory', () => {
      const service = requireConstraintService();
      // Assuming there is a method canWrite(agentRole, path)
      const canWrite = service.canWrite('Devon', 'backend/__tests__/unit/test.js');
      expect(canWrite).toBe(false);
    });

    test('Tara should be blocked from writing to src/ directory', () => {
      const service = requireConstraintService();
      const canWrite = service.canWrite('Tara', 'backend/src/services/SomeService.js');
      expect(canWrite).toBe(false);
    });

    test('Orion should be allowed to write to any directory', () => {
      const service = requireConstraintService();
      const paths = ['backend/src/foo.js', 'backend/__tests__/bar.js', 'frontend/src/Component.vue'];
      paths.forEach(path => {
        const canWrite = service.canWrite('Orion', path);
        expect(canWrite).toBe(true);
      });
    });

    test('Tara should be allowed to write to test files', () => {
      const service = requireConstraintService();
      const canWrite = service.canWrite('Tara', 'backend/__tests__/unit/test.js');
      expect(canWrite).toBe(true);
    });

    test('Devon should be allowed to write to src files', () => {
      const service = requireConstraintService();
      const canWrite = service.canWrite('Devon', 'backend/src/services/SomeService.js');
      expect(canWrite).toBe(true);
    });
  });

  describe('Override System', () => {
    test('grantOneTimeAccess should return a valid UUID token', () => {
      const service = requireConstraintService();
      const token = service.grantOneTimeAccess('Devon', 'sudo ls', 'emergency fix');
      // Expect token to match UUID pattern
      expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('validateGrant should return true for a valid token', () => {
      const service = requireConstraintService();
      const token = service.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      const isValid = service.validateGrant('Devon', 'sudo ls', token);
      expect(isValid).toBe(true);
    });

    test('validateGrant should return false for expired/used token', () => {
      const service = requireConstraintService();
      const token = service.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      // First use should be valid
      const firstCheck = service.validateGrant('Devon', 'sudo ls', token);
      expect(firstCheck).toBe(true);
      // Second use should be invalid (single use)
      const secondCheck = service.validateGrant('Devon', 'sudo ls', token);
      expect(secondCheck).toBe(false);
    });

    test('validateGrant should return false for mismatched agent', () => {
      const service = requireConstraintService();
      const token = service.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      const isValid = service.validateGrant('Tara', 'sudo ls', token); // Different agent
      expect(isValid).toBe(false);
    });

    test('validateGrant should return false for mismatched command', () => {
      const service = requireConstraintService();
      const token = service.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      const isValid = service.validateGrant('Devon', 'sudo rm -rf /', token); // Different command
      expect(isValid).toBe(false);
    });

    test('Non-whitelisted command fails initially', () => {
      const service = requireConstraintService();
      // Assuming there is a method isCommandAllowed(agentRole, command)
      const allowed = service.isCommandAllowed('Devon', 'sudo ls');
      expect(allowed).toBe(false);
    });

    test('Non-whitelisted command passes with valid Grant Token', () => {
      const service = requireConstraintService();
      const token = service.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      // With token, the command should be allowed
      const allowed = service.isCommandAllowedWithToken('Devon', 'sudo ls', token);
      expect(allowed).toBe(true);
    });

    test('Token can only be used once (single use)', () => {
      const service = requireConstraintService();
      const token = service.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      // First use with token should pass
      const first = service.isCommandAllowedWithToken('Devon', 'sudo ls', token);
      expect(first).toBe(true);
      // Second use with same token should fail
      const second = service.isCommandAllowedWithToken('Devon', 'sudo ls', token);
      expect(second).toBe(false);
    });
  });
});
