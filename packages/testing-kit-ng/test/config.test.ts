import { describe, it, expect } from 'vitest';
import { withTestEnv } from '../src/index.js';
import * as fs from 'fs/promises';

describe('Test Environment Configuration', () => {
  it('should work with empty config using environment defaults', async () => {
    await withTestEnv(undefined)(async (testEnv) => {
      expect(testEnv).toHaveProperty('address');
      expect(testEnv).toHaveProperty('signingKeyFile');
      // confirm that the file exists
      await expect(fs.access(testEnv.signingKeyFile)).resolves.not.toThrow();
    });
  });

  it('should fail with nice error message for invalid config', async () => {
    const invalidConfig = {
      faucet: {
        type: 'mnemonic',
        value: '/some/path',
      },
      testnetMagic: 42,
      // missing runtime config
    };

    await expect(async () => {
      await withTestEnv(invalidConfig as any)(async () => {});
    }).rejects.toThrow(/invalid_type.*expected.*object.*received.*undefined/s);
  });

  it('should fail with nice error message for invalid runtime URL', async () => {
    const invalidConfig = {
      faucet: {
        type: 'mnemonic',
        value: '/some/path',
      },
      testnetMagic: 42,
      runtime: {
        url: 'not-a-url',
        version: '1.0.0',
      },
    };

    await expect(async () => {
      await withTestEnv(invalidConfig as any)(async () => {});
    }).rejects.toThrow(/Invalid url/);
  });
});
