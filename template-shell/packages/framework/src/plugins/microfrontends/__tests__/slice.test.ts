import { describe, it, expect } from 'vitest';
import {
  mfeSlice,
  setExtensionRegistering,
  setExtensionRegistered,
  setExtensionError,
} from '../slice';
import type { MfeState } from '../slice';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const reducer = mfeSlice.reducer;

function emptyState(): MfeState {
  return reducer(undefined, { type: '@@INIT' });
}

// ─── Registration reducers ────────────────────────────────────────────────────

describe('registration reducers', () => {
  it('setExtensionRegistering sets state to registering', () => {
    const state = reducer(emptyState(), setExtensionRegistering({ extensionId: 'ext-1' }));
    expect(state.registrationStates['ext-1']).toBe('registering');
  });

  it('setExtensionRegistered sets state to registered', () => {
    const state = reducer(emptyState(), setExtensionRegistered({ extensionId: 'ext-1' }));
    expect(state.registrationStates['ext-1']).toBe('registered');
  });

  it('setExtensionError sets state to error and populates errors map', () => {
    const state = reducer(
      emptyState(),
      setExtensionError({ extensionId: 'ext-1', error: 'load failed' })
    );
    expect(state.registrationStates['ext-1']).toBe('error');
    expect(state.errors['ext-1']).toBe('load failed');
  });
});
