import {
  parseGrammar,
  type BackProjectionDelta,
  type DomainKey,
  type EntryAddress,
  type ExtensionToken,
  type NavigationHistory,
  type RegisteredExtensionsSource,
  type RouteSignal,
  type Transition,
} from '@gears-frontx/routing';
import { getExtensionRouteToken, type ActionsChain, type ActionPayload, type Extension, type MfeRegistry } from '@gears-frontx/mfes';

export interface DomainRouteStatus {
  readonly entries: number;
  readonly unresolved: number;
}

export interface DomainRoutingOptions {
  readonly history: NavigationHistory;
  readonly signal: RouteSignal;
  readonly registry: MfeRegistry;
  readonly domainId: string;
  readonly domainKey: DomainKey;
  readonly mountActionType: string;
  /** Absent for a domain that declares no unmount action (the screen domain). */
  readonly unmountActionType?: string;
  readonly cardinality: 'single' | 'multiple';
  /** For a nested domain: the enclosing occupant's own entry. Writes made while it is absent wait for it. */
  readonly enclosing?: EntryAddress;
}

/**
 * An extension's own declared route: its `route` field, or (for a screen
 * extension) `presentation.route` — the two conventions `mfes` allows
 * (`Extension.route` doc comment: "usable by an extension without
 * `presentation`").
 */
function extensionTokenOf(extension: Extension): ExtensionToken | undefined {
  return getExtensionRouteToken(extension) as ExtensionToken | undefined;
}

/**
 * The private stamp a `DomainRouting` instance writes into a mount request's
 * payload before dispatching it itself (`onTransition`'s restore dispatch,
 * `withOpening`'s opening dispatch): which domain instance originated the
 * request, and whether the request restores a URL-driven entry or opens a
 * nested domain's own occupant. A payload with no stamp at all is
 * programmatic — some chain, not this class, originated it.
 *
 * The field is undeclared in the `mount_ext` GTS schema (an open object
 * type), so admission does not reject it; only this domain's own handler
 * ever reads it, off the same payload it mounted with.
 */
interface RoutingOrigin {
  readonly domainKey: string;
  readonly kind: 'restore' | 'opening';
}

/** Narrows `payload.routingOrigin` without asserting past what a caller could actually have put there. */
function isRoutingOrigin(value: unknown): value is RoutingOrigin {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.domainKey === 'string' && (candidate.kind === 'restore' || candidate.kind === 'opening');
}

function readRoutingOrigin(payload: ActionPayload): RoutingOrigin | undefined {
  const origin = (payload as Record<string, unknown>).routingOrigin;
  return isRoutingOrigin(origin) ? origin : undefined;
}

/**
 * Dispatch a mount/unmount action through the actions chain, fire-and-forget:
 * `executeActionsChain` is acceptance-only (#648) — it validates and admits
 * the chain synchronously, refuses on a synchronous throw, and yields
 * nothing to await for the chain's own execution. Neither this class nor any
 * of its callers tracks a dispatch's own settlement; a domain's handler
 * reports back through `afterMount`/`afterUnmount`, called from inside the
 * handler itself once its own mount/unmount work has settled.
 */
export function dispatchChain(registry: MfeRegistry, chain: ActionsChain, label: string): void {
  try {
    registry.executeActionsChain(chain);
  } catch (error) {
    console.error(`[routing] ${label} refused`, error);
  }
}

