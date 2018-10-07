import { element } from "domliner";
import { Status } from "../entities";
import preprocessHTMLAsFragment from "../preprocess-html";
import { getRelativeTimeStatus } from "../relative-time";

interface TootInternalStates {
  data: Status | null;
  createdAt: Date | null;
  elements: {
    img: HTMLImageElement;
    userNameWrapper: HTMLDivElement;
    displayName: HTMLSpanElement;
    screenName: HTMLSpanElement;
    timeAnchor: HTMLAnchorElement;
    content: HTMLDivElement;

    subcontentContainer: HTMLDivElement;
    subcontentTitle: HTMLDivElement;
    subcontent: HTMLDivElement;
  };
}

export default class TootBox extends HTMLElement {
  private readonly _states: TootInternalStates = {
    data: null,
    createdAt: null,

    elements: this._initializeDOM()
  };

  get data() {
    return this._states.data;
  }
  set data(status: Status | null) {
    this._states.data = status;
    this._states.createdAt = status && new Date(status.created_at);
    if (!status) {
      this._clearDOM();
      return;
    }

    const elements = this._states.elements;
    elements.img.src = status.account.avatar;
    elements.timeAnchor.textContent = getRelativeTimeStatus(this._states.createdAt!).text;
    elements.timeAnchor.href = status.uri;
    elements.displayName.textContent = status.account.display_name;
    elements.screenName.textContent = `@${status.account.username}`;

    elements.subcontentContainer.classList.toggle("invisible", !status.reblog);
    elements.img.classList.toggle("tootbox-mini", !!status.reblog);
    elements.timeAnchor.classList.toggle("tootbox-mini", !!status.reblog);
    elements.userNameWrapper.classList.toggle("tootbox-mini", !!status.reblog);
    if (status.reblog) {
      elements.subcontentTitle.textContent = "boost";
      elements.subcontent.appendChild(new TootBox(status.reblog));
    } else {
      elements.content.appendChild(preprocessHTMLAsFragment(status.content));
    }
  }

  get createdAt() {
    return this._states.createdAt;
  }

  constructor(data?: Status) {
    super();

    if (data) {
      this.data = data;
    }
  }

  private _initializeDOM() {
    const elements = {} as TootInternalStates["elements"];
    this.appendChild(element("div", { class: "flexfill" }, [
      element("div", { class: "tootbox-usercontent" }, [
        elements.img = element("img", { class: "tootbox-userimage clickable" }),
        element("div", { class: "flexfill" }, [
          element("div", { class: "tootbox-topwrapper" }, [
            elements.userNameWrapper = element("div", { class: `tootbox-usernamewrapper` }, [
              elements.displayName = element("span", { class: "ellipsiswrap" }),
              elements.screenName = element("span", { class: "tootbox-screenname ellipsiswrap opacity5" })
            ]),
            elements.timeAnchor = element("a", {
              tabindex: -1,
              target: "_blank",
              class: "tootbox-timestamp tootbox-inheritcolor opacity5 nodecoration underlineonhover"
            })
          ]),
          elements.content = element("div", { class: "tootbox-text textwrap selectable" })
        ])
      ]),
      elements.subcontentContainer = element("div", { class: "tootbox-subcontent invisible" }, [
        element("div", { class: "tootbox-subcontent-titlebox opacity5" }, [
          element("div", { class: "vertical-outer" }, [
            elements.subcontentTitle = element("div", { class: "vertical-inner" })
          ])
        ]),
        elements.subcontent = element("div")
      ])
    ]));

    this.addEventListener("click", ((ev: PointerEvent) => {
      const target = ev.target as HTMLElement;
      if (
        target.localName !== "a" &&
        // Mastodon external links have spans inside
        target.parentElement!.localName !== "a" &&
        !target.classList.contains("clickable")
      ) {
        this.dispatchEvent(new CustomEvent("deu-backdropclick", {
          detail: { data: this._states.data, pointerId: ev.pointerId }
        }));
      }
    }) as EventListener);
    return elements;
  }

  private _clearDOM() {
    this._states.elements.img.src = "";
    this._states.elements.content.innerHTML = "";
    this._states.elements.timeAnchor.textContent = "";
    this._states.elements.displayName.textContent = "";
    this._states.elements.screenName.textContent = "";
    this._states.elements.subcontent.innerHTML = "";
    this._states.elements.subcontentTitle.textContent = "";
    this._states.elements.subcontentContainer.classList.add("invisible");
    this._states.elements.img.classList.remove("tootbox-mini");
    this._states.elements.timeAnchor.classList.remove("tootbox-mini");
    this._states.elements.userNameWrapper.classList.remove("tootbox-mini");
  }

  updateTimeText() {
    if (this._states.data) {
      this._states.elements.timeAnchor.textContent = getRelativeTimeStatus(this._states.createdAt!).text;
    }
  }
}
customElements.define("deu-tootbox", TootBox);
