// Theme store removed: export a stable constant instead of a nanostores atom to avoid runtime
// theme toggling while keeping the export name for compatibility.

export const themeStore = 'system' as const
