/**
 * `SessionFixtures` — session-fixture selection. The harness records a fixed extension sequence at
 * construction (the existing 8 fixture extensions cover 5 distinct
 * loads; the old rule runs the same sequence), and selects one of
 * three session forms:
 *
 *   shell+1                  — a single extension, selected by id
 *   shell+5-sequential       — five distinct extensions opened one
 *                              after another, each measured to mount
 *   shell+5-parallel-startup — five startup extensions, loaded together
 *                              right after the shell's bootstrap through
 *                              the shell's own registry
 *
 * The parallel startup case uses the five visual extensions the template
 * ships; the template has one root domain and no headless extension, so
 * no other kind is recorded. `select('shell+5-parallel-startup')` fails
 * closed when fewer than five visual startup extensions are recorded.
 *
 * One class per file (OOP). Pure — no I/O.
 */

/** @typedef {'visual'} ExtensionKind */

/**
 * @typedef {Object} FixtureExtension
 * @property {string} id
 * @property {ExtensionKind} kind
 * @property {string} label
 * @property {string} domain
 */

/** @typedef {'shell+1' | 'shell+5-sequential' | 'shell+5-parallel-startup'} SessionKind */

export class SessionFixtures {
  /** @type {FixtureExtension[]} */
  #extensions;
  /** @type {string[]} */
  #sequence;
  /** @type {string} */
  #singleExtensionId;

  /**
   * @param {Object} opts
   * @param {FixtureExtension[]} opts.extensions
   * @param {string} opts.singleExtensionId the id of the extension `shell+1` loads
   */
  constructor({ extensions, singleExtensionId }) {
    this.#extensions = extensions;
    this.#singleExtensionId = singleExtensionId;
    // The recorded sequence is the input order — stable and immutable.
    this.#sequence = Object.freeze(extensions.map((e) => e.id));
  }

  /**
   * The fixed extension sequence recorded at construction. The old
   * rule runs the same sequence on the same inputs.
   *
   * @returns {string[]}
   */
  recordedSequence() {
    return this.#sequence;
  }

  /**
   * Selects the extension list for a session kind.
   *
   * @param {SessionKind} kind
   * @returns {FixtureExtension[]}
   */
  select(kind) {
    if (kind === 'shell+1') {
      const single = this.#extensions.find((e) => e.id === this.#singleExtensionId);
      if (!single) throw new Error(`no extension ${this.#singleExtensionId} for shell+1`);
      return [single];
    }
    if (kind === 'shell+5-sequential') {
      const visuals = this.#extensions.filter((e) => e.kind === 'visual');
      if (visuals.length < 5) {
        throw new Error(`not enough visual extensions for shell+5-sequential: ${visuals.length}`);
      }
      return visuals.slice(0, 5);
    }
    if (kind === 'shell+5-parallel-startup') {
      // Five startup extensions, visual only (the template has no headless
      // extension), loaded together right after the shell's bootstrap and
      // measured until every entry module has loaded.
      const visuals = this.#extensions.filter((e) => e.kind === 'visual');
      if (visuals.length < 5) {
        throw new Error(
          `not enough visual startup extensions for shell+5-parallel-startup: ${visuals.length}`,
        );
      }
      return visuals.slice(0, 5);
    }
    throw new Error(`unknown session kind: ${kind}`);
  }

  /**
   * The shell's startup extension ids — the five extensions the parallel
   * startup loads together. The gate waits for every startup extension id.
   *
   * @returns {string[]}
   */
  startupExtensionIds() {
    return this.select('shell+5-parallel-startup').map((e) => e.id);
  }
}
