import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { react, 'jsx-a11y': jsxA11y },
    rules: {
      // QUALITY FIX (FQ10): accessibility linting, ratchet-style — every
      // jsx-a11y recommended rule at WARN so `lint --quiet` stays the CI
      // gate while a11y debt is visible and can be burned down over time.
      ...Object.fromEntries(
        Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, 'warn'])
      ),
      // QUALITY FIX (FQ2): without react/jsx-uses-vars, core no-unused-vars
      // can't see JSX usages — components referenced only as <Tag>/<Component>
      // were falsely flagged (the ^[A-Z_] ignore pattern was papering over it
      // for variables but not destructured props/params).
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // QUALITY FIX (FQ2): React Compiler diagnostics from react-hooks v6.
      // They flag long-standing, working patterns (sync setState in effects,
      // tanstack-virtual's function-returning API, refs in render) whose
      // refactor is only worthwhile when actually adopting the React
      // Compiler. Disabled so lint output stays an actionable zero; revisit
      // during the planned page-layer decomposition.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/static-components': 'off',
      // shadcn/ui convention: variant factories (badgeVariants, buttonVariants,
      // useFormField) are co-exported with their components; HMR cost accepted.
      'react-refresh/only-export-components': 'off',
    },
  },
])
