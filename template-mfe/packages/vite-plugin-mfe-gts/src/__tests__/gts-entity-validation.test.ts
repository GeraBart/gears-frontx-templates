/**
 * GTS id and manifest-entity validation: entities are validated by
 * registering them with @gears-frontx/gts-plugin's TypeSystemPlugin
 * implementation — no regex. Covers the cases the old regex got wrong:
 * `gts.x.y.v1~` is a well-formed type id, `gts.a~b` is not an entity the
 * type system accepts (its type `gts.a~` is unknown).
 */

import { describe, expect, it } from 'vitest';
import { GtsEntityValidator } from '../GtsEntityValidator';

const validator = (): GtsEntityValidator => new GtsEntityValidator();

describe('GtsEntityValidator', () => {
  it('accepts a schema whose GTS type id is well formed', () => {
    const v = validator();
    expect(() =>
      v.assertValid({
        schemas: [
          {
            $id: 'gts://gts.x.y.z.w.v1~',
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
          },
        ],
        entries: [],
      })
    ).not.toThrow();
  });

  it('rejects an id that is not a type identifier (gts.a~b) and short ids (gts.x.y.v1~)', () => {
    const v = validator();
    // `gts.a~b` is an instance-id shape whose type `gts.a~` is not
    // registered; `gts.x.y.v1~` is malformed (too few tokens) — both are
    // the cases the old regex got wrong, decided by the type system now.
    expect(() =>
      v.assertValid({
        schemas: [
          {
            $id: 'gts://gts.x.y.v1~',
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
          },
        ],
        entries: [],
      })
    ).toThrow(/rejected by the type system/);
    expect(() =>
      v.assertValid({
        schemas: [
          {
            $id: 'gts://gts.a~b',
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
          },
        ],
        entries: [],
      })
    ).toThrow(/rejected by the type system/);
  });

  it('rejects an entity under an unknown type', () => {
    const v = validator();
    expect(() =>
      v.assertValid({
        manifest: { id: 'gts.a~b' },
        entries: [],
      })
    ).toThrow(/rejected by the type system/);
  });

  it('rejects a schema with a malformed GTS id', () => {
    const v = validator();
    expect(() =>
      v.assertValid({
        schemas: [
          {
            $id: 'gts://not-a-gts-id',
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
          },
        ],
        manifest: { id: 'unused' },
        entries: [],
      })
    ).toThrow();
  });

  it('names the rejected entity kind and id in the error', () => {
    const v = validator();
    expect(() =>
      v.assertValid({
        manifest: { id: 'gts.a~my.entry.v1' },
        entries: [],
      })
    ).toThrow(/manifest 'gts\.a~my\.entry\.v1'/);
  });
});
