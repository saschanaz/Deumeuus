import { element } from "domliner";

interface NamedPageInternalStates<T> {
  title: string | null;
  content: T | null;

  elements: {
    titleBar: HTMLDivElement;
    container: HTMLDivElement;
  };
}

export default class NamedPage<T extends HTMLElement> extends HTMLElement {
  private readonly _states: NamedPageInternalStates<T> = {
    title: null,
    content: null,

    elements: this._initializeDOM()
  };

  get pageTitle() {
    return this._states.title;
  }
  set pageTitle(text: string | null) {
    this._states.title = text;

    this._states.elements.titleBar.textContent = text || "";
  }

  get content() {
    return this._states.content;
  }
  set content(value: T | null) {
    const { content, elements } = this._states;
    if (content && content !== value) {
      content.remove();
    }
    if (value) {
      elements.container.appendChild(value);
    }
    this._states.content = value;
  }

  constructor({ pageTitle, content }: { pageTitle?: string, content?: T }) {
    super();
    if (pageTitle) {
      this.pageTitle = pageTitle;
    }
    if (content) {
      this.content = content;
    }
  }

  private _initializeDOM() {
    const elements = {} as NamedPageInternalStates<T>["elements"];
    element(this, undefined, [
      elements.titleBar = element("div", { class: "namedpage-titlebar backgroundaccent" }),
      elements.container = element("div", { class: "flexfill verticalscrollable" })
    ]);
    return elements;
  }
}
customElements.define("deu-namedpage", NamedPage);
