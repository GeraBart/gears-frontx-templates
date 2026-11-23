import { describe, expect, it } from 'vitest';

/**
 * Self-test for the round-count gate's `roundsOf` helper.
 * Replicates the helper inline (it lives in the e2e spec, which is
 * not importable from a vitest unit test) and asserts the two
 * properties the gate depends on:
 *
 *  1. **Staggered HTTP/1.1 arrivals of preloaded items do not count
 *     as round 2.** Under HTTP/1.1 (~6 connections per origin),
 *     preloads beyond the connection cap queue and start after an
 *     earlier preload ends. The pre-fix timing metric
 *     (`e.end <= r.start` opens a new round) intermittently counted
 *     the queued preload as round 2. The causal-depth metric reads
 *     the CDP `initiator.type` instead — every preload-initiated
 *     request is round 1, regardless of when its connection started
 *     or ended.
 *  2. **A genuinely unlisted native import still counts as round 2.**
 *     A `/shared/` chunk not on the boot list, imported by a
 *     `/shared/` boot item, is `script`-initiated by that boot item
 *     (which is round 1) — so the unlisted import is round 2.
 */

interface Req {
  url: string;
  start: number;
  end?: number;
  initiatorType: string;
  initiatorUrl?: string;
}

function urlBase(url: string): string {
  return url.split('#')[0].split('?')[0];
}

function roundsOf(requests: Req[]) {
  const byUrl = new Map<string, Req>();
  for (const r of requests) {
    const key = urlBase(r.url);
    if (!byUrl.has(key)) byUrl.set(key, r);
  }
  const roundOf = (r: Req, seen: Set<string>): number => {
    if (
      r.initiatorType === 'parser' ||
      r.initiatorType === 'preload' ||
      r.initiatorType === 'other' ||
      r.initiatorUrl === undefined
    ) {
      return 1;
    }
    const initiatorKey = urlBase(r.initiatorUrl);
    const initiator = byUrl.get(initiatorKey);
    if (initiator === undefined || initiator === r) return 1;
    if (seen.has(initiatorKey)) return 1;
    seen.add(initiatorKey);
    return 1 + roundOf(initiator, seen);
  };
  const perRound = new Map<number, Req[]>();
  let max = 0;
  for (const r of requests) {
    const d = roundOf(r, new Set());
    (perRound.get(d) ?? perRound.set(d, []).get(d)!).push(r);
    if (d > max) max = d;
  }
  return { rounds: max, perRound };
}

describe('round-count roundsOf — causal import depth (R1)', () => {
  it('preloaded items arriving staggered under HTTP/1.1 are all round 1', () => {
    // 10 modulepreload items on the boot list — 6 fetched in the
    // first connection batch, the remaining 4 queued behind them.
    // The queued ones start AFTER earlier ones end, so the pre-fix
    // timing metric counted them as round 2. The causal-depth
    // metric reads the initiator type — every preload-initiated
    // request is round 1.
    const reqs: Req[] = [];
    let t = 0;
    for (let i = 0; i < 6; i++) {
      reqs.push({
        url: `http://localhost:4173/shared/preload-${i}.js`,
        start: t,
        end: t + 100,
        initiatorType: 'preload',
      });
      t += 5; // small start stagger, all overlap
    }
    // Queued: each starts after the previous batch ends. The
    // pre-fix timing metric (`end <= start` opens a round) would
    // count each of these as round 2 — the bug the gate failed on.
    for (let i = 6; i < 10; i++) {
      t += 50; // start after the first batch ended
      reqs.push({
        url: `http://localhost:4173/shared/preload-${i}.js`,
        start: t,
        end: t + 100,
        initiatorType: 'preload',
      });
    }
    const { rounds, perRound } = roundsOf(reqs);
    expect(rounds).toBe(1);
    expect(perRound.get(1)).toHaveLength(10);
    expect(perRound.get(2)).toBeUndefined();
  });

  it('a genuinely unlisted native import is round 2', () => {
    // A `/shared/` boot item (`a.js`) is preloaded (round 1). It
    // imports `/shared/unlisted.js`, which is NOT on the boot list —
    // the import is `script`-initiated by `a.js`. The unlisted
    // import is round 2; the gate fails naming it as the breaker.
    const reqs: Req[] = [
      {
        url: 'http://localhost:4173/shared/a.js',
        start: 0,
        end: 100,
        initiatorType: 'preload',
      },
      {
        url: 'http://localhost:4173/shared/unlisted.js',
        start: 110, // after a.js ends (its import triggered)
        end: 200,
        initiatorType: 'script',
        initiatorUrl: 'http://localhost:4173/shared/a.js',
      },
    ];
    const { rounds, perRound } = roundsOf(reqs);
    expect(rounds).toBe(2);
    expect(perRound.get(1)?.[0]?.url).toBe('http://localhost:4173/shared/a.js');
    expect(perRound.get(2)?.[0]?.url).toBe('http://localhost:4173/shared/unlisted.js');
  });

  it('an import chain a → b → c reaches round 3', () => {
    const reqs: Req[] = [
      {
        url: 'http://localhost:4173/shared/a.js',
        start: 0,
        end: 50,
        initiatorType: 'preload',
      },
      {
        url: 'http://localhost:4173/shared/b.js',
        start: 60,
        end: 100,
        initiatorType: 'script',
        initiatorUrl: 'http://localhost:4173/shared/a.js',
      },
      {
        url: 'http://localhost:4173/shared/c.js',
        start: 110,
        end: 150,
        initiatorType: 'script',
        initiatorUrl: 'http://localhost:4173/shared/b.js',
      },
    ];
    const { rounds, perRound } = roundsOf(reqs);
    expect(rounds).toBe(3);
    expect(perRound.get(1)?.[0]?.url).toBe('http://localhost:4173/shared/a.js');
    expect(perRound.get(2)?.[0]?.url).toBe('http://localhost:4173/shared/b.js');
    expect(perRound.get(3)?.[0]?.url).toBe('http://localhost:4173/shared/c.js');
  });

  it('a script-initiated request whose initiator is outside the slice is round 1', () => {
    // The expose phase's first unit fetch is `script`-initiated by
    // the shell's bundle (outside `/shared/`), so the initiator is
    // not in the slice. The phase entry is round 1; subsequent
    // imports from that entry are round 2.
    const reqs: Req[] = [
      {
        url: 'http://localhost:4173/shared/expose-entry.js',
        start: 0,
        end: 100,
        initiatorType: 'script',
        initiatorUrl: 'http://localhost:4173/assets/entry.js',
      },
      {
        url: 'http://localhost:4173/shared/expose-chunk.js',
        start: 110,
        end: 200,
        initiatorType: 'script',
        initiatorUrl: 'http://localhost:4173/shared/expose-entry.js',
      },
    ];
    const { rounds, perRound } = roundsOf(reqs);
    expect(rounds).toBe(2);
    expect(perRound.get(1)?.[0]?.url).toBe('http://localhost:4173/shared/expose-entry.js');
    expect(perRound.get(2)?.[0]?.url).toBe('http://localhost:4173/shared/expose-chunk.js');
  });

  it('a self-referential initiator chain caps at round 1 (cycle guard)', () => {
    const reqs: Req[] = [
      {
        url: 'http://localhost:4173/shared/loop.js',
        start: 0,
        end: 100,
        initiatorType: 'script',
        initiatorUrl: 'http://localhost:4173/shared/loop.js',
      },
    ];
    const { rounds } = roundsOf(reqs);
    expect(rounds).toBe(1);
  });
});
