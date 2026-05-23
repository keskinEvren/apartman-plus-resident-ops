/**
 * Feature Flags for Token Optimization
 * Allows enabling/disabling optimizations for testing and gradual rollout
 */

export interface FeatureFlags {
  compactOutput: boolean;
  selectiveReading: boolean;
  contextCaching: boolean;
  fileIndexing: boolean;
  smartContextLoading: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  compactOutput: true,
  selectiveReading: true,
  contextCaching: true,
  fileIndexing: true,
  smartContextLoading: true,
};

let flags: FeatureFlags = { ...DEFAULT_FLAGS };

/**
 * Get current feature flags
 */
export function getFeatureFlags(): FeatureFlags {
  return { ...flags };
}

/**
 * Set feature flags
 */
export function setFeatureFlags(newFlags: Partial<FeatureFlags>): void {
  flags = { ...flags, ...newFlags };
}

/**
 * Reset feature flags to defaults
 */
export function resetFeatureFlags(): void {
  flags = { ...DEFAULT_FLAGS };
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return flags[feature];
}

/**
 * Enable feature
 */
export function enableFeature(feature: keyof FeatureFlags): void {
  flags[feature] = true;
}

/**
 * Disable feature
 */
export function disableFeature(feature: keyof FeatureFlags): void {
  flags[feature] = false;
}

/**
 * Load feature flags from environment variables
 */
export function loadFeatureFlagsFromEnv(): void {
  const envFlags: Partial<FeatureFlags> = {};

  if (process.env.ASANMOD_COMPACT_OUTPUT !== undefined) {
    envFlags.compactOutput = process.env.ASANMOD_COMPACT_OUTPUT === "true";
  }
  if (process.env.ASANMOD_SELECTIVE_READING !== undefined) {
    envFlags.selectiveReading =
      process.env.ASANMOD_SELECTIVE_READING === "true";
  }
  if (process.env.ASANMOD_CONTEXT_CACHING !== undefined) {
    envFlags.contextCaching = process.env.ASANMOD_CONTEXT_CACHING === "true";
  }
  if (process.env.ASANMOD_FILE_INDEXING !== undefined) {
    envFlags.fileIndexing = process.env.ASANMOD_FILE_INDEXING === "true";
  }
  if (process.env.ASANMOD_SMART_CONTEXT !== undefined) {
    envFlags.smartContextLoading = process.env.ASANMOD_SMART_CONTEXT === "true";
  }

  if (Object.keys(envFlags).length > 0) {
    setFeatureFlags(envFlags);
  }
}

// Load from environment on module load
loadFeatureFlagsFromEnv();
