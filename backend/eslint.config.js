import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules', 'uploads'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: { sourceType: 'module' },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
