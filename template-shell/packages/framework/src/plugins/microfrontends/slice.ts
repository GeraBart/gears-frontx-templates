/**
 * MFE Slice
 *
 * Store slice for managing MFE registration states.
 * Tracks registration state (unregistered, registering, registered, error) and error messages per extension.
 */

// @cpt-state:cpt-frontx-state-framework-composition-mfe-registration:p1
// @cpt-state:cpt-frontx-state-framework-composition-mfe-mount:p1
// @cpt-dod:cpt-frontx-dod-framework-composition-mfe-plugin:p1

import { createSlice, type ReducerPayload, type RootState } from '@gears-frontx/state';

// ============================================================================
// State Types
// ============================================================================

/** Extension registration state */
export type ExtensionRegistrationState = 'unregistered' | 'registering' | 'registered' | 'error';

/** MFE slice state */
export interface MfeState {
  registrationStates: Record<string, ExtensionRegistrationState>;
  errors: Record<string, string>;
}

declare module '@gears-frontx/state' {
  interface RootState {
    /** Present when the microfrontends plugin is registered. */
    mfe?: MfeState;
  }
}

// ============================================================================
// Initial State
// ============================================================================

const SLICE_KEY = 'mfe' as const;

const initialState: MfeState = {
  registrationStates: {},
  errors: {},
};

// ============================================================================
// Slice Definition
// ============================================================================

// @cpt-begin:cpt-frontx-state-framework-composition-mfe-registration:p1:inst-1
// @cpt-begin:cpt-frontx-state-framework-composition-mfe-mount:p1:inst-1
const { slice, ...actions } = createSlice({
  name: SLICE_KEY,
  initialState,
  reducers: {
    // Registration state reducers
    setExtensionRegistering: (state: MfeState, action: ReducerPayload<{ extensionId: string }>) => {
      state.registrationStates[action.payload.extensionId] = 'registering';
    },

    setExtensionRegistered: (state: MfeState, action: ReducerPayload<{ extensionId: string }>) => {
      state.registrationStates[action.payload.extensionId] = 'registered';
    },

    setExtensionUnregistered: (state: MfeState, action: ReducerPayload<{ extensionId: string }>) => {
      state.registrationStates[action.payload.extensionId] = 'unregistered';
    },

    setExtensionError: (state: MfeState, action: ReducerPayload<{ extensionId: string; error: string }>) => {
      state.registrationStates[action.payload.extensionId] = 'error';
      state.errors[action.payload.extensionId] = action.payload.error;
    },
  },
});
// @cpt-end:cpt-frontx-state-framework-composition-mfe-registration:p1:inst-1
// @cpt-end:cpt-frontx-state-framework-composition-mfe-mount:p1:inst-1

// ============================================================================
// Exports
// ============================================================================

export const mfeSlice = slice;
export const mfeActions = actions;

// Individual actions for convenience
export const {
  setExtensionRegistering,
  setExtensionRegistered,
  setExtensionUnregistered,
  setExtensionError,
} = actions;

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select extension registration state for an extension.
 * Returns 'unregistered' if extension is not tracked.
 */
export function selectExtensionState(state: RootState, extensionId: string): ExtensionRegistrationState {
  return state.mfe?.registrationStates[extensionId] ?? 'unregistered';
}

/**
 * Select all registered extensions.
 * Returns array of extension IDs with 'registered' state.
 */
export function selectRegisteredExtensions(state: RootState): string[] {
  const mfe = state.mfe;
  if (!mfe) return [];
  return Object.entries(mfe.registrationStates)
    .filter(([_, regState]) => regState === 'registered')
    .map(([extensionId]) => extensionId);
}

/**
 * Select extension error for an extension.
 * Returns undefined if no error.
 */
export function selectExtensionError(state: RootState, extensionId: string): string | undefined {
  return state.mfe?.errors[extensionId];
}

export default slice.reducer;
