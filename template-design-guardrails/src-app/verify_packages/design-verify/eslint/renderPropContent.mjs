/**
 * The kit's render-prop link and heading patterns, for the two jsx-a11y
 * content rules the fragment spreads.
 *
 * The kit documents `<Card render={<a href="/guides/setup" />}>...children...</Card>`
 * and `<CardTitle render={<h3 />}>Setup guide</CardTitle>`: the element given
 * to `render` receives the component's children at run time, so its accessible
 * content lives on the component, not on the element. jsx-a11y's settings
 * cannot express that (`components` maps a component name to a DOM tag,
 * `polymorphicPropName` reads a string-valued prop; neither sees a
 * ReactElement carried through a prop), so `anchor-has-content` and
 * `heading-has-content` reject the kit's own documented patterns.
 *
 * These wrappers run the original jsx-a11y rules untouched and drop only the
 * one report that shape produces: the reported node is the element passed
 * directly as the value of a `render` attribute of a JSX element whose name
 * is a component (capitalized) and whose children have renderable content -
 * text with more than whitespace, an element the assistive tech can see (not
 * `aria-hidden`, not an input of type hidden), a fragment carrying such
 * content itself, or an expression that renders something. A `render` element
 * on a childless or whitespace-only component (`<Card render={<a href="/x" />} />`,
 * `...{' '}</Card>`, `...>{null}</Card>`, `...><Icon aria-hidden="true" /></Card>`)
 * still reports, and
 * everything else the original rules report stays: an `<a>` or heading alone,
 * an anchor in the component's own children, a rule option, a fix.
 */
import jsxA11y from 'eslint-plugin-jsx-a11y';

/**
 * Whether a JSX element's children have renderable content: non-whitespace
 * text, an element the assistive tech can see, a fragment carrying such
 * content itself, or an expression that is neither a whitespace string nor a
 * value React renders as nothing (null, booleans, undefined). This mirrors
 * jsx-a11y's own `hasAccessibleChild`: that helper is a package-internal file
 * eslint-plugin-jsx-a11y does not export from its entry point, so the
 * decision is repeated here - a child with `aria-hidden="true"` (a bare
 * attribute or a literal true; a dynamic value cannot be judged) and an
 * `<input type="hidden">` are invisible to the accessibility tree, and an
 * empty fragment contributes nothing. A whitespace-only child (`{' '}`) does
 * not count either.
 *
 * @param {Array<object>} children the JSXElement's children
 */
function hasRenderableContent(children) {
  return children.some((child) => {
    if (child.type === 'JSXText') return child.value.trim() !== '';
    if (child.type === 'JSXElement') return !isHiddenFromAssistiveTech(child.openingElement);
    if (child.type === 'JSXFragment') return hasRenderableContent(child.children);
    if (child.type === 'JSXExpressionContainer') {
      const expression = child.expression;
      if (expression.type === 'JSXEmptyExpression') return false;
      if (expression.type === 'Literal') {
        // React renders nothing for null and booleans; a number renders.
        if (typeof expression.value === 'string') return expression.value.trim() !== '';
        return typeof expression.value === 'number';
      }
      if (expression.type === 'Identifier' && expression.name === 'undefined') return false;
      return true;
    }
    return false;
  });
}

/**
 * The literal a JSX attribute value carries directly: a bare attribute counts
 * as true, a string or boolean literal as its value, anything dynamic as
 * unreadable.
 */
function literalAttributeValue(value) {
  if (value === null) return true;
  if (value.type === 'Literal') return value.value;
  if (value.type === 'JSXExpressionContainer' && value.expression.type === 'Literal') return value.expression.value;
  return undefined;
}

/**
 * Whether this opening element is invisible to the accessibility tree the way
 * jsx-a11y's content rules read it: an `aria-hidden` that is not demonstrably
 * false, or an input of type hidden.
 *
 * @param {object} openingElement the JSXOpeningElement to inspect
 */
