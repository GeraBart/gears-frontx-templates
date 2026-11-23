/**
 * `HostUnitProducer` — produces the host's shared chunks and fetch
 * lists via the one producer (`UnitProducer` from
 * `@gears-frontx/unit-producer`) into the host's own build output
 * directory (`outputDir`, the deployed units base), and applies the
 * consumer barrel fallback: a package the host's own barrel rewrite
 * moved imports off, which no chunk answers, is rewritten back to the
 * barrel in the emitted chunks.
 *
 * `produce` returns `undefined` when the shared set is empty: nothing is
 * built or written then.
 */

import {
  BuildStageTimer,
  ConsumerBarrelFallback,
  defaultProducerCacheDir,
  UnitProducer,
  type ConsumerBarrelRewriteLedger,
  type ProducedSharedPackage,
} from '@gears-frontx/unit-producer';

/** What host unit production returns. */
export interface HostUnitProduction {
  /**
   * The produced packages: content-addressed chunks plus the per-entry
   * fetch lists (`lists`, keyed by requested specifier) the boot data
   * merges into the inline boot list and the lazy lists.
   */
  produced: ProducedSharedPackage[];
  /**
   * The per-stage build-time record the host plugin wrote to
   * `shell-build-report.json`. The host measures Vite's own build
   * time (`buildStart` → `closeBundle`) over the plugin's own hooks;
   * the producer's stages come from the timer it forwards to
   * `UnitProducer`.
   */
  stageTimings: import('@gears-frontx/unit-producer').BuildStageTimings;
  /** Per-package cache hits/misses, sorted by `name@version`. */
  cache: import('@gears-frontx/unit-producer').PackageCacheSummary;
}

export interface HostUnitProducerOptions {
  /** Package root the producer resolves dependencies from. */
  packageRoot: string;
  /** Absolute directory chunks are written into. */
  outputDir: string;
  /** Absolute dist dir; the barrel fallback rewrites chunks in place. */
  distDir: string;
  /** The `exclude` opt-out forwarded to the producer's shared set. */
  exclude?: readonly string[];
  /** The `include` option forwarded to the producer's shared set. */
  include?: readonly string[];
  /** Bare specifiers the host's own chunks import. */
  consumerSpecifiers?: readonly string[];
  /** What the consumer barrel rewrite did to the host's modules. */
  barrelLedger?: ConsumerBarrelRewriteLedger;
  /** The emitted host chunks (file under `distDir`, bare imports). */
  hostChunks?: Array<{ fileName: string; imports: string[] }>;
  /**
   * Build-machine cache directory for the per-`package@version`
   * computation. Defaults to the workspace-wide
   * `<workspace root>/node_modules/.cache/frontx-unit-producer`.
   */
  cacheDir?: string;
  /**
   * Per-stage build-time instrumentation. The host plugin
   * constructs and passes a `BuildStageTimer` so it can read the
   * producer's stage timings and emit them to the shell build report
   * alongside Vite's own build time. When absent, the producer does
   * no timing (no emitted-byte change).
   */
  stageTimer?: BuildStageTimer;
}

export class HostUnitProducer {
  private readonly options: HostUnitProducerOptions;

  constructor(options: HostUnitProducerOptions) {
    this.options = options;
  }

  async produce(
    onError: (message: string) => never
  ): Promise<HostUnitProduction | undefined> {
    const stageTimer = this.options.stageTimer;
    const producer = new UnitProducer({
      packageRoot: this.options.packageRoot,
      outputDir: this.options.outputDir,
      exclude: this.options.exclude,
      include: this.options.include,
      consumerSpecifiers: this.options.consumerSpecifiers,
      stageTimer,
      cacheDir:
        this.options.cacheDir ??
        defaultProducerCacheDir(this.options.packageRoot),
    });
    const produced = await producer.produce(onError);
    if (produced.length === 0) return undefined;

    // A barrel rewrite no chunk answers goes back to the barrel.
    const ledger = this.options.barrelLedger;
    if (ledger !== undefined) {
      ConsumerBarrelFallback.apply({
        produced,
        ledger,
        outDir: this.options.distDir,
        chunks: this.options.hostChunks ?? [],
      });
    }

    return {
      produced,
      cache: producer.cacheOutcomes(),
      stageTimings: stageTimer !== undefined ? stageTimer.toRecord() : (new BuildStageTimer()).toRecord(),
    };
  }
}