/**
 * One domain's side of the route ownership signal, held by the host-owned
 * implementation of that domain: back-projection after every mount/unmount
 * the domain's own handlers perform (O5, O7), mount/unmount re-dispatched
 * through the actions chain for every transition the observer reports (O6),
 * and the entry address of each occupant. One instance per domain key (O4).
 *
 * A mount request this instance dispatches itself — the restore dispatch in
 * `onTransition`, the opening dispatch in `withOpening` — carries a
 * `routingOrigin` stamp naming this instance's own key and the request's
 * kind. `afterMount` reads that stamp off the very payload the domain's
 * handler mounted with: a restore never writes back (the URL already asked
 * for it), an opening amends the enclosing entry's own history entry, and an
 * unstamped (programmatic) request projects a fresh entry. A stamp naming a
 * different domain key is a request this instance never issued — some other
 * routing session's — and is ignored outright, with no write and no further
 * dispatch.
 *
 * Ordering invariant `withOpening` and `afterMount`'s opening branch rely on:
 * no programmatic mount of the same subject can execute before this domain's
 * opening dispatch. `DefaultExtensionMounter.mount` is `async`; with no root
 * attached yet it returns a *rejected promise*, not a synchronous throw — a
 * request reaching the mounter before attach fails and takes its own
 * fallback rather than becoming an in-flight mount a later request could
 * join. Opening is itself dispatched synchronously inside the same attach
 * callback that gives the mounter its root, strictly before any chain
 * continuation gated on this domain's attachment can run. So restore and
 * opening requests always reach the mounter first; a programmatic request
 * for the same subject either joins one of them (inheriting its no-write or
 * `replace` outcome) or arrives after both have already mounted, in which
 * case it is a user's own open and correctly pushes its own entry.
 */
export class DomainRouting {
  private release: (() => void) | undefined;
  private status: DomainRouteStatus = { entries: 0, unresolved: 0 };
  private readonly statusListeners = new Set<{ readonly callback: () => void }>();
  private pendingOpen: ExtensionToken[] | undefined;
  private releasePending: (() => void) | undefined;
  /**
   * The last resolved owner seen for each token — updated for every
   * resolved `added` or `resolutionChanged` entry, not only the ones this
   * instance itself dispatched a mount for. Kept so a later
   * `resolutionChanged` for the same token (an owner swap under a URL
   * entry that never left the URL) can tell who the *prior* owner was; the
   * transition report itself carries only the new one. Cleared in
   * `stop()` — otherwise a token rediscovered as `added` after a
   * stop/start cycle would be compared against a stale owner from before
   * the domain stopped rather than against nothing (N3).
   */
  private readonly lastOwnerByToken = new Map<ExtensionToken, string>();
  /**
   * Set by `stop()`, cleared by `start()`. Guards `afterMount`/`afterUnmount`
   * against a call that arrives after this instance was told to stop — a
   * mount whose settlement is reported only after its own Widgets Host
   * unmounted, say. Without this, such a call would still write to history
   * and, if it opened a nested domain's window, open a fresh pending-write
   * subscription that `stop()` already ran and will not run again to
   * release.
   */
  private stopped = false;

  constructor(private readonly options: DomainRoutingOptions) {}

  entryAddressFor(extensionId: string): EntryAddress | undefined {
    const extension = this.tokenOf(extensionId);
    return extension === undefined ? undefined : { domainKey: this.options.domainKey, extension };
  }

  /**
   * Call from the domain's mount handler after its strategy's mount settled
   * and before the handler itself settles: the actions chain selects `next`
   * only on that settlement, so a chained step that depends on this entry
   * (the widget's ping) cannot run before it is in the URL. `payload` is the
   * same `ActionPayload` the handler mounted with — its `routingOrigin`
   * stamp, if any, is this method's own instruction for what to do.
   *
   * A repeat mount of the same extension in a 'multiple'-cardinality domain
   * that already carries this token in the URL makes no second write here
   * (the `!own.includes(token)` guard below) — that lets a caller merge a
   * redundant mount request (URL restore, an auto-mount pass and a chain
   * asking for the same subject at once) into one physical mount and still
   * call this once it settles.
   */
  afterMount(payload: ActionPayload): void {
    const origin = readRoutingOrigin(payload);
    // Blocker 1: a stamp naming another domain instance's key is a request
    // this instance never dispatched — a navigation-originated request for
    // another routing session is never reinterpreted as this session's own.
    if (origin && origin.domainKey !== this.options.domainKey) return;
    if (this.stopped) return;
    const token = this.tokenOf(payload.subject);
    if (token === undefined) return;
    if (origin?.kind === 'restore') {
      // The URL asked for this mount; there is nothing to project back. If
      // the entry was withdrawn while the mount was still settling, the
      // removal loop in `onTransition` has already released the occupant.
      return;
    }
    if (origin?.kind === 'opening') {
      if (this.options.enclosing && !this.enclosingPresent(this.options.enclosing)) {
        this.deferAsOpening([token]);
      } else if (!this.ownEntries().includes(token)) {
        // Amends the enclosing entry's own history entry rather than pushing a second one.
        this.write({ added: [{ extension: token, params: [] }] }, 'replace');
      }
      return;
    }
    // Unstamped: a programmatic mount, this domain's own consumer opening it.
    if (this.options.enclosing && !this.enclosingPresent(this.options.enclosing)) {
      this.deferAsOpening([token]);
      return;
    }
    const own = this.ownEntries();
    if (this.options.cardinality === 'multiple') {
      if (!own.includes(token)) this.write({ added: [{ extension: token, params: [] }] }, 'push');
      return;
    }
    const others = own.filter((t) => t !== token);
    if (others.length === own.length) {
      if (others.length === 0) {
        this.write({ added: [{ extension: token, params: [] }] }, 'push');
      } else {
        const [first, ...rest] = others;
        this.write({ replaced: [{ oldExtension: first, entry: { extension: token, params: [] } }], removed: rest }, 'push');
      }
      return;
    }
    // The token is already among `own` — a stray duplicate entry for this
    // single-occupant domain (never produced by this class's own writes;
    // only a malformed or hand-built URL). Self-heal by dropping the rest.
    if (others.length > 0) this.write({ removed: others }, 'replace');
  }

