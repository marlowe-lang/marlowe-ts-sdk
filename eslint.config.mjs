import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.nix',
      '*.json',
      '*.md',
      '*.sh',
      'flake.lock'
    ],
    languageOptions: {
      parserOptions: {
        allowDefaultProject: true,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // For jsdelivr-npm-importmap.js
        document: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }]
    }
  }
);
