import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/owlin-tracker.js'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/jsx-uses-vars': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Naming conventions
      camelcase: ['warn', { properties: 'never', ignoreDestructuring: true, allow: ['^_'] }],
      // Prevent overly short variable names (except loop counters and common abbreviations)
      'id-length': ['warn', { min: 2, exceptions: ['i', 'j', 'k', 'x', 'y', 'z', 'e', 't', 'n', '_'], properties: 'never' }],
      // Prevent misleading variable names
      'no-shadow': ['warn', { builtinGlobals: false, hoist: 'functions' }],
      // Quality
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      // Prevent console.log in production (use console.warn/error for intentional logs)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Prevent duplicate object keys
      'no-dupe-keys': 'error',
      // Hooks must follow naming convention (enforced by react-hooks plugin above)
      // Prevent eval
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
];
