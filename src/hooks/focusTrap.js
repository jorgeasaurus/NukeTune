/**
 * Index of the element that should receive focus when Tab would leave a modal,
 * or null when the browser's default Tab handling stays inside it.
 *
 * @param {number} currentIndex index of the focused element among the modal's focusables, -1 if outside
 * @param {number} count number of focusable elements in the modal
 * @param {boolean} backwards true for Shift+Tab
 * @returns {number | null}
 */
export function getWrappedFocusIndex(currentIndex, count, backwards) {
  if (count <= 0) return null;
  if (currentIndex < 0 || currentIndex >= count) return backwards ? count - 1 : 0;
  if (backwards && currentIndex === 0) return count - 1;
  if (!backwards && currentIndex === count - 1) return 0;
  return null;
}