function isHiddenFromAssistiveTech(openingElement) {
  for (const attribute of openingElement.attributes) {
    if (attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier') continue;
    const value = literalAttributeValue(attribute.value);
    if (attribute.name.name === 'aria-hidden') {
      // Bare or literal true hides; false does not; a dynamic value cannot
      // be judged, so the element stays visible to this check.
      if (value === true || value === 'true') return true;
    }
    if (
      attribute.name.name === 'type' &&
      openingElement.name.type === 'JSXIdentifier' &&
      openingElement.name.name === 'input' &&
      value === 'hidden'
    ) {
      return true;
    }
  }
  return false;
}

/** A JSX opening element whose name names a component: capitalized. */
function isComponentName(name) {
  if (name.type === 'JSXIdentifier') return /^[A-Z]/.test(name.name);
  if (name.type === 'JSXMemberExpression') return name.object.type === 'JSXIdentifier' && /^[A-Z]/.test(name.object.name);
  return false;
}

/**
 * Whether the reported node is the element passed directly as the value of a
 * `render` attribute of a capitalized component with renderable children: the
 * kit's whole-control link and heading-render patterns, whose content the
 * component supplies.
 *
 * @param {object} node the node the original rule reported
 */
function isContentfulRenderPropElement(node) {
  let element = node;
  if (!element) return false;
  // jsx-a11y reports either the JSXElement or its opening element.
  if (element.type === 'JSXOpeningElement') element = element.parent;
  if (!element || element.type !== 'JSXElement') return false;
  // espree parses `render={<a href="/x" />}` with the element inside a
  // JSXExpressionContainer, so the attribute is one level further up.
  let holder = element.parent;
  if (holder?.type === 'JSXExpressionContainer') holder = holder.parent;
  const attribute = holder;
  if (!attribute || attribute.type !== 'JSXAttribute') return false;
  if (attribute.name.type !== 'JSXIdentifier' || attribute.name.name !== 'render') return false;
  // Passed directly: the attribute's value is the element itself, or the
  // container espree wraps it in (`render={<a href="/x" />}` parses to a
  // JSXExpressionContainer around the JSXElement). A computed value
  // (`render={cond ? <a /> : <b />}`) is neither.
  const value = attribute.value;
  if (value !== element && !(value?.type === 'JSXExpressionContainer' && value.expression === element)) return false;
  const opening = attribute.parent;
  if (!opening || opening.type !== 'JSXOpeningElement' || !isComponentName(opening.name)) return false;
  const component = opening.parent;
  if (!component || component.type !== 'JSXElement') return false;
  return hasRenderableContent(component.children);
}

/** The node a report descriptor carries, in modern and legacy shapes. */
function reportedNode(descriptor) {
  if (!descriptor) return undefined;
  if (typeof descriptor === 'object' && !descriptor.type && descriptor.node) return descriptor.node;
  return descriptor;
}

/**
 * The original rule with this package's one exception: a report on the
 * element behind a contentful component's `render` prop is dropped, every
 * other report goes out untouched. The context is shadowed, not proxied: ESLint
 * makes `report` a read-only own property, so an intercepting proxy trips its
 * invariants; a derived context keeps everything else as is.
 *
 * @param {object} rule the original jsx-a11y rule
 */
function withRenderPropContent(rule) {
  const create = (context) => {
    const shadowed = Object.create(context, {
      report: {
        value: (descriptor, ...rest) => {
          if (isContentfulRenderPropElement(reportedNode(descriptor))) return undefined;
          return context.report(descriptor, ...rest);
        },
      },
    });
    return rule.create(shadowed);
  };
  return {
    ...rule,
    meta: {
      ...rule.meta,
      docs: {
        ...rule.meta?.docs,
        description: `${rule.meta?.docs?.description ?? ''} A link or heading behind a contentful component's render prop is not reported; the component's children are its content.`,
      },
    },
    create,
  };
}

export const rules = {
  'jsx-a11y/anchor-has-content': withRenderPropContent(jsxA11y.rules['anchor-has-content']),
  'jsx-a11y/heading-has-content': withRenderPropContent(jsxA11y.rules['heading-has-content']),
};
