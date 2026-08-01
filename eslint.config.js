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
    // NOTE: deliberately NOT setting `settings['jsx-a11y'].components` to map
    // Input/Textarea/Button onto their DOM elements. It was tried and measured:
    // `control-has-associated-label` does not resolve htmlFor -> id ACROSS
    // components, so mapping `Input: 'input'` reported 183 correctly-associated
    // `<Label htmlFor="x">` + `<Input id="x">` pairs as unlabelled — total
    // warnings went 73 -> 335, nearly all false. The mapping makes the rule
    // noisier, not more accurate. Individual controls that genuinely cannot be
    // reached by a label carry an explicit aria-label instead.
    rules: {
      // QUALITY FIX (FQ10): accessibility linting, ratchet-style — every
      // jsx-a11y recommended rule at WARN so `lint --quiet` stays the CI
      // gate while a11y debt is visible and can be burned down over time.
      //
      // This maps over ENTRIES, not keys. Mapping over keys re-enabled the two
      // rules the plugin's own recommended config deliberately ships as `off`:
      //   - `label-has-for`, which the plugin marks DEPRECATED and replaces
      //     with `label-has-associated-control` (still on below). It demands
      //     BOTH nesting AND htmlFor/id, so a correct `<label htmlFor=…>` on a
      //     custom control could never satisfy it.
      //   - `anchor-ambiguous-text`, off by default as it is opinionated.
      // Rules the plugin turns off stay off; everything it enables becomes a
      // warning, which is what the ratchet was always meant to do.
      ...Object.fromEntries(
        Object.entries(jsxA11y.flatConfigs.recommended.rules).map(([rule, level]) => [
          rule,
          level === 'off' || level === 0 ? 'off' : 'warn',
        ])
      ),
      // QUALITY FIX (FQ2): without react/jsx-uses-vars, core no-unused-vars
      // can't see JSX usages — components referenced only as <Tag>/<Component>
      // were falsely flagged (the ^[A-Z_] ignore pattern was papering over it
      // for variables but not destructured props/params).
      // The interaction rules default to treating `onError` and `onLoad` as
      // "handlers". On an <img> those are RESOURCE-LIFECYCLE events, not user
      // interactions — `onError` is how a broken image swaps to its fallback and
      // `onLoad` is how a lazy image fades in. There is no markup that satisfies
      // the rule either: giving an <img> role="presentation" to silence it would
      // strip its alt text, which is strictly worse. Narrowed to genuine
      // pointer/keyboard events; every real interaction is still caught.
      'jsx-a11y/no-noninteractive-element-interactions': [
        'warn',
        { handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onKeyPress', 'onKeyDown', 'onKeyUp'] },
      ],
      // `aria-role` lints custom components too, so `<ChatPage role="buyer" />`
      // is read as an invalid ARIA role. `role` there is a domain prop (buyer vs
      // seller) that the chat API itself takes, so the prop name is correct and
      // the report is an artifact. Limited to real DOM elements, where an ARIA
      // role can actually be validated.
      'jsx-a11y/aria-role': ['warn', { ignoreNonDOM: true }],
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
  {
    // Node-environment files (build/test config + scripts) use `process`,
    // `__dirname`, etc. Give them Node globals so `eslint .` stays error-free.
    files: ['*.config.{js,mjs}', 'scripts/**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
