import { element } from "domliner";
import { Status } from "../entities";
import TootBox from "./tootbox";

interface ConversationViewerInternalStates {
  status: Status | null;

  elements: {
    ancestors: HTMLDivElement;
    base: TootBox;
    descendants: HTMLDivElement;
  };
}

export default class ConversationViewer extends HTMLElement {
  private readonly _states: ConversationViewerInternalStates = {
    status: null,

    elements: this._initializeDOM()
  };

  get status() {
    return this._states.status;
  }
  set status(value: Status | null) {
    this._states.status = value;
  }

  constructor(status?: Status) {
    super();

    if (status) {
      this.status = status;
    }
  }

  private _initializeDOM() {
    const elements = {} as ConversationViewerInternalStates["elements"];
    element(this, undefined, [
      elements.ancestors = element("div"),
      elements.base = element(new TootBox(), { class: "invisible" }),
      elements.descendants = element("div")
    ]);
    return elements;
  }
}
customElements.define("due-convo", ConversationViewer);