  /** From the domain's own unmount handler only — never for an unmount the enclosing occupant's removal caused (O7). */
  afterUnmount(extensionId: string): void {
    if (this.stopped) return;
    const token = this.tokenOf(extensionId);
    if (token === undefined) return;
    // An unmount arriving for a token this instance is still collecting (or
    // waiting on the enclosing entry to write) must drop that token from the
    // collection — otherwise a widget unmounted mid-window still gets written
    // once the window closes, since neither array is ever consulted against
    // the URL for a token it has not written yet.
    if (this.pendingOpen) {
      const next = this.pendingOpen.filter((t) => t !== token);
      this.pendingOpen = next.length > 0 ? next : undefined;
      if (this.pendingOpen === undefined) {
        this.releasePending?.();
        this.releasePending = undefined;
      }
    }
    if (!this.ownEntries().includes(token)) return;
    this.write({ removed: [token] }, 'replace');
  }

  /**
   * Dispatches this domain's opening mounts — the ones fired once its own
   * root (or its enclosing occupant's) has just attached — each stamped so
   * its own `afterMount` amends the enclosing entry's history entry instead
   * of pushing a second one. Fire-and-forget: `mfes` serializes each
   * subject's own mount/unmount lifecycle, and this class relies on that
   * ordering (see the class doc comment's ordering invariant) rather than
   * awaiting anything here.
   */
  withOpening(extensionIds: readonly string[]): void {
    if (this.stopped) return;
    for (const subject of extensionIds) {
      dispatchChain(
        this.options.registry,
        {
          action: {
            type: this.options.mountActionType,
            target: this.options.domainId,
            payload: { subject, routingOrigin: { domainKey: this.options.domainKey, kind: 'opening' } },
          },
        },
        `mount ${subject}`,
      );
    }
  }

  /** Once discovery has settled and the domain's root is attached. Idempotent. */
  start(): void {
    if (this.release) return;
    this.stopped = false;
    this.release = this.options.signal.createObserver<string>(this.options.domainKey, this.source(), (t) => this.onTransition(t));
  }

  stop(): void {
    this.stopped = true;
    this.release?.();
    this.release = undefined;
    this.pendingOpen = undefined;
    this.releasePending?.();
    this.releasePending = undefined;
    // A token rediscovered after a restart arrives as fresh `added`, not
    // `resolutionChanged` — clearing here is what keeps it compared against
    // nothing rather than the owner this instance saw before it stopped (N3).
    // Defence-in-depth with the `resolutionChanged`-only gate below in
    // `onTransition`: that gate alone would still be safe against a stale
    // map entry surviving a restart (an `added` token is never matched by
    // it), and this clear alone would still be safe against a genuine same-
    // URL owner swap (that arrives as `resolutionChanged`, never `added`).
    // The two halves only have a jointly observable scenario — a token
    // rediscovered as `added` after a stop/start cycle while some other
    // owner of it is still (independently) mounted — which is what
    // `__tests__/domain-routing.test.ts`'s "does not unmount a still-mounted
    // extension when the same token is rediscovered as added ... (N3)" test
    // exercises; neither half has a scenario that isolates it from the other
    // without reaching into private state, so this comment stands in for a
    // test that would only duplicate that one.
    this.lastOwnerByToken.clear();
    this.status = { entries: 0, unresolved: 0 };
    this.notifyStatusListeners();
  }

