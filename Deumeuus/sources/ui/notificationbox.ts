import { element } from "domliner";
import { Notification } from "../entities";
import TootBox from "./tootbox";

interface NotificationInternalStates {
  data: Notification | null;
  createdAt: Date | null;
  elements: {
    status: TootBox;
  } | null;
}

export default class NotificationBox extends HTMLElement {
  private _states: NotificationInternalStates = {
    data: null,
    createdAt: null,

    elements: null
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

    this._states.elements!.status.classList.toggle("invisible", !notification.status);
    this._states.elements!.status.data = notification.status;
  }

  get createdAt() {
    return this._states.createdAt;
  }

  constructor(data?: Notification) {
    super();
    this._initializeDOM();

    if (data) {
      this.data = data;
    }
  }

  private _initializeDOM() {
    const elements = this._states.elements = ({} as NotificationInternalStates["elements"])!;
    this.appendChild(
      elements.status = element(new TootBox(), { class: "invisible" })
    );
  }

  private _clearDOM() {
    this._states.elements!.status.innerHTML = "";
  }
}
customElements.define("deu-notibox", NotificationBox);
