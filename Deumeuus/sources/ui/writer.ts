import { element } from "domliner";
import { MastodonAPI } from "../api";
import { MastodonStatusPostParameters } from "../apis/statuses";
import { iterate } from "../iterate";

const maxTextLength = 500;

interface WriterInternalStates {
  user: MastodonAPI | null;
  elements: {
    remainingLengthIndicator: HTMLDivElement;
    contentarea: HTMLDivElement;
    textarea: HTMLTextAreaElement;
    mediaIndicator: HTMLDivElement;
    clearButton: HTMLInputElement;
    attachMediaButton: HTMLInputElement;
    writeButton: HTMLInputElement;
  } | null;
}

export class Writer extends HTMLElement {
  private _states: WriterInternalStates = {
    user: null,
    elements: null
  };

  get user() {
    return this._states.user;
  }
  set user(user: MastodonAPI | null) {
    this._states.user = user;
  }

  constructor() {
    super();
    this._initializeDOM();
  }

  private _initializeDOM() {
    const elements = this._states.elements = ({} as WriterInternalStates["elements"])!;
    this.appendChild(element("div", { class: "writer sticky-bottom" }, [
      element("div", { class: "writer-tools writer-tools-top" }, [
        element("input", { type: "button", class: "textbutton nobackground clickable", value: "X" /* TODO: AccountSelector */ }),
        element("input", { type: "button", class: "textbutton nobackground clickable", value: "@" /* @ */ }),
        element("input", { type: "button", class: "textbutton nobackground clickable", value: "L" /* location */ }),
        element("input", { type: "button", class: "textbutton nobackground clickable", value: "F" /* folder */ })
      ]),
      elements.remainingLengthIndicator = element("div", { class: "writer-remaininglengthindicator" }, `${maxTextLength}`),
      elements.contentarea = element("div", { class: "writer-contentarea" }, [
        elements.textarea = element("textarea", {
          class: "writer-textarea", placeholder: "Write here", spellcheck: false
        })
      ]),
      element("div", { class: "writer-tools writer-tools-bottom" }, [
        elements.clearButton = element("input", {
          type: "button", class: "textbutton nobackground clickable", value: "\ue808" /* trash can */
        }),
        elements.attachMediaButton = element("input", {
          type: "button", class: "textbutton nobackground clickable", value: "\ue836" /* picture frame */
        }),
        element("input", { type: "button", class: "textbutton nobackground clickable", value: "Ment" }),
        elements.writeButton = element("input", {
          type: "button", class: "textbutton clickable backgroundaccent", value: "\ue830" /* quill */, disabled: "disabled"
        })
      ])
    ]));

    elements.textarea.addEventListener("keydown", ev => {
      /* no keyup but keydown to prevent confusion with composition canceling on Japanese IME */
      if (ev.key === "Enter" && ev.ctrlKey) {
        this._writeAction();
      }
    });
    elements.textarea.addEventListener("input", () => this._applyInputTextStatus());

    elements.clearButton.addEventListener("click", () => this.clear());
    elements.writeButton.addEventListener("click", () => this._writeAction());
  }

  focusToTextArea() {
    this._states.elements!.textarea.focus();
  }

  clear() {
    this.setText("");
  }

  setText(text: string) {
    this._states.elements!.textarea.value = text;
    this._applyInputTextStatus();
  }

  setSelectionRange(start: number, end: number) {
    this._states.elements!.textarea.setSelectionRange(start, end);
  }

  private _getRemainingLength() {
    const internal = this._states;

    return maxTextLength - internal.elements!.textarea.value.length;
  }

  private _applyInputTextStatus() {
    const internal = this._states;

    const remainingLength = this._getRemainingLength();
    internal.elements!.remainingLengthIndicator.textContent = `${remainingLength}`;
    if (remainingLength < 0) {
      internal.elements!.remainingLengthIndicator.classList.add("exceeded");
    } else {
      internal.elements!.remainingLengthIndicator.classList.remove("exceeded");
    }
    // Do not block writeAction when exceeded but just allow it
    // so that text length limit change can be immediately applied without hard-coded value change

    internal.elements!.writeButton.disabled = !internal.elements!.textarea.value.trim();
  }

  private async _writeAction() {
    const internal = this._states;
    if (!internal.user || !internal.elements!.textarea.value.trim()) {
      return;
    }

    const clickables = this.querySelectorAll("input[type=button],textarea") as NodeListOf<HTMLInputElement | HTMLTextAreaElement>;
    for (const clickable of iterate(clickables)) {
      clickable.disabled = true;
    }

    const params = {
      status: internal.elements!.textarea.value
    } as MastodonStatusPostParameters;

    try {
      await internal.user.statuses.post(params);
      this.clear();
    } catch (err) {
      new Windows.UI.Popups.MessageDialog(`Failed to toot.\r\n${err.message || err}`).showAsync();
    }
    for (const clickable of clickables) {
      clickable.disabled = false;
    }
    internal.elements!.textarea.focus();
  }
}
customElements.define("deu-writer", Writer);
