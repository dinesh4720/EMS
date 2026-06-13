import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

const UI_COMPONENT_GLOB = 'src/components/ui/**/*.{js,jsx}';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/owlin-tracker.js', 'owlin-sdk/**', 'playwright-report*/**', 'test-results*/**', 'test-student-dashboard.js', 'test-section-validation.js'],
  },
  js.configs.recommended,
  // Config files run in Node environment
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // Vitest test files
  {
    files: ['**/*.test.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
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
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/jsx-uses-vars': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Accessibility — baseline recommended rules as warnings while the
      // codebase is being remediated (DK-992). Shared UI components enforce
      // the critical subset as errors below.
      ...jsxA11y.configs.recommended.rules,
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
  // DK-992: hard a11y gates for shared UI components so the design system
  // cannot regress. These rules are errors inside src/components/ui only.
  {
    files: [UI_COMPONENT_GLOB],
    rules: {
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/control-has-associated-label': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
    },
  },
];
