import { test, expect, type Page, type CDPSession } from '@playwright/test';
import { FillRequestWatcher } from '../scripts/load-matrix/FillRequestWatcher.mjs';
import { BLANK_HOME_EXTENSION_ID, UIKIT_ELEMENTS_EXTENSION_ID, menuItemTestId } from './extensionIds.mjs';
import { SHELL_PORT } from './ports.mjs';

const scheme = process.env.E2E_PROTOCOL === 'h2' ? 'https' : 'http';

/**
 * Round-count gate (load_gates (2)): the list model designs exactly ONE
 * sequential fetch round per entry — the entry's list is held in the
 * registered manifest, so the entry module, every missing unit and the
 * list's own chunks are requested together in ONE parallel batch — plus
 * ONE round per lazy target on its first use. This spec counts
 * sequential rounds of shared-chunk (`.js` unit) fetches inside
 * `/shared/` for shell boot, an expose load and a lazy target, and fails
 * naming the entry, the observed round count and the unit that opened
 * the extra round. No list document is requested: a `.json` request
 * under `/shared/` fails the spec.
 *
 * A round is **causal import depth**, not connection timing:
 * a request's round is read from the CDP `Network.requestWillBeSent`
 * initiator chain — parser/preload-initiated requests are round 1
 * (the boot list's flat modulepreload fan-out, or the document's own
 * `<script type="module">`); a script-initiated request is
 * `1 + initiator's round`, where the initiator is the request whose
 * URL matches the initiator stack's top frame. Counting by timing
 * (a request that ended before another started opens a new round)
 * fails on HTTP/1.1: preloads beyond the ~6-connection cap queue
 * behind earlier ones, so a round-2 start time after a round-1 end
 * is the connection staggering, not the import waterfall — every
 * preloaded boot item would intermittently count as round 2.
 *
 * Shell boot is separated from the realm-cache fill by request kind,
 * not by when the spec polls: the boot's units are native
 * module/modulepreload loads (CDP resource type `Script`), while the
 * fill — which starts as soon as the shell entry has run and
 * re-requests the same immutable URLs through `fetch()` — issues
 * `Fetch` requests. Splitting the log by that type is exact however
 * the fill's events interleave with the boot's, so the fill's
 * re-fetches never count as boot fetches and are reported on their own.
 */

const SHELL = `${scheme}://localhost:${SHELL_PORT}`;

/** Every `/shared/` JSON request the page issued: a list document, which no load requests. */
const listDocumentRequests: string[] = [];

interface Req {
  url: string;
  start: number;
  end?: number;
  /** CDP `initiator.type` — `parser` | `script` | `preload` | `other`. */
  initiatorType: string;
  /** CDP `type` — `Script` for native module loads, `Fetch` for `fetch()`. */
  resourceType: string;
  /**
   * For script-initiated requests, the URL of the script that
   * triggered the import (`initiator.stack.callFrames[0].url`); for
   * parser/preload, the document URL or `undefined`. Used to look
   * the initiator's request up in the slice by URL.
   */
  initiatorUrl?: string;
}

/** Tracks `/shared/**.js` unit fetches via CDP Network events. */
function watch(cdp: CDPSession) {
  const byId = new Map<string, Req>();
  const requests: Req[] = [];
  cdp.on('Network.requestWillBeSent', (e: any) => {
    const url: string = e.request.url;
    if (url.includes('/shared/') && url.endsWith('.json')) listDocumentRequests.push(url);
    if (!url.includes('/shared/') || !url.endsWith('.js')) return;
    const initiator = e.initiator ?? {};
    const type: string = initiator.type ?? 'other';
    const initiatorUrl =
      type === 'script'
        ? (initiator.stack?.callFrames?.[0]?.url as string | undefined)
        : type === 'parser'
          ? (initiator.url as string | undefined)
          : undefined;
    const r: Req = {
      url,
      start: e.timestamp,
      initiatorType: type,
      resourceType: String(e.type ?? ''),
      initiatorUrl,
    };
    byId.set(e.requestId, r);
    requests.push(r);
  });
  const finish = (e: any) => {
    const r = byId.get(e.requestId);
    if (r) r.end = e.timestamp;
  };
  cdp.on('Network.loadingFinished', finish);
  cdp.on('Network.loadingFailed', finish);
  return requests;
}

