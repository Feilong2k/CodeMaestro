const { describe, test, expect, beforeEach } = require('@jest/globals');

// Import the service (should exist after implementation)
const ConstraintService = require('../../../src/services/constraintService');

describe('Constraint Service (RBAC & Override)', () => {
  beforeEach(() => {
    // Reset grants for test isolation
    ConstraintService.grants = new Map();
  });

  describe('Permission Matrix (RBAC)', () => {
    test('Devon should be blocked from writing to tests/ directory', () => {
      const canWrite = ConstraintService.canWrite('Devon', 'backend/__tests__/unit/test.js');
      expect(canWrite).toBe(false);
    });

    test('Tara should be blocked from writing to src/ directory', () => {
      const canWrite = ConstraintService.canWrite('Tara', 'backend/src/services/SomeService.js');
      expect(canWrite).toBe(false);
    });

    test('Orion should be allowed to write to any directory', () => {
      const paths = ['backend/src/foo.js', 'backend/__tests__/bar.js', 'frontend/src/Component.vue'];
      paths.forEach(path => {
        const canWrite = ConstraintService.canWrite('Orion', path);
        expect(canWrite).toBe(true);
      });
    });

    test('Tara should be allowed to write to test files', () => {
      const canWrite = ConstraintService.canWrite('Tara', 'backend/__tests__/unit/test.js');
      expect(canWrite).toBe(true);
    });

    test('Devon should be allowed to write to src files', () => {
      const canWrite = ConstraintService.canWrite('Devon', 'backend/src/services/SomeService.js');
      expect(canWrite).toBe(true);
    });

    // Edge cases
    test('Devon should be blocked from writing to src/__tests__/ (mixed path)', () => {
      const canWrite = ConstraintService.canWrite('Devon', 'backend/src/__tests__/unit/test.js');
      expect(canWrite).toBe(false);
    });

    test('Tara should be blocked from writing to src/__tests__/ (mixed path)', () => {
      const canWrite = ConstraintService.canWrite('Tara', 'backend/src/__tests__/unit/test.js');
      expect(canWrite).toBe(false);
    });
  });

  describe('Override System', () => {
    test('grantOneTimeAccess should return a valid UUID token', () => {
      const token = ConstraintService.grantOneTimeAccess('Devon', 'sudo ls', 'emergency fix');
      // Expect token to match UUID pattern
      expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('validateGrant should return true for a valid token', () => {
      const token = ConstraintService.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      const isValid = ConstraintService.validateGrant('Devon', 'sudo ls', token);
      expect(isValid).toBe(true);
    });

    test('validateGrant should return false for expired/used token', () => {
      const token = ConstraintService.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      // First use should be valid
      const firstCheck = ConstraintService.validateGrant('Devon', 'sudo ls', token);
      expect(firstCheck).toBe(true);
      // Second use should be invalid (single use)
      const secondCheck = ConstraintService.validateGrant('Devon', 'sudo ls', token);
      expect(secondCheck).toBe(false);
    });

    test('validateGrant should return false for mismatched agent', () => {
      const token = ConstraintService.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      const isValid = ConstraintService.validateGrant('Tara', 'sudo ls', token); // Different agent
      expect(isValid).toBe(false);
    });

    test('validateGrant should return false for mismatched command', () => {
      const token = ConstraintService.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      const isValid = ConstraintService.validateGrant('Devon', 'sudo rm -rf /', token); // Different command
      expect(isValid).toBe(false);
    });

    test('Non-whitelisted command fails initially', () => {
      const allowed = ConstraintService.isCommandAllowed('Devon', 'sudo ls');
      expect(allowed).toBe(false);
    });

    test('Non-whitelisted command passes with valid Grant Token', () => {
      const token = ConstraintService.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      // With token, the command should be allowed
      const allowed = ConstraintService.isCommandAllowedWithToken('Devon', 'sudo ls', token);
      expect(allowed).toBe(true);
    });

    test('Token can only be used once (single use)', () => {
      const token = ConstraintService.grantOneTimeAccess('Devon', 'sudo ls', 'test');
      // First use with token should pass
      const first = ConstraintService.isCommandAllowedWithToken('Devon', 'sudo ls', token);
      expect(first).toBe(true);
      // Second use with same token should fail
      const second = ConstraintService.isCommandAllowedWithToken('Devon', 'sudo ls', token);
      expect(second).toBe(false);
    });
  });
});
