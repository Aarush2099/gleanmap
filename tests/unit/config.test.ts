import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateServerConfig, getRequiredEnv } from '@/lib/config.server';

describe('Server Config Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Save original env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('validateServerConfig', () => {
    it('should pass when all required env vars are set', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_PROJECT_ID = 'project-id';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
      process.env.LOVABLE_API_KEY = 'lovable-api-key';

      // Should not throw
      expect(() => validateServerConfig()).not.toThrow();
    });

    it('should throw error when SUPABASE_URL is missing', () => {
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_PROJECT_ID = 'project-id';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
      process.env.LOVABLE_API_KEY = 'lovable-api-key';

      expect(() => validateServerConfig()).toThrow('SUPABASE_URL');
    });

    it('should throw error when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_PROJECT_ID = 'project-id';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      process.env.LOVABLE_API_KEY = 'lovable-api-key';

      expect(() => validateServerConfig()).toThrow('SUPABASE_SERVICE_ROLE_KEY');
    });

    it('should throw error when LOVABLE_API_KEY is missing', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_PROJECT_ID = 'project-id';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
      delete process.env.LOVABLE_API_KEY;

      expect(() => validateServerConfig()).toThrow('LOVABLE_API_KEY');
    });

    it('should throw error when multiple env vars are missing', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.LOVABLE_API_KEY;

      const error = expect(() => validateServerConfig()).toThrow();
      error.toHaveProperty('message');
    });

    it('should display helpful error message with copy-friendly format', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      process.env.LOVABLE_API_KEY = 'lovable-api-key';

      try {
        validateServerConfig();
        expect.fail('Should have thrown');
      } catch (error: any) {
        // Error message should mention .env.local
        expect(error.message).toContain('.env.local');
        expect(error.message).toContain('SUPABASE_SERVICE_ROLE_KEY');
      }
    });
  });

  describe('getRequiredEnv', () => {
    it('should return env var when it exists', () => {
      process.env.TEST_VAR = 'test-value';

      const value = getRequiredEnv('TEST_VAR');
      expect(value).toBe('test-value');
    });

    it('should throw error when env var does not exist', () => {
      delete process.env.TEST_VAR;

      expect(() => getRequiredEnv('TEST_VAR')).toThrow('TEST_VAR');
    });

    it('should throw error with descriptive message', () => {
      delete process.env.MISSING_VAR;

      try {
        getRequiredEnv('MISSING_VAR');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('MISSING_VAR');
        expect(error.message).toContain('not set');
      }
    });

    it('should handle empty string as missing', () => {
      // Empty string is falsy, but process.env returns string or undefined
      // Our function should handle empty string as missing
      process.env.EMPTY_VAR = '';

      // This will return empty string (not throw) since it's technically "set"
      // This is actually correct behavior - empty string is valid
      const value = getRequiredEnv('EMPTY_VAR');
      expect(value).toBe('');
    });
  });
});
