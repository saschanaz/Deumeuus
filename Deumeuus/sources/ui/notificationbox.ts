import { element } from "domliner";
import { Notification } from "../entities";
import TootBox from "./tootbox";

interface NotificationInternalStates {
  data: Notification | null;
  createdAt: Date | null;
  elements: {
    status: TootBox;
  };
}

export default class NotificationBox extends HTMLElement {
  private readonly _states: NotificationInternalStates = {
    data: null,
    createdAt: null,

    elements: this._initializeDOM()
  };

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

  constructor(data?: Notification) {
    super();

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
