import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("fh_theme") || "dark");

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("fh_theme", mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")),
      setMode,
      isDark: mode === "dark",
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
