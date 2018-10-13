import { element } from "domliner";
import { MastodonAPI } from "../api";
import { Status } from "../entities";
import TootBox from "./tootbox";

interface ConversationViewerInternalStates {
  status: Status | null;
  user: MastodonAPI | null;

  elements: {
    ancestors: HTMLDivElement;
    base: TootBox;
    descendants: HTMLDivElement;
  };
}

export default class ConversationViewer extends HTMLElement {
  private readonly _states: ConversationViewerInternalStates = {
    status: null,
    user: null,

    elements: this._initializeDOM()
  };

  get user() {
    return this._states.user;
  }
  set user(user: MastodonAPI | null) {
    this._states.user = user;
    if (user && this._states.status) {
      this._refetchConversations();
    }
  }

  get status() {
    return this._states.status;
  }
  set status(value: Status | null) {
    this._clearDOM();
    this._states.elements.base.data = value;
    this._states.status = value;

    if (value && this._states.user) {
      this._refetchConversations();
    }
  }

  constructor({ user, status }: { user?: MastodonAPI, status?: Status }) {
    super();

    if (user) {
      this.user = user;
    }
    if (status) {
      this.status = status;
    }
  }

  private _initializeDOM() {
    const elements = {} as ConversationViewerInternalStates["elements"];
    element(this, undefined, [
      elements.ancestors = element("div"),
      elements.base = new TootBox(),
      elements.descendants = element("div")
    ]);
    return elements;
  }

  private _clearDOM() {
    const { elements } = this._states;
    elements.ancestors.textContent = "";
    elements.base.data = null;
    elements.descendants.textContent = "";
  }

  private async _refetchConversations() {
    const { elements, status, user } = this._states;
    elements.ancestors.textContent = elements.descendants.textContent = "";

    if (!status) {
      throw new Error("No base status to get conversations");
    }
    if (!user) {
      throw new Error("Needs a valid user object to fetch conversations");
    }

    const context = await user.statuses.context(status.id);
    for (const ancestor of context.ancestors) {
      elements.ancestors.appendChild(new TootBox({ data: ancestor, user }));
    }
    for (const descendant of context.descendants) {
      elements.descendants.appendChild(new TootBox({ data: descendant, user }));
    }
  }
}
customElements.define("deu-convo", ConversationViewer);
