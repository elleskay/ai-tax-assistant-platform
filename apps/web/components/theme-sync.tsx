"use client";

import { useEffect } from "react";

/**
 * Re-applies the saved theme after hydration. The inline no-flash script in
 * the root layout adjusts the `dark` class for first paint, but React 19's
 * hydration rewrites the html element's className (which React owns) and
 * would reset it on every navigation. This effect runs right after hydration
 * and restores it. Dark is the default; only an explicit "light" opts out.
 */
export function ThemeSync() {
  useEffect(() => {
    try {
      document.documentElement.classList.toggle(
        "dark",
        localStorage.getItem("theme") !== "light",
      );
    } catch {
      // storage unavailable (private mode); leave the default theme
    }
  }, []);
  return null;
}