  getStatus(): DomainRouteStatus {
    return this.status;
  }

  subscribeStatus(listener: () => void): () => void {
    // A token object, not `listener` itself, is what `statusListeners` keys
    // off — mirrors the routing substrate's own `FanOutDispatcher` reasoning
    // (`packages/routing/src/history/fanout-dispatch.ts`): two subscriptions
    // of the identical callback reference must stay two independent,
    // independently releasable registrations, not one `Set` entry that
    // either side's release deletes out from under the other.
    const token = { callback: listener };
    this.statusListeners.add(token);
    return () => this.statusListeners.delete(token);
  }

  private notifyStatusListeners(): void {
    for (const token of [...this.statusListeners]) {
      try {
        token.callback();
      } catch (error) {
        console.error('[routing] a status listener threw', error);
      }
    }
  }

  private deferAsOpening(tokens: readonly ExtensionToken[]): void {
    this.pendingOpen = [...(this.pendingOpen ?? []), ...tokens.filter((t) => !(this.pendingOpen ?? []).includes(t))];
    this.flushOpening();
    if (this.pendingOpen && !this.releasePending) {
      // Runs inside the fan-out of the navigation that brings the enclosing entry.
      this.releasePending = this.options.history.subscribe(() => this.flushOpening());
    }
  }

  private flushOpening(): void {
    const enclosing = this.options.enclosing;
    if (!this.pendingOpen || (enclosing && !this.enclosingPresent(enclosing))) return;
    const own = this.ownEntries();
    const missing = this.pendingOpen.filter((t) => !own.includes(t));
    this.pendingOpen = undefined;
    this.releasePending?.();
    this.releasePending = undefined;
    if (missing.length > 0) this.write({ added: missing.map((extension) => ({ extension, params: [] })) }, 'replace');
  }

  private enclosingPresent(enclosing: EntryAddress): boolean {
    return this.entries().some((e) => e.domainKey === enclosing.domainKey && e.extension === enclosing.extension);
  }

  private tokenOf(extensionId: string): ExtensionToken | undefined {
    const extension = this.options.registry.getExtension(extensionId);
    return extension ? extensionTokenOf(extension) : undefined;
  }

  private entries() {
    const { path, search, hash } = this.options.history.location;
    return parseGrammar({ shellSubroute: path, search, hash }).entries;
  }

  private ownEntries(): ExtensionToken[] {
    return this.entries()
      .filter((e) => e.domainKey === this.options.domainKey)
      .map((e) => e.extension);
  }

  private write(delta: BackProjectionDelta, verb: 'push' | 'replace'): void {
    try {
      this.options.signal.backProjectEntries(this.options.domainKey, delta, verb);
    } catch (error) {
      console.error(`[routing] back-projection for ${this.options.domainKey} failed`, error);
    }
  }

  /**
   * This domain's own registrations, resolved fresh on every call.
   * Deliberately has no `onChange`: nothing in `@gears-frontx/routing`
   * notifies a caller when `mfes` registers or unregisters an extension, so
   * a registration change becomes visible only on the next
   * navigation-triggered round (`observe-change.ts`'s own fan-out
   * subscription) — not the instant it happens. A `resolutionChanged` swap
   * under a stable URL entry (`onTransition` below) is therefore only
   * detected once some navigation, even a same-path `history` notification,
   * causes a fresh round.
   */
  private source(): RegisteredExtensionsSource<string> {
    return {
      getRegistrations: () =>
        this.options.registry.getExtensionsForDomain(this.options.domainId).flatMap((extension) => {
          const token = extensionTokenOf(extension);
          return token === undefined ? [] : [{ extension: token, routeOwner: extension.id }];
        }),
    };
  }

