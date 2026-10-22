"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * With Cache Components, a page you leave is hidden with React <Activity>, not unmounted, so its state
 * comes back on the next client-side visit (Next.js "Preserving UI state"). The auth forms must not:
 * after a login, a logout or an expired session, /login has to show an empty form and a closed door,
 * never the last user's e-mail or a stuck "Opening the door". `reset` runs whenever the form is hidden.
 */
export function useResetWhenHidden(reset: () => void) {
  const latest = useRef(reset);
  useLayoutEffect(() => {
    latest.current = reset;
  });
  // A layout-effect cleanup runs when Activity hides the component (and on unmount).
  useLayoutEffect(() => () => latest.current(), []);
}