/** Strip the query string and hash from a URL for initiator matching. */
function urlBase(url: string): string {
  return url.split('#')[0].split('?')[0];
}

/**
 * Causal import depth: a request's round is `1` if its CDP
 * `initiator.type` is `parser` or `preload` (the boot list's flat
 * modulepreload fan-out, or the document's own `<script type=module>`);
 * `1 + initiator's round` if it is `script`-initiated and the
 * initiator's URL is found in the slice (a `/shared/` chunk that
 * imported it); and `1` if it is `script`-initiated but the
 * initiator's URL is outside the slice (the shell's own entry, or
 * a click handler — the phase's entry point). The recursion guards
 * against cycles and unknown initiators by capping depth at the
 * slice length.
 */
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
    // script-initiated: find the initiator's request in the slice
    const initiatorKey = urlBase(r.initiatorUrl);
    const initiator = byUrl.get(initiatorKey);
    if (initiator === undefined || initiator === r) return 1;
    if (seen.has(initiatorKey)) return 1; // cycle guard
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

function assertRounds(entry: string, expected: number, got: number, perRound: Map<number, Req[]>) {
  const breaker =
    perRound.get(expected + 1)?.[0]?.url ?? perRound.get(got)?.[0]?.url ?? '(none observed)';
  expect(
    got,
    `${entry}: expected ${expected} sequential unit-fetch round(s), observed ${got}; item "${breaker}" opened round ${expected + 1}`,
  ).toBe(expected);
}

async function waitForMountedScreen(page: Page, timeout = 30_000) {
  await page.waitForFunction(
    () => {
      const hosts = document.querySelectorAll('[data-mfe-screen-container] [data-extension-id]');
      for (const h of hosts) {
        const root = (h as HTMLElement).shadowRoot ?? h;
        if (root.childElementCount > 0) return true;
      }
      return false;
    },
    undefined,
    { timeout },
  );
}

test('round-count gate: shell boot, expose load and lazy target fetch in one round each', async ({
  page,
}) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  const requests = watch(cdp);
  const fill = new FillRequestWatcher(page, `${SHELL}/shared/`);

  // Shell boot: the boot data is inline — every shared chunk lands in
  // exactly one parallel batch (designed: 1 unit-fetch round).
  await page.goto(`${SHELL}/`);
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 60_000 });
  // The fill is the only `fetch()` of shared units during boot; wait
  // for its requests to finish so they are all logged, then split.
  await fill.settled(60_000);
  const bootRequests = requests.filter((r) => r.resourceType !== 'Fetch');
  const fillRefetches = requests.length - bootRequests.length;
  const boot = roundsOf(bootRequests);
  console.log(
    `boot: ${boot.rounds} unit-fetch round(s), ${bootRequests.length} unit(s) (+${fillRefetches} fill re-fetch(es))`,
  );
  assertRounds('shell boot', 1, boot.rounds, boot.perRound);

  // Expose load (the blank home screen): the expose's list is held in the
  // manifest; its units fetch in exactly one parallel batch with the
  // entry module (designed: 1 round).
  const beforeExpose = requests.length;
  await page.getByTestId(menuItemTestId(BLANK_HOME_EXTENSION_ID)).click();
  await waitForMountedScreen(page);
  const expose = roundsOf(requests.slice(beforeExpose));
  console.log(`expose load: ${expose.rounds} unit-fetch round(s)`);
  assertRounds('expose ./lifecycle (blank home)', 1, expose.rounds, expose.perRound);

  // Lazy target (the UI-kit elements screen fetches lazy element chunks on
  // demand): designed one round per lazy target.
  const beforeLazy = requests.length;
  await page.getByTestId(menuItemTestId(UIKIT_ELEMENTS_EXTENSION_ID)).click();
  await waitForMountedScreen(page);
  const lazy = roundsOf(requests.slice(beforeLazy));
  console.log(`lazy target: ${lazy.rounds} unit-fetch round(s), ${requests.length - beforeLazy} unit(s)`);
  if (requests.length > beforeLazy) {
    assertRounds('lazy target (UI-kit elements)', 1, lazy.rounds, lazy.perRound);
  }
  // Lists live in the manifest: no list document was requested anywhere.
  expect(listDocumentRequests, 'list documents requested under /shared/').toEqual([]);
});
