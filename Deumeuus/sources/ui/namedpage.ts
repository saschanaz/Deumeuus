import { element } from "domliner";

interface NamedPageInternalStates {
  title: string | null;

  elements: {
    titleBar: HTMLDivElement;
    contentElement: HTMLDivElement;
  } | null;
}

export default class NamedPage extends HTMLElement {
  private _states: NamedPageInternalStates = {
    title: null,
    elements: null
  };

  get pageTitle() {
    return this._states.title;
  }
  set pageTitle(text: string | null) {
    this._states.title = text;

    this._states.elements!.titleBar.textContent = text || "";
  }

  constructor(title?: string) {
    super();
    this._initializeDOM();
    if (title) {
      this.pageTitle = title;
    }
  }

  private _initializeDOM() {
    const elements = this._states.elements! = ({} as NamedPageInternalStates["elements"])!;
    element(this, undefined, [
      elements.titleBar = element("div", { class: "namedpage-titlebar backgroundaccent" }),
      elements.contentElement = element("div", { class: "flexfill verticalscrollable" })
    ]);
  }
}
customElements.define("due-titledholder", NamedPage);