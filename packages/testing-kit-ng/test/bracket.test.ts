import { describe, it, expect } from 'vitest';
import { withTempDir, bracket } from '../src/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('bracket', () => {
  it('should manage temporary file lifecycle', async () => {
    const tempFilePath = path.join(os.tmpdir(), 'test-file.txt');
    const testContent = 'Hello, World!';
    const result = await bracket(
      // acquire
      async () => {
        await fs.writeFile(tempFilePath, testContent);
        return tempFilePath;
      },
      // release
      async (filePath) => {
        await fs.unlink(filePath);
      },
      // use
      async (filePath) => {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
      }
    );

    expect(result).toBe(testContent);
    // Verify cleanup
    await expect(fs.access(tempFilePath)).rejects.toThrow();
  });

  it('should cleanup even if use throws', async () => {
    const tempFilePath = path.join(os.tmpdir(), 'test-file.txt');
    await expect(
      bracket(
        async () => {
          await fs.writeFile(tempFilePath, 'test');
          return tempFilePath;
        },
        async (filePath) => {
          await fs.unlink(filePath);
        },
        async () => {
          throw new Error('Test error');
        }
      )
    ).rejects.toThrow('Test error');

    // Verify cleanup still happened
    await expect(fs.access(tempFilePath)).rejects.toThrow();
  });
});

describe('withTempDir', () => {
  it('should create and cleanup temporary directory', async () => {
    let tempDirPath: string;
    await withTempDir('test-dir-')(async (dirPath) => {
      tempDirPath = dirPath;
      // Verify directory exists
      const stats = await fs.stat(dirPath);
      expect(stats.isDirectory()).toBe(true);
      // Create a test file in the directory
      const testFile = path.join(dirPath, 'test.txt');
      await fs.writeFile(testFile, 'test content');
    });
    // Verify directory was cleaned up
    await expect(fs.access(tempDirPath!)).rejects.toThrow();
  });
});
