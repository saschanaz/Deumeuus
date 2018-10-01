import { element } from "domliner";

interface NamedPageInternalStates {
  title: string | null;

  elements: {
    titleBar: HTMLDivElement;
    contentElement: HTMLDivElement;
  };
}

export default class NamedPage extends HTMLElement {
  private readonly _states: NamedPageInternalStates = {
    title: null,
    elements: this._initializeDOM()
  };

  get pageTitle() {
    return this._states.title;
  }
  set pageTitle(text: string | null) {
    this._states.title = text;

    this._states.elements.titleBar.textContent = text || "";
  }

  constructor(title?: string) {
    super();
    if (title) {
      this.pageTitle = title;
    }
  }

  private _initializeDOM() {
    const elements = {} as NamedPageInternalStates["elements"];
    element(this, undefined, [
      elements.titleBar = element("div", { class: "namedpage-titlebar backgroundaccent" }),
      elements.contentElement = element("div", { class: "flexfill verticalscrollable" })
    ]);
    return elements;
  }
}
customElements.define("due-titledholder", NamedPage);
