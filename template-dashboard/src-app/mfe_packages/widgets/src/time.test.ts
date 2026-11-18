import { describe, expect, it, vi } from 'vitest';

import { timeOf } from './time';

/** The instant of 10:00+0200, with the offset written in the one form the standard defines. */
const READ = '2026-11-04T10:00:00+02:00';

describe('timeOf', () => {
  it.each(['2026-11-04T10:00:00+0200', '2026-11-04T10:00:00+02'])('writes the offset of %s as +hh:mm before parsing', (time) => {
    const expected = Date.parse(READ);
    const parse = vi.spyOn(Date, 'parse');
    try {
      expect(timeOf(time)).toBe(expected);
      expect(parse).toHaveBeenCalledWith(READ);
    } finally {
      parse.mockRestore();
    }
  });
});
