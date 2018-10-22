import { element } from "domliner";
import { MastodonAPI } from "../api";
import { MastodonIDLimiter } from "../apis/common";
import openDialog from "../dialog-open";
import { openConversationPopup } from "../dialog-openers";
import { Notification, Status } from "../entities";
import { getSelectionCancellerPointerId, getSelectorPointerId } from "../selection-tracker";
import Flow from "./flow";
import NotificationBox from "./notificationbox";
import RemoteList from "./remotelist";
import TootBox from "./tootbox";
import { Writer } from "./writer";

interface DeumeuusScreenInternalStates {
  user: MastodonAPI | null;
  stream: EventSource | null;

  elements: {
    currentUserImage: HTMLImageElement;
    homeTimeline: RemoteList<TootBox>;
    notifications: RemoteList<NotificationBox>;
    writerDialog: HTMLDialogElement;
    writer: Writer;
  };
}

export class DeumeuusScreen extends HTMLElement {
  private readonly _states: DeumeuusScreenInternalStates = {
    user: null,
    stream: null,

    elements: this._initializeDOM()
  };
  get user() {
    return this._states.user;
  }
  set user(user: MastodonAPI | null) {
    this._states.user = user;
    this._states.elements.writer.user = user;

    if (user) {
      if (user && document.body.contains(this)) {
        this._retrieveInitial();
      }
      user.accounts.verifyCredentials().then(
        credentials => this._states.elements.currentUserImage.src = credentials.avatar
      );
    } else {
      this._states.elements.currentUserImage.src = "";
    }
  }

  private _initializeDOM() {
    const elements = {} as DeumeuusScreenInternalStates["elements"];
    const timeline = elements.homeTimeline = new RemoteList();
    const notifications = elements.notifications = new RemoteList();
    timeline.max = notifications.max = 100;
    timeline.compare = notifications.compare = (
      x: Flow<TootBox | NotificationBox>,
      y: Flow<TootBox | NotificationBox>
    ) => {
      const lengthDiff = y.content!.data!.id.length - x.content!.data!.id.length;
      if (lengthDiff) {
        return lengthDiff;
      }
      return y.content!.data!.id.localeCompare(x.content!.data!.id);
    };
    timeline.identify = x => x.content!.data!.id;
    timeline.load = limiter => this._retrieveHomeTimeline(limiter);
    notifications.load = limiter => this._retrieveNotifications(limiter);

    element(this, undefined, [
      element("div", { class: "screen-menubar" }, [
        elements.currentUserImage = element("img", { class: "screen-currentuser" }),
        element("input", {
          type: "button", class: "textbutton nobackground clickable", value: "\uE90A" /* MDL2 Comment */,
          ".onclick": () => {
            timeline.scrollIntoView({ behavior: "smooth" });
          }
        }),
        element("input", {
          type: "button", class: "textbutton nobackground clickable", value: "\uE910" /* MDL2 Accounts */,
          ".onclick": () => {
            notifications.scrollIntoView({ behavior: "smooth" });
          }
        }),
        element("input", {
          type: "button",
          class: "textbutton nobackground clickable",
          value: "\uE713" /* MDL2 Settings */
        })
      ]),
      element("div", { class: "screen-columns" }, [
        timeline as HTMLElement,
        notifications as HTMLElement
      ])
    ]);

    elements.writer = new Writer();
    return elements;
  }

  openWriterDialog() {
    openDialog({
      classes: ["limitedwidth"],
      nodes: [this._states.elements.writer]
    });
  }

  private async _retrieveHomeTimeline(limiter?: MastodonIDLimiter) {
    const { user } = this._states;
    if (!user) {
      throw new Error("No account information to retrieve toots");
    }
    const toots = await user.timelines.home(limiter);
    return toots
      .map(toot => {
        const flow = new Flow(new TootBox({ user, data: toot }));
        flow.content!.addEventListener("deu-backdropclick", this._tootClickListener as EventListener);
        return flow;
      })
      .map(box => this._states.elements.homeTimeline.add(box));
  }

  // TODO: Get full notifications instead of just mentions
  private async _retrieveNotifications(limiter?: MastodonIDLimiter) {
    const { user } = this._states;
    if (!user) {
      throw new Error("No account information to retrieve notifications");
    }
    const notifications = await user.notifications.getAll({
      exclude_types: ["reblog", "favourite", "follow"],
      ...limiter || {}
    });
    return notifications
      .map(notification => {
        const flow = new Flow(new NotificationBox({ user, data: notification }));
        flow.content!.addEventListener("deu-backdropclick", this._notiClickListener as EventListener);
        return flow;
      })
      .map(box => this._states.elements.notifications.add(box));
  }

  private async _retrieveInitial() {
    await this._retrieveStream();
    return Promise.all([
      this._retrieveHomeTimeline(),
      this._retrieveNotifications()
    ]);
  }

  // TODO: process notifications
  private async _retrieveStream() {
    const { user } = this._states;
    if (!user) {
      throw new Error("No account information to retrieve stream");
    }
    const source = this._states.stream = await user.streaming.user();
    this._states.elements.homeTimeline.realtime
      = this._states.elements.notifications.realtime
      = true;
    source.addEventListener("update", ((ev: MessageEvent) => {
      const status = JSON.parse(ev.data) as Status;
      this._states.elements.homeTimeline.add(new Flow(new TootBox({ user, data: status })));
    }) as EventListener);
    source.addEventListener("notification", ((ev: MessageEvent) => {
      const notification = JSON.parse(ev.data) as Notification;
      if (notification.type === "mention") {
        this._states.elements.notifications.add(new Flow(new NotificationBox({ user, data: notification })));
      }
    }) as EventListener);
    source.addEventListener("delete", ((ev: MessageEvent) => {
      const id = ev.data as string;
      // TODO: remove from notifications
      const child = this._states.elements.homeTimeline.find(id);
      if (child) {
        child.content!.classList.add("deleted");
      }
    }) as EventListener);
    source.addEventListener("error", () => {
      // Insert holes when stream disconnects
      const { elements } = this._states;
      if (elements.homeTimeline.items.length) {
        elements.homeTimeline.items[0].classList.add("hashole");
      }
      if (elements.notifications.items.length) {
        elements.notifications.items[0].classList.add("hashole");
      }
    });
  }

  private _disconnectStream() {
    if (this._states.stream) {
      this._states.stream.close();
      this._states.stream = null;
      this._states.elements.homeTimeline.realtime
        = this._states.elements.notifications.realtime
        = false;
    }
  }

  private static readonly _hasNoSelection = (pointerId: number) => {
    const { isCollapsed } = getSelection();
    return (isCollapsed && pointerId !== getSelectionCancellerPointerId()) ||
      (!isCollapsed && pointerId !== getSelectorPointerId());
  }

  private readonly _tootClickListener = (ev: CustomEvent) => {
    if (this._states.user && DeumeuusScreen._hasNoSelection(ev.detail.pointerId)) {
      openConversationPopup(this._states.user, ev.detail.data);
    }
  }

  private readonly _notiClickListener = (ev: CustomEvent) => {
    if (this._states.user && DeumeuusScreen._hasNoSelection(ev.detail.pointerId)) {
      if ((ev.target as NotificationBox).data!.type === "mention") {
        openConversationPopup(this._states.user, (ev.detail.data as Notification).status!);
      }
    }
  }

  async connectedCallback() {
    // if the user attribute is set, start retrieving toots
    if (this._states.user) {
      await this._retrieveInitial();
    }
  }

  disconnectedCallback() {
    this._disconnectStream();
  }
}
customElements.define("deu-screen", DeumeuusScreen);
