/**
 * useMountedExtensions Hook - Mounted extension observation for any domain
 *
 * Domain-agnostic hook that returns the currently-mounted Extension instances
 * for any registered domain, including multi-mount domains backed by
 * ConcurrentMountStrategy.
 *
 * React Layer: L3
 */

import { useSyncExternalStore, useCallback, useRef } from 'react';
import { useFrontX } from '../../FrontXContext';
import { resolveMfeRegistry } from './useMfeRegistry';
import type { Extension } from '@gears-frontx/framework';
// Framework-internal reach-through (never MFE-reachable) — the same path
// `useDomainRouteStatus` reads the router's own signals through.
import { subscribeSettledMounts } from '@gears-frontx/framework/internal';

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for observing the currently-mounted extensions in any domain.
 *
 * Re-reads on every settled `mount_ext`/`unmount_ext` of the registry, in any
 * domain: those actions are the only thing that changes the mounted set, and
 * the framework router is told about each one as it settles (succeeded or
 * not). Returns the array of Extension instances currently mounted in the
 * specified domain.
 *
 * Pairs with getMountedExtensions(domainId) on the registry and resolves each
 * mounted extension ID to its Extension instance. IDs that have been unregistered
 * concurrently (race against unregister) are filtered out.
 *
 * Returns a referentially stable array when the underlying ID list is unchanged.
 *
 * For multi-mount domains (ConcurrentMountStrategy), may return more than one entry.
 * For single-mount domains (ExclusiveMountStrategy), the returned array has at most one entry.
 *
 * @param domainId - Domain ID to query mounted extensions for
 * @returns Array of Extension instances currently mounted in the domain
 *
 * @example
 * ```tsx
 * function MountedWidgets() {
 *   const mounted = useMountedExtensions('gts.frontx.mfes.ext.domain.v1~frontx.screensets.layout.sidebar.v1');
 *
 *   return (
 *     <ul>
 *       {mounted.map(ext => (
 *         <li key={ext.id}>{ext.id}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useMountedExtensions(domainId: string): Extension[] {
  const app = useFrontX();
  const registry = resolveMfeRegistry(app, 'useMountedExtensions');

  const subscribe = useCallback(
    (onChange: () => void) => subscribeSettledMounts(registry, onChange),
    [registry]
  );

  // Cache the snapshot to maintain referential stability for useSyncExternalStore.
  // Only update when the mounted ID list actually changes.
  const cacheRef = useRef<{ key: string; extensions: Extension[] }>({ key: '', extensions: [] });

  const getSnapshot = useCallback(() => {
    const ids = registry.getMountedExtensions(domainId);
    const resolved = ids
      .map(id => registry.getExtension(id))
      .filter((ext): ext is Extension => ext !== undefined);

    const key = ids.join(',');

    if (key !== cacheRef.current.key) {
      cacheRef.current = { key, extensions: resolved };
    }
    return cacheRef.current.extensions;
  }, [registry, domainId]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
