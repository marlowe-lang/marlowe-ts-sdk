export const VERSION = '0.0.1';

export { registerTestingCommands } from './cli.js';

import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';

async function validateRuntime(url: string, expectedVersion: string, expectedNetworkVersion: string): Promise<void> {
  try {
    const response = await fetch(`${url}/healthcheck`);
    if (!response.ok) {
      throw new Error(`Runtime health check failed with status ${response.status}`);
    }

    console.debug('Runtime health check response:', {
      status: response.status,
      headers: response.headers,
    });

    const runtimeVersion = response.headers.get('x-runtime-version');
    if (runtimeVersion !== expectedVersion) {
      throw new Error(`Runtime version mismatch. Expected ${expectedVersion}, got ${runtimeVersion}`);
    }

    const networkVersion = response.headers.get('x-network-id');
    if (networkVersion !== expectedNetworkVersion) {
      throw new Error(`Network version mismatch. Expected ${expectedNetworkVersion}, got ${networkVersion}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Runtime validation failed: ${error.message}`);
    }
    throw new Error('Runtime validation failed with unknown error');
  }
}

const SeedSchema = z.object({
  type: z.enum(['mnemonic', 'sKeyFile']),
  value: z.string(),
});

const RuntimeSchema = z.object({
  url: z.string().url(),
  version: z.string(),
});

const TestEnvCfgSchema = z.object({
  faucet: SeedSchema,
  testnetMagic: z.number().optional(),
  runtime: RuntimeSchema,
});

export type TestEnvCfg = z.infer<typeof TestEnvCfgSchema>;

async function execCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command failed: ${error.message}\nStderr: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * Executes an async operation with guaranteed resource acquisition and release
 * @param acquire Function to acquire the resource
 * @param release Function to release the resource
 * @param use Function that uses the resource
 * @returns The result of the use function
 */
export async function bracket<A, B>(
  acquire: () => Promise<A>,
  release: (resource: A) => Promise<void>,
  use: (resource: A) => Promise<B>
): Promise<B> {
  const resource = await acquire();
  try {
    const result = await use(resource);
    await release(resource);
    return result;
  } catch (error) {
    await release(resource);
    throw error;
  }
}

export interface Faucet {
  signingKeyFile: string;
  address: string;
  balance: bigint;
}

/**
 * Creates a temporary directory and ensures cleanup
 * @param prefix Prefix for the temp directory name
 * @returns A function that accepts the use handler
 */
export function withTempDir(prefix: string) {
  return function <T>(use: (dirPath: string) => Promise<T>): Promise<T> {
    return bracket(
      async () => fs.mkdtemp(path.join(os.tmpdir(), prefix)),
      async (tempDir: string) => fs.rmdir(tempDir, { recursive: true }),
      use
    );
  };
}

type TestEnvCfgPath = string;

/**
 * Loads and validates testEnvCfguration from various sources
 * @param testEnvCfgArg TestEnvCfguration object, path to testEnvCfg file, or undefined (will check env var)
 * @returns Validated TestEnvCfg object
 * @throws Error with detailed validation messages if testEnvCfg is invalid
 */
async function loadTestEnvCfg(testEnvCfgArg: TestEnvCfg | TestEnvCfgPath | undefined): Promise<TestEnvCfg> {
  const testEnvCfg: TestEnvCfg = await (async () => {
    if (testEnvCfgArg === undefined) {
      const envPath = process.env.MARLOWE_TESTING_KIT_CONFIG;
      if (!envPath) {
        throw new Error(
          'Please provide testEnvCfguration or set MARLOWE_TESTING_KIT_CONFIG environment variable which points to a JSON file'
        );
      }
      return loadTestEnvCfgFromFile(envPath);
    }

    if (typeof testEnvCfgArg === 'string') {
      return loadTestEnvCfgFromFile(testEnvCfgArg);
    }

    return validateTestEnvCfg(testEnvCfgArg);
  })();
  return testEnvCfg;
}

