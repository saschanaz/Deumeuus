import { element } from "domliner";
import { MastodonAPI } from "../api";
import { Notification } from "../entities";
import TootBox from "./tootbox";

interface NotificationInternalStates {
  user: MastodonAPI | null;
  data: Notification | null;
  createdAt: Date | null;
  elements: {
    status: TootBox;
  };
}

export default class NotificationBox extends HTMLElement {
  private readonly _states: NotificationInternalStates = {
    user: null,
    data: null,
    createdAt: null,

    elements: this._initializeDOM()
  };

  get user() {
    return this._states.user;
  }
  set user(user: MastodonAPI | null) {
    this._states.elements.status.user = user;
    this._states.user = user;
  }

  get data() {
    return this._states.data;
  }
  set data(notification: Notification | null) {
    this._states.data = notification;
    this._states.createdAt = notification && new Date(notification.created_at);
    if (!notification) {
      this._clearDOM();
      return;
    }

    this._states.elements.status.classList.toggle("invisible", !notification.status);
    this._states.elements.status.data = notification.status;
  }

  get createdAt() {
    return this._states.createdAt;
  }

  constructor({ user, data }: { user?: MastodonAPI, data?: Notification } = {}) {
    super();

    if (user) {
      this.user = user;
    }
    if (data) {
      this.data = data;
    }
  }

  private _initializeDOM() {
    const elements = {} as NotificationInternalStates["elements"];
    this.appendChild(
      elements.status = element(new TootBox(), {
        class: "invisible", this: l => {
          l.addEventListener("deu-backdropclick", ((ev: CustomEvent) => {
            this.dispatchEvent(new CustomEvent("deu-backdropclick", {
              detail: { data: this.data, pointerId: ev.detail.pointerId }
            }));
          }) as EventListener);
        }
      })
    );
    return elements;
  }

  private _clearDOM() {
    this._states.elements.status.innerHTML = "";
  }
}
customElements.define("deu-notibox", NotificationBox);
