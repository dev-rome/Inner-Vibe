"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * Whether the reader has asked for reduced motion.
 *
 * globals.css already neutralises CSS animation and transition, which covers
 * the reveals. Recharts animates in JavaScript, so nothing in CSS can stop its
 * draw-on — that needs this value passed to isAnimationActive. Without it the
 * promise is quietly broken for exactly the people who asked.
 *
 * useSyncExternalStore rather than an effect: the server snapshot returns true,
 * so the first client render matches the markup and no animation can start
 * before hydration settles. Erring toward "reduced" is the safe direction.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}
