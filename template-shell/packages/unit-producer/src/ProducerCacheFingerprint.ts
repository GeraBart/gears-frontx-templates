/**
 * `ProducerCacheFingerprint` — the mix string folded into the
 * build-cache key (`PackageBuildCache.fingerprint`'s `mix` argument),
 * composed of content hashes of every input the cached computation
 * depends on:
 *
 *   - the producer's own built code (`ProducerCodeHash.compute()` —
 *     a content hash of the `dist/` files actually executed, computed
 *     once per process), so a change to producer code without a
 *     version bump cannot reuse outputs computed by old code;
 *   - the fixed build settings (`ProducerBuildSettings.fingerprintText`),
 *     so a settings change never reuses a computation it did not run;
 *   - a cache-schema tag, bumped when the key composition changes.
 *
 * The producer's *version string* is deliberately NOT in the key:
 * a version label is not a content hash, and relying on it masked
 * stale output (warm builds kept serving chunks computed before a fix
 * because the version had not bumped).
 */

import { ProducerBuildSettings } from './ProducerBuildSettings';
import { ProducerCodeHash } from './ProducerCodeHash';

export class ProducerCacheFingerprint {
  /**
   * The mix string for the build-cache key. Deterministic for a given
   * code hash; independent of the producer version string.
   */
  static mix(codeHash: string): string {
    return (
      `${codeHash}\n` +
      `${ProducerBuildSettings.fingerprintText()}\n` +
      `cache-schema-11`
    );
  }

  /**
   * The mix string using the memoized producer code hash — the form
   * `UnitProducer.computeChunks` folds into the build-cache key.
   */
  static forProcess(): string {
    return ProducerCacheFingerprint.mix(ProducerCodeHash.compute());
  }
}
