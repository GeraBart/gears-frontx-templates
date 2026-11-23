/**
 * The `__frontx_lazy` transform: literal imports are renamed, non-static
 * ones error, `@vite-ignore` is left alone, `lazyCallSpecifiers` lists
 * the emitted specifiers.
 */

import { describe, expect, it } from 'vitest';
import { LazyImportTransformer } from '../LazyImportTransformer';

// acorn-compatible parse via vite's own parser is unavailable here; use a
// minimal hand-rolled parse for the literal shapes under test through
// Rollup in integration (the unit tests drive the transformer directly).
const fakeParse = (code: string): unknown => {
  // Minimal ESTree stub: expose every `import(` occurrence as an
  // ImportExpression with a Literal source when followed by a string.
  const body: unknown[] = [];
  const re = /import\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g;
  for (let m = re.exec(code); m !== null; m = re.exec(code)) {
    body.push({
      type: 'ImportExpression',
      start: m.index,
      end: m.index + m[0].length,
      source: { type: 'Literal', start: m.index + m[0].indexOf(m[1]), end: m.index + m[0].length - 1, value: m[2] },
    });
  }
  return { type: 'Program', body };
};

const neverError = (message: string): never => {
  throw new Error(`unexpected error: ${message}`);
};

describe('LazyImportTransformer.transformChunk', () => {
  it('rewrites import( to __frontx_lazy( for literal specifiers', () => {
    const code = `const p = import('./lazy.js');`;
    const result = LazyImportTransformer.transformChunk(
      code,
      fakeParse,
      neverError,
      'entry.js'
    );
    expect(result).not.toBeNull();
    expect(result!.code).toBe(`const p = __frontx_lazy('./lazy.js');`);
    expect(result!.count).toBe(1);
  });

  it('returns null when no dynamic import exists', () => {
    expect(
      LazyImportTransformer.transformChunk(
        `const x = 1;`,
        fakeParse,
        neverError,
        'entry.js'
      )
    ).toBeNull();
  });

  it('leaveAlone keeps predicted-removed CSS-only imports untouched', () => {
    const code = `const p = import('./style-chunk.js');`;
    const result = LazyImportTransformer.transformChunk(
      code,
      fakeParse,
      neverError,
      'entry.js',
      (spec) => spec === './style-chunk.js'
    );
    expect(result).toBeNull();
  });
});

describe('LazyImportTransformer.lazyCallSpecifiers', () => {
  it('collects constant specifiers of __frontx_lazy calls', () => {
    const ast = {
      type: 'Program',
      body: [
        {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: '__frontx_lazy' },
          arguments: [{ type: 'Literal', value: './a.js' }],
        },
        {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'somethingElse' },
          arguments: [{ type: 'Literal', value: './b.js' }],
        },
      ],
    };
    expect(LazyImportTransformer.lazyCallSpecifiers(ast)).toEqual(['./a.js']);
  });
});

describe('LazyImportTransformer pattern imports', () => {
  const template = (prefix: string, suffix: string, code: string) => {
    const start = code.indexOf('import');
    const sourceStart = code.indexOf('`');
    return (): unknown => ({
      type: 'Program',
      body: [
        {
          type: 'ImportExpression',
          start,
          end: code.length,
          source: {
            type: 'TemplateLiteral',
            start: sourceStart,
            end: code.length - 1,
            expressions: [{ type: 'Identifier', name: 'n', start: 0, end: 0 }],
            quasis: [
              { type: 'TemplateElement', start: 0, end: 0, value: { cooked: prefix } },
              { type: 'TemplateElement', start: 0, end: 0, value: { cooked: suffix } },
            ],
          },
        },
      ],
    });
  };

  it('rewrites a bounded pattern to __frontx_lazy( keeping the computed path argument', () => {
    const code = 'const p = import(`./locales/${n}.js`);';
    const opaque: unknown[] = [];
    const result = LazyImportTransformer.transformChunk(
      code,
      template('./locales/', '.js', code),
      neverError,
      'entry.js',
      undefined,
      (entry) => opaque.push(entry)
    );
    expect(result!.code).toBe('const p = __frontx_lazy(`./locales/${n}.js`);');
    expect(opaque).toEqual([]);
  });

  it('keeps a template with no fixed text opaque and native', () => {
    const code = 'const p = import(`${n}`);';
    const opaque: unknown[] = [];
    const result = LazyImportTransformer.transformChunk(
      code,
      template('', '', code),
      neverError,
      'entry.js',
      undefined,
      (entry) => opaque.push(entry)
    );
    expect(result).toBeNull();
    expect(opaque).toHaveLength(1);
  });
});

describe('a pattern import is a lazy call with no list of its own', () => {
  it('names no constant specifier, so no list is keyed for it, while a literal call names its target', () => {
    const call = (argument: unknown) => ({
      type: 'CallExpression',
      start: 0,
      end: 0,
      callee: { type: 'Identifier', name: '__frontx_lazy', start: 0, end: 0 },
      arguments: [argument],
    });
    const literal = { type: 'Literal', start: 0, end: 0, value: './lazy-abc.js' };
    const pattern = {
      type: 'TemplateLiteral',
      start: 0,
      end: 0,
      expressions: [{ type: 'Identifier', name: 'n', start: 0, end: 0 }],
      quasis: [
        { type: 'TemplateElement', start: 0, end: 0, value: { cooked: './locales/' } },
        { type: 'TemplateElement', start: 0, end: 0, value: { cooked: '.js' } },
      ],
    };
    expect(LazyImportTransformer.lazyCallSpecifiers([call(literal), call(pattern)])).toEqual(['./lazy-abc.js']);
  });
});
