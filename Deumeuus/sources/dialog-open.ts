import createDialogAutoPolyfill from "./dialog-polyfill-auto";

export default function openDialog({ nodes, classes }: { nodes: Node[], classes: string[] }) {
  const dialog = createDialogAutoPolyfill();
  for (const node of nodes) {
    dialog.appendChild(node);
  }
  if (classes) {
    dialog.classList.add(...classes);
  }
  const previousFocus = document.activeElement;
  const previousFocusVisible = previousFocus.classList.contains("focus-visible");
  // return focus after closing dialog
  dialog.addEventListener("close", () => {
    if (!previousFocusVisible) {
      // dummy event to workaround https://github.com/WICG/focus-visible/issues/183
      document.body.dispatchEvent(new PointerEvent("pointerdown"));
    }
    dialog.remove();
    const currentFocus = document.activeElement;
    if (currentFocus === document.body) {
      (previousFocus as HTMLElement).focus();
    }
  });
  document.body.appendChild(dialog);
  dialog.showModal();
}
