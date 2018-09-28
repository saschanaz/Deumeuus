let downPointerId = -1;
let selectionStartedBy = -1;
let selectionCancelledBy = -1;

export function getSelectorPointerId() {
  return selectionStartedBy;
}

export function getSelectionCancellerPointerId() {
  return selectionCancelledBy;
}

window.addEventListener("selectstart", ev => {
  selectionStartedBy = downPointerId;
  selectionCancelledBy = -1;
});

window.addEventListener("pointerdown", ev => {
  const computed = getComputedStyle(ev.target! as Element);
  const userSelect = computed.userSelect || computed.webkitUserSelect;
  if (userSelect !== "none") {
    downPointerId = ev.pointerId;
    selectionCancelledBy = selectionStartedBy === -1 ? -1 : downPointerId;
    selectionStartedBy = -1;
  }
});

window.addEventListener("pointerup", ev => {
  downPointerId = -1;
});