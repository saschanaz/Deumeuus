import { Account } from "../entities";

export class DeumeuusScreen extends HTMLElement {
  _filter: Account | null = null;
  get filterAccount() {
    return this._filter;
  }
  set filterAccount(filter: Account | null) {
    this._filter = filter;

    // TODO: get the timestamp of the current scroll position and rerender the timeline?
  }

  constructor() {
    super();
    this._setInitialDOM();
  }

  private _setInitialDOM() {

  }
}
customElements.define("deu-screen", DeumeuusScreen);