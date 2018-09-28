export default function startSelectionCanceller() {
  let potentialSelector = -1;
  document.body.addEventListener("pointerdown", ev => {
    const computed = getComputedStyle(ev.target! as Element);
    const userSelect = computed.userSelect || computed.webkitUserSelect;
    potentialSelector = userSelect !== "none" ? ev.pointerId : -1;
  });
  document.body.addEventListener("pointerup", ev => {
    if (ev.pointerId === potentialSelector) {
      return;
    }
    const computed = getComputedStyle(ev.target! as Element);
    const userSelect = computed.userSelect || computed.webkitUserSelect;
    if (userSelect === "none") {
      getSelection().empty();
    }
  });
}