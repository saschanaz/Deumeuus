import { registerDialog } from "dialog-polyfill";

export default function createDialogAutoPolyfill() {
  const dialog = document.createElement("dialog") as HTMLDialogElement;
  // no-op when natively supported
  registerDialog(dialog);
  return dialog;
}
