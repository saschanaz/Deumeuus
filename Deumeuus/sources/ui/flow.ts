import { element } from "domliner";

export default class Flow<T extends Element> extends HTMLElement {
  // TODO: use appendChild directly rather than .content
  //       when Shadow DOM becomes available on all supported platforms
  private _container: HTMLDivElement | null = null;
  private _content: T | null = null;
  get content() {
    return this._content;
  }
  set content(value: T | null) {
    if (this._content && this._content !== value) {
      this._content.remove();
    }
    if (value) {
      this._container!.appendChild(value);
    }
    this._content = value;
  }

  constructor(content?: T) {
    super();
    this._initializeDOM();
    if (content) {
      this.content = content;
    }
  }

  private _initializeDOM() {
    element(this, undefined, [
      element("div", { class: "flow-hole" }, "LOAD"),
      this._container = element("div", undefined),
      element("div", { class: "flow-hole" }, "LOAD")
    ]);
  }
}
customElements.define("deu-flow", Flow);