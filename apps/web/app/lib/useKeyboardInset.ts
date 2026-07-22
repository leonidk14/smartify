import { useSyncExternalStore } from "react";

// Collapsing browser toolbars and overscroll also shrink the visual viewport by
// a few dozen pixels — only a gap this large can be a virtual keyboard.
const MIN_KEYBOARD_HEIGHT = 120;

const subscribe = (onStoreChange: () => void) => {
  const viewport = window.visualViewport;
  if (!viewport) {
    return () => {};
  }
  viewport.addEventListener("resize", onStoreChange);
  viewport.addEventListener("scroll", onStoreChange);
  return () => {
    viewport.removeEventListener("resize", onStoreChange);
    viewport.removeEventListener("scroll", onStoreChange);
  };
};

const getKeyboardInset = () => {
  const viewport = window.visualViewport;
  if (!viewport || viewport.scale !== 1) {
    return 0;
  }
  const inset = Math.round(
    window.innerHeight - viewport.height - viewport.offsetTop,
  );
  return inset > MIN_KEYBOARD_HEIGHT ? inset : 0;
};

export const useKeyboardInset = () =>
  useSyncExternalStore(subscribe, getKeyboardInset, () => 0);
