"use client";

import { useState } from "react";

/**
 * A key that changes each time a form action returns. Put it on the form's fields so they remount
 * and start from the submitted values: React resets forms after an action, and selects and checkboxes
 * otherwise fall back to the values they first rendered with.
 */
export function useSubmissionKey(state: unknown): number {
  const [seen, setSeen] = useState(state);
  const [key, setKey] = useState(0);
  if (state !== seen) {
    setSeen(state);
    setKey((k) => k + 1);
  }
  return key;
}