  private ownerOf(token: ExtensionToken): string | undefined {
    return this.options.registry.getExtensionsForDomain(this.options.domainId).find((e) => extensionTokenOf(e) === token)?.id;
  }

  private onTransition(transition: Transition<string>): void {
    const mounted = new Set(this.options.registry.getMountedExtensions(this.options.domainId));
    const unmountType = this.options.unmountActionType;
    const resolutionChanged = new Set(transition.diff.resolutionChanged);
    let mounting = false;
    for (const token of [...transition.diff.added, ...transition.diff.resolutionChanged]) {
      const entry = transition.entries.find((e) => e.extension === token);
      if (!entry || !entry.resolution.resolved) continue;
      mounting = true;
      const owner = entry.resolution.routeOwner;
      const priorOwner = this.lastOwnerByToken.get(token);
      this.lastOwnerByToken.set(token, owner);
      // A `resolutionChanged` swap: the token's URL entry never left, so it
      // never appears in `diff.removed` and the loop below never sees it —
      // the prior owner, if still mounted, must be told to unmount here.
      // Restricted to an actual `resolutionChanged` (never `added` — a token
      // rediscovered fresh, e.g. after a stop/start cycle, is not a swap,
      // N3) and to a 'multiple'-cardinality domain: all four shell domains
      // (screen, sidebar, popup, overlay) are 'single'-cardinality, and a
      // 'single'-cardinality domain is mounted through either
      // `ExclusiveMountStrategy.mount` or `OptionalMountStrategy.mount` —
      // both already evict the prior occupant before mounting the new one,
      // so `afterMount`'s `replaced` write only updates the URL, it does
      // not itself unmount anything — dispatching an unmount here too
      // would double-unmount it (N1, contradicts the `single && mounting`
      // suppression below).
      if (
        this.options.cardinality === 'multiple' &&
        resolutionChanged.has(token) &&
        priorOwner !== undefined &&
        priorOwner !== owner &&
        unmountType !== undefined &&
        mounted.has(priorOwner)
      ) {
        dispatchChain(
          this.options.registry,
          { action: { type: unmountType, target: this.options.domainId, payload: { subject: priorOwner } } },
          `unmount ${priorOwner}`,
        );
      }
      if (mounted.has(owner)) continue; // an echo of this domain's own back-projection
      dispatchChain(
        this.options.registry,
        {
          action: {
            type: this.options.mountActionType,
            target: this.options.domainId,
            payload: { subject: owner, routingOrigin: { domainKey: this.options.domainKey, kind: 'restore' } },
          },
        },
        `mount ${owner}`,
      );
    }
    // With the enclosing entry gone, this is the enclosing occupant being removed (Back/Forward):
    // DefaultExtensionMounter.detach() unmounts this domain's occupants; a second unmount would race it.
    const enclosing = this.options.enclosing;
    const enclosingGone = enclosing !== undefined && !this.enclosingPresent(enclosing);
    const suppressRemovals = enclosingGone || (this.options.cardinality === 'single' && mounting);
    for (const token of transition.diff.removed) {
      this.lastOwnerByToken.delete(token);
      if (unmountType === undefined || suppressRemovals) continue;
      const owner = this.ownerOf(token);
      // Dispatched whether or not `owner` is already mounted: a URL-driven
      // mount for this same token can still be settling when its entry is
      // withdrawn, and that mount holds no marker of its own to consult here
      // any more — the receiving domain (queued, concurrent, or not yet
      // mounted at all) is what decides how its own unmount lands against
      // that in-flight or future mount (R2).
      if (owner) {
        dispatchChain(this.options.registry, { action: { type: unmountType, target: this.options.domainId, payload: { subject: owner } } }, `unmount ${owner}`);
      }
    }
    this.status = {
      entries: transition.entries.length,
      unresolved: transition.entries.filter((e) => !e.resolution.resolved).length,
    };
    this.notifyStatusListeners();
  }
}
