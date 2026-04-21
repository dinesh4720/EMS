import { createContext, useContext } from 'react';

/**
 * Allows settings page components to register their dirty (unsaved changes) state
 * so the settings sidebar can intercept navigation and show a warning.
 *
 * Usage in a settings page:
 *   const { setDirty } = useSettingsDirty();
 *   useEffect(() => { setDirty(isDirty); return () => setDirty(false); }, [isDirty, setDirty]);
 */
export const SettingsNavigationContext = createContext(null);

export function useSettingsDirty() {
  const ctx = useContext(SettingsNavigationContext);
  // Safe no-op outside the provider (e.g. storybook / tests)
  if (!ctx) return { setDirty: () => {} };
  return { setDirty: ctx.setDirty };
}
