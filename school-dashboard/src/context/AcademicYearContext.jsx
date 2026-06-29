import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "ems_selected_academic_year";

// Safari private browsing throws SecurityError on sessionStorage access
function safeSessionGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key, value) {
  try {
    if (value == null) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
    }
  } catch {
    // Storage unavailable (e.g. Safari private mode) — state-only, no persistence
  }
}

const AcademicYearContext = createContext();

export function AcademicYearProvider({ children }) {
  // Initialise from sessionStorage so a page refresh restores the user's selection
  const [storedYear, setStoredYear] = useState(
    () => safeSessionGet(STORAGE_KEY) || null
  );

  const setSelectedAcademicYear = useCallback((year) => {
    setStoredYear(year || null);
    safeSessionSet(STORAGE_KEY, year || null);
  }, []);

  // Clear on logout so stale year doesn't bleed into the next session
  useEffect(() => {
    const handleSessionCleared = () => {
      setStoredYear(null);
      safeSessionSet(STORAGE_KEY, null);
    };
    window.addEventListener("auth-session-cleared", handleSessionCleared);
    return () => window.removeEventListener("auth-session-cleared", handleSessionCleared);
  }, []);

  // Memoize so consumers only re-render when the selected year actually changes
  // (setSelectedAcademicYear is already stable via useCallback).
  const value = useMemo(
    () => ({ storedYear, setSelectedAcademicYear }),
    [storedYear, setSelectedAcademicYear]
  );

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) throw new Error("useAcademicYear must be used within AcademicYearProvider");
  return context;
};
