import { MastodonAPI } from "../api";
import ScrollAgnosticTimeline, { BeforeAutoRemoveEvent } from "scroll-agnostic-timeline";
import TootBox from "./tootbox";
import Flow from "./flow";
import { MastodonIDLimiter } from "../apis/common";
import NotificationBox from "./notificationbox";
import { Status, Notification } from "../entities";
import { Writer } from "./writer";
import openDialog from "../dialog-open";
import { element } from "domliner";

/*
 * TODO:
 * Merge menu bar with the title bar
 * https://docs.microsoft.com/en-us/windows/uwp/design/shell/title-bar
 * 
 * If the title bar is absent (e.g. in mobile, or possibly in tablet mode),
 * show the menu bar in the bottom
 */

interface DeumeuusScreenInternalStates {
  user: MastodonAPI | null;
  stream: EventSource | null;

  elements: {
    currentUserImage: HTMLImageElement;
    homeTimeline: ScrollAgnosticTimeline<Flow<TootBox>>;
    notifications: ScrollAgnosticTimeline<Flow<NotificationBox>>;
    writerDialog: HTMLDialogElement;
    writer: Writer;
  } | null;
}

export class DeumeuusScreen extends HTMLElement {
  private _states: DeumeuusScreenInternalStates = {
    user: null,
    stream: null,

    elements: null
  };
  get user() {
    return this._states.user;
  }
  set user(account: MastodonAPI | null) {
    this._states.user = account;
    this._states.elements!.writer.user = account;

    if (account) {
      if (account && document.body.contains(this)) {
        this._retrieveInitial();
      }
      account.verifyCredentials().then(
        user => this._states.elements!.currentUserImage.src = user.avatar
      );
    }
    else {
      this._states.elements!.currentUserImage.src = "";
    }
  }

  constructor() {
    super();
    this._initializeDOM();
  }

  private _initializeDOM() {
    const elements = this._states.elements = ({} as DeumeuusScreenInternalStates["elements"])!;
    const timeline = elements.homeTimeline = new ScrollAgnosticTimeline();
    const notifications = elements.notifications = new ScrollAgnosticTimeline();
    timeline.max = notifications.max = 100;
    timeline.compare = notifications.compare = (x: Flow<TootBox | NotificationBox>, y: Flow<TootBox | NotificationBox>) => {
      const lengthDiff = y.content!.data!.id.length - x.content!.data!.id.length;
      if (lengthDiff) {
        return lengthDiff;
      }
      return y.content!.data!.id.localeCompare(x.content!.data!.id);
    }
    timeline.identify = x => x.content!.data!.id;
    timeline.addEventListener("click", ev => this._loadTimelineHandler(ev, timeline, this._retrieveHomeTimeline));
    timeline.addEventListener("beforeautoremove", ev => this._beforeAutoRemoveHandler(ev as any));
    notifications.addEventListener("click", ev => this._loadTimelineHandler(ev, notifications, this._retrieveNotifications));
    notifications.addEventListener("beforeautoremove", ev => this._beforeAutoRemoveHandler(ev as any));

    element(this, undefined, [
      element("div", { class: "screen-menubar" }, [
        elements.currentUserImage = element("img", { class: "screen-currentuser" }),
        element("input", { type: "button", class: "textbutton nobackground clickable", value: "\uE90A" /* MDL2 Comment */ }),
        element("input", { type: "button", class: "textbutton nobackground clickable", value: "\uE910" /* MDL2 Accounts */ }),
        element("input", { type: "button", class: "textbutton nobackground clickable", value: "\uE713" /* MDL2 Settings */ })
      ]),
      element("div", { class: "screen-columns" }, [
        timeline as HTMLElement,
        notifications as HTMLElement
      ])
    ]);

    elements.writer = new Writer();
  }

  openWriterDialog() {
    openDialog({
      classes: ["limitedwidth"],
      nodes: [this._states.elements!.writer]
    });
  }

  private async _loadTimelineHandler(ev: MouseEvent, timeline: ScrollAgnosticTimeline<any>, loader: (limiter: MastodonIDLimiter) => Promise<any[]>) {
    if (ev.target instanceof Element) {
      if (ev.target.classList.contains("flow-hole")) {
        const parent = ev.target.parentElement! as Flow<any>;
        const limit = 20;
        if (!ev.target.previousElementSibling) {
          const limiter: MastodonIDLimiter = {
            limit,
            since_id: parent.content!.data!.id
          };
          if (parent.previousElementSibling instanceof Flow) {
            limiter.max_id = parent.previousElementSibling.content.data.id;
          }
          const toots = await loader.call(this, limiter);
          if (toots.length < limit) {
            parent.removeAttribute("hashole");
          }
        }
        else if (!ev.target.nextElementSibling) {
          // last-item only thing, so only max_id
          const toots = await loader.call(this, {
            limit,
            max_id: parent.content!.data!.id
          });
          timeline.classList.toggle("no-procedings", toots.length < limit);
        }
      }
    }
  }

  private async _beforeAutoRemoveHandler(ev: BeforeAutoRemoveEvent<Flow<TootBox>>) {
    if (ev.oldChild.nextElementSibling) {
      ev.oldChild.nextElementSibling.setAttribute("hashole", "");
    }
  }

  private async _retrieveHomeTimeline(limiter?: MastodonIDLimiter) {
    if (!this._states.user) {
      throw new Error("No account information to retrieve toots");
    }
    const toots = await this._states.user.timelines.home(limiter);
    toots
      .map(toot => new Flow(new TootBox(toot)))
      .forEach(box => this._states.elements!.homeTimeline.appendChild(box));
    return toots;
  }

  // TODO: Get full notifications instead of just mentions
  private async _retrieveNotifications(limiter?: MastodonIDLimiter) {
    if (!this._states.user) {
      throw new Error("No account information to retrieve notifications");
    }
    const notifications = await this._states.user.notifications.getAll({ exclude_types: ["reblog", "favourite", "follow"], ...limiter || {} })
    notifications
      .map(notification => new Flow(new NotificationBox(notification)))
      .forEach(box => this._states.elements!.notifications.appendChild(box));
    return notifications;
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
    if (!this._states.user) {
      throw new Error("No account information to retrieve stream");
    }
    const source = this._states.stream = await this._states.user.streaming.user();
    this._states.elements!.homeTimeline.classList.add("realtime");
    this._states.elements!.notifications.classList.add("realtime");
    source.addEventListener("update", ((ev: MessageEvent) => {
      const status = JSON.parse(ev.data) as Status;
      this._states.elements!.homeTimeline.appendChild(new Flow(new TootBox(status)));
    }) as EventListener);
    source.addEventListener("notification", ((ev: MessageEvent) => {
      const notification = JSON.parse(ev.data) as Notification;
      if (notification.type === "mention") {
        this._states.elements!.notifications.appendChild(new Flow(new NotificationBox(notification)));
      }
    }) as EventListener);
    source.addEventListener("delete", ((ev: MessageEvent) => {
      const id = ev.data as string;
      // TODO: remove from notifications
      const child = this._states.elements!.homeTimeline.find(id);
      if (child) {
        child.content!.classList.add("deleted");
      }
    }) as EventListener);
  }

  private _disconnectStream() {
    if (this._states.stream) {
      this._states.stream.close();
      this._states.stream = null;
      this._states.elements!.homeTimeline.classList.remove("realtime");
      this._states.elements!.notifications.classList.remove("realtime");
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
customElements.define("sa-timeline", ScrollAgnosticTimeline);
customElements.define("deu-screen", DeumeuusScreen);