// Static half of the accessibility gate: eslint-plugin-jsx-a11y's recommended
// rules over every TSX file. The shell's eslint.config.js spreads this
// fragment in when the design-guardrails template (and with it this package)
// is installed; without it the shell lints without the a11y rules rather than
// failing to resolve a plugin it does not carry. The runtime half (axe over
// the composed DOM) lives in __tests__/a11y.test.tsx and src/designDefects.ts.
//
// Two of the recommended rules run wrapped (eslint/renderPropContent.mjs): the
// kit's documented render-prop link and heading patterns put the element's
// content on the component, which the original rules cannot see.
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { rules as renderPropContentRules } from './eslint/renderPropContent.mjs';

// The plugin, with its two content rules delivered wrapped
// (eslint/renderPropContent.mjs). The rule entries in `rules` below carry only
// severities - a rule definition cannot sit in a config's rule options - so
// the wrapper is delivered by shadowing those two rules in the plugin's own
// rules map, under the same plugin name. Every other rule of the plugin and
// every severity of the recommended preset is untouched.
//
// This cloned object must remain the plugin's only registration in a lint
// run: flat config rejects one plugin name bound to two different plugin
// objects ("Cannot redefine unique key"), and this object is not the
// original jsxA11y, so a composed config that registers the original
// alongside this fragment (for example by spreading
// jsxA11y.flatConfigs.recommended, whose plugins entry carries it) fails the
// whole lint run.
const jsxA11yWithRenderPropContent = {
  ...jsxA11y,
  rules: {
    ...jsxA11y.rules,
    'anchor-has-content': renderPropContentRules['jsx-a11y/anchor-has-content'],
    'heading-has-content': renderPropContentRules['jsx-a11y/heading-has-content'],
  },
};

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.tsx'],
    plugins: { 'jsx-a11y': jsxA11yWithRenderPropContent },
    rules: { ...jsxA11y.flatConfigs.recommended.rules },
  },
];