async function loadTestEnvCfgFromFile(path: string): Promise<TestEnvCfg> {
  const content = await fs.readFile(path, 'utf-8');
  try {
    const json = JSON.parse(content);
    return validateTestEnvCfg(json);
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new Error(
        `Invalid testEnvCfg file format at ${path}:\n${e.errors.map((err) => `  - ${err.path.join('.')}: ${err.message}`).join('\n')}`
      );
    } else if (e instanceof SyntaxError) {
      throw new Error(`Invalid JSON in testEnvCfg file ${path}: ${e.message}`);
    }
    throw e;
  }
}

async function validateTestEnvCfg(json: unknown): Promise<TestEnvCfg> {
  const testEnvCfg = TestEnvCfgSchema.parse(json);
  // Validate runtime if testEnvCfgured
  if (testEnvCfg.runtime) {
    await validateRuntime(
      testEnvCfg.runtime.url,
      testEnvCfg.runtime.version,
      testEnvCfg.testnetMagic !== undefined ? testEnvCfg.testnetMagic.toString() : 'mainnet'
    );
  }
  return testEnvCfg;
}

/**
 * Creates a faucet wallet from a mnemonic and manages its lifecycle
 * @param testEnvCfgArg TestEnvCfguration containing the faucet mnemonic or path to a JSON file with the testEnvCfguration
 * @returns A function that accepts the use handler
 */
export function withTestEnv(testEnvCfgArg: TestEnvCfg | TestEnvCfgPath | undefined) {
  return async function <T>(use: (faucet: Faucet) => Promise<T>): Promise<T> {
    const testEnvCfg = await loadTestEnvCfg(testEnvCfgArg);

    return withTempDir('faucet-')(async (tempDir) => {
      const signingKeyFile = path.join(tempDir, 'payment.skey');
      const verificationKeyFile = path.join(tempDir, 'payment.vkey');

      console.log('Creating faucet wallet:', testEnvCfg);

      if (testEnvCfg.faucet.type === 'mnemonic') {
        // Copy mnemonic to temp dir and generate keys
        const mnemonicContent = testEnvCfg.faucet.value;

        // Generate payment keys from mnemonic
        await execCommand(
          `cd ${tempDir} && echo "${mnemonicContent}" | cardano-address key from-recovery-phrase Shelley > root.prv`
        );
        await execCommand(`cd ${tempDir} && cat root.prv | cardano-address key child 1852H/1815H/0H/0/0 > payment.prv`);
        await execCommand(
          `cd ${tempDir} && cardano-cli key convert-cardano-address-key --shelley-payment-key --signing-key-file payment.prv --out-file ${signingKeyFile}`
        );
      } else {
        // Copy existing signing key file
        await fs.copyFile(testEnvCfg.faucet.value, signingKeyFile);
      }

      // Generate verification key and address
      await execCommand(
        `cardano-cli key verification-key --signing-key-file ${signingKeyFile} --verification-key-file ${verificationKeyFile}`
      );
      const address = await execCommand(
        `cardano-cli address build --payment-verification-key-file ${verificationKeyFile} --testnet-magic ${testEnvCfg.testnetMagic || 1}`
      );

      // Query initial balance
      const utxoJSON = await execCommand(
        testEnvCfg.testnetMagic !== undefined
          ? `cardano-cli query utxo --address ${address} --testnet-magic ${testEnvCfg.testnetMagic} --output-json`
          : `cardano-cli query utxo --address ${address} --mainnet --output-json`
      );

      const utxos = JSON.parse(utxoJSON);
      const balance = Object.values(utxos).reduce((acc: bigint, utxo: any) => {
        return acc + BigInt(utxo.value.lovelace || 0);
      }, BigInt(0));

      const faucet: Faucet = {
        signingKeyFile,
        address,
        balance,
      };

      return use(faucet);
    });
  };
}

// export type Participant = {
//   name: string;
//   // wallet: WalletAPI;
//
//
//   participants: Participants;
//
// export type ParticipantInfo = {
//   /**
//    * Wallet Test instance
//    */
//   wallet: DAppWalletAPI;
//   /**
//    * List of Assets provisionned By the Bank Wallet
//    */
//   assetsProvisioned: Assets;
// };
