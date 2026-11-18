// @vitest-environment node
// The wrapped jsx-a11y content rules (eslint/renderPropContent.mjs) under
// ESLint's RuleTester: the kit's documented render-prop patterns pass, every
// other report of the original rules stays.
import { RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import { rules } from '../eslint/renderPropContent.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

// The kit's own documented examples: the whole-card link (ui-kit card.md) and
// the heading renders (card.md CardTitle, empty.md EmptyTitle).
const cardDocsExample = [
  '<Card render={<a href="/guides/setup" />}>',
  '  <CardHeader>',
  '    <CardTitle render={<h3 />}>Setup guide</CardTitle>',
  '    <CardDescription>From install to the first screen.</CardDescription>',
  '  </CardHeader>',
  '</Card>',
].join('\n');

describe('render-prop content rules', () => {
  it('wraps exactly the two content rules of the fragment', () => {
    expect(Object.keys(rules).sort()).toEqual(['jsx-a11y/anchor-has-content', 'jsx-a11y/heading-has-content']);
    expect(rules['jsx-a11y/anchor-has-content'].meta?.docs?.url).toMatch(/anchor-has-content\.md$/);
    expect(typeof rules['jsx-a11y/anchor-has-content'].create).toBe('function');
  });
});

// The kit's documented patterns pass: the component's children are the
// content of the element its render prop carries.
ruleTester.run('anchor-has-content (render-prop patterns pass)', rules['jsx-a11y/anchor-has-content'], {
  valid: [
    // The whole-card link: the card's children are the anchor's content.
    { code: cardDocsExample },
    { code: `<Card render={<a href="/x" />}>{title}</Card>` },
    { code: `<Card render={<a href="/x" />}>Setup</Card>` },
    // A fragment or an element is content when the assistive tech can see it.
    { code: `<Card render={<a href="/x" />}><>{title}</></Card>` },
    { code: `<Card render={<a href="/x" />}><Icon title="Settings" /></Card>` },
    // aria-hidden=false and a dynamic value are not (provably) hidden.
    { code: `<Card render={<a href="/x" />}><Icon aria-hidden="false" /></Card>` },
    { code: `<Card render={<a href="/x" />}><Icon aria-hidden={hidden} /></Card>` },
    // A number renders (0 included, where a falsy check would drop it).
    { code: `<Card render={<a href="/x" />}>{0}</Card>` },
    { code: `<a href="/x">Setup</a>` },
  ],
  invalid: [],
});

ruleTester.run('heading-has-content (render-prop patterns pass)', rules['jsx-a11y/heading-has-content'], {
  valid: [
    { code: `<CardTitle render={<h3 />}>Setup guide</CardTitle>` },
    { code: `<EmptyTitle render={<h2 />}>No results</EmptyTitle>` },
    { code: `<h3>Setup guide</h3>` },
  ],
  invalid: [],
});

// Everything the original rules report stays: a bare anchor or heading, a
// render prop with no content behind it, whitespace-only children, an element
// not passed directly, a lowercase (non-component) host.
ruleTester.run('anchor-has-content (everything else reports)', rules['jsx-a11y/anchor-has-content'], {
  valid: [],
  invalid: [
    { code: `<a href="/x" />`, errors: 1 },
    { code: `<Card render={<a href="/x" />} />`, errors: 1 },
    { code: `<Card render={<a href="/x" />}>{' '}</Card>`, errors: 1 },
    // React renders nothing for null, booleans and undefined.
    { code: `<Card render={<a href="/x" />}>{null}</Card>`, errors: 1 },
    { code: `<Card render={<a href="/x" />}>{false}</Card>`, errors: 1 },
    { code: `<Card render={<a href="/x" />}>{undefined}</Card>`, errors: 1 },
    // Content invisible to the accessibility tree is no content: an
    // aria-hidden child, a hidden input, an empty fragment.
    { code: `<Card render={<a href="/x" />}><Icon aria-hidden="true" /></Card>`, errors: 1 },
    { code: `<Card render={<a href="/x" />}><Icon aria-hidden /></Card>`, errors: 1 },
    { code: `<Card render={<a href="/x" />}><Icon aria-hidden={true} /></Card>`, errors: 1 },
    { code: `<Card render={<a href="/x" />}><input type="hidden" /></Card>`, errors: 1 },
    { code: `<Card render={<a href="/x" />}><></></Card>`, errors: 1 },
    // A fragment is content only when it carries some of its own.
    { code: `<Card render={<a href="/x" />}><>{null}</></Card>`, errors: 1 },
    { code: `<Card render={<a href="/x" />}><><Icon aria-hidden="true" /></></Card>`, errors: 1 },
    { code: `<Card><a href="/x" /></Card>`, errors: 1 },
    { code: `<Card render={<><a href="/x" /></>} />`, errors: 1 },
    { code: `<card render={<a href="/x" />}>text</card>`, errors: 1 },
  ],
});

ruleTester.run('heading-has-content (everything else reports)', rules['jsx-a11y/heading-has-content'], {
  valid: [],
  invalid: [
    { code: `<h2 />`, errors: 1 },
    { code: `<CardTitle render={<h3 />} />`, errors: 1 },
  ],
});
