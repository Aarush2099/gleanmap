import { describe, it, expect } from 'vitest';
import {
  hasRole,
  hasAdminAccess,
  isEmailAdmin,
  isAdminUser,
  assertAdminAccess,
  assertHasRole,
} from '@/lib/rbac';

describe('RBAC Utilities', () => {
  // Mock profile objects
  const studentProfile = {
    id: '123',
    email: 'student@example.com',
    full_name: 'Student User',
    role: 'student' as const,
    country: 'USA',
    school: 'High School',
    participant_number: 'ABC123',
    points: 0,
    first_submission_at: null,
    created_at: '2026-06-22T00:00:00Z',
    updated_at: '2026-06-22T00:00:00Z',
  };

  const adminProfile = {
    ...studentProfile,
    email: 'admin@example.com',
    role: 'admin' as const,
  };

  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      expect(hasRole(adminProfile, 'admin')).toBe(true);
      expect(hasRole(studentProfile, 'student')).toBe(true);
    });

    it('should return false when user does not have the specified role', () => {
      expect(hasRole(studentProfile, 'admin')).toBe(false);
      expect(hasRole(adminProfile, 'student')).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(hasRole(null, 'admin')).toBe(false);
      expect(hasRole(null, 'student')).toBe(false);
    });
  });

  describe('hasAdminAccess', () => {
    it('should return true when user is admin', () => {
      expect(hasAdminAccess(adminProfile)).toBe(true);
    });

    it('should return false when user is not admin', () => {
      expect(hasAdminAccess(studentProfile)).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(hasAdminAccess(null)).toBe(false);
    });
  });

  describe('isEmailAdmin', () => {
    const adminEmails = ['admin@example.com', 'super@admin.com'];

    it('should return true when email is in admin list (case-insensitive)', () => {
      expect(isEmailAdmin('admin@example.com', adminEmails)).toBe(true);
      expect(isEmailAdmin('ADMIN@EXAMPLE.COM', adminEmails)).toBe(true);
      expect(isEmailAdmin('Admin@Example.Com', adminEmails)).toBe(true);
    });

    it('should return false when email is not in admin list', () => {
      expect(isEmailAdmin('user@example.com', adminEmails)).toBe(false);
    });

    it('should return false when admin list is empty', () => {
      expect(isEmailAdmin('admin@example.com', [])).toBe(false);
    });
  });

  describe('isAdminUser (type guard)', () => {
    it('should return true when user is admin (narrowing)', () => {
      const result = isAdminUser(adminProfile);
      expect(result).toBe(true);
      if (result) {
        // TypeScript should narrow the type here
        expect(adminProfile.role).toBe('admin');
      }
    });

    it('should return false when user is not admin', () => {
      expect(isAdminUser(studentProfile)).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(isAdminUser(null)).toBe(false);
    });
  });

  describe('assertAdminAccess', () => {
    it('should not throw when user is admin', () => {
      expect(() => assertAdminAccess(adminProfile)).not.toThrow();
    });

    it('should throw 403 Forbidden when user is not admin', () => {
      expect(() => assertAdminAccess(studentProfile)).toThrow('Forbidden');
      try {
        assertAdminAccess(studentProfile);
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
      }
    });

    it('should throw 403 Forbidden when user is null', () => {
      expect(() => assertAdminAccess(null)).toThrow('Forbidden');
      try {
        assertAdminAccess(null);
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
      }
    });
  });

  describe('assertHasRole', () => {
    it('should not throw when user has the role', () => {
      expect(() => assertHasRole(adminProfile, 'admin')).not.toThrow();
      expect(() => assertHasRole(studentProfile, 'student')).not.toThrow();
    });

    it('should throw 403 Forbidden when user does not have the role', () => {
      expect(() => assertHasRole(studentProfile, 'admin')).toThrow('Forbidden');
      expect(() => assertHasRole(adminProfile, 'student')).toThrow('Forbidden');
    });

    it('should throw 403 Forbidden when user is null', () => {
      expect(() => assertHasRole(null, 'admin')).toThrow('Forbidden');
    });
  });
});
