"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { DemoState, SavedEvent } from "./types";

const key = "trailmark-review-v2";
const changeEvent = "trailmark:change";
let memory = "{}";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changeEvent, callback);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(key) || memory;
  } catch {
    return memory;
  }
}
function parse(value: string): DemoState {
  try {
    const data = JSON.parse(value);
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}
export function useDemoState() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  return useMemo(() => parse(raw), [raw]);
}
export function updateEvent(id: string, update: SavedEvent) {
  const state = parse(snapshot());
  memory = JSON.stringify({ ...state, [id]: { ...state[id], ...update } });
  try {
    localStorage.setItem(key, memory);
  } catch {
    /* Fall back to this tab's in-memory state. */
  }
  window.dispatchEvent(new Event(changeEvent));
}
export function resetEvent(id: string) {
  const state = parse(snapshot());
  // Reopening a review must preserve the PM's saved draft and clarification text.
  if (state[id]) delete state[id].status;
  memory = JSON.stringify(state);
  try {
    localStorage.setItem(key, memory);
  } catch {
    /* In-memory fallback. */
  }
  window.dispatchEvent(new Event(changeEvent));
}
