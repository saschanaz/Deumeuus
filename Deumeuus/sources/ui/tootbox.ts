import { element } from "domliner";
import { Status } from "../entities";
import { getRelativeTimeStatus } from "../relative-time";

interface TootInternalStates {
  data: Status | null;
  createdAt: Date | null;
  elements: {
    img: HTMLImageElement;
    displayName: HTMLSpanElement;
    screenName: HTMLSpanElement;
    timeAnchor: HTMLAnchorElement;
    content: HTMLDivElement;

    subcontentContainer: HTMLDivElement;
    subcontentTitle: HTMLDivElement;
    subcontent: HTMLDivElement;
  } | null;
}

export default class TootBox extends HTMLElement {
  private _states: TootInternalStates = {
    data: null,
    createdAt: null,

    elements: null
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

    this._states.elements!.img.src = status.account.avatar;
    this._states.elements!.content.innerHTML = status.content;
    this._states.elements!.timeAnchor.textContent = getRelativeTimeStatus(this._states.createdAt!).text;
    this._states.elements!.displayName.textContent = status.account.display_name
    this._states.elements!.screenName.textContent = `@${status.account.username}`;
  }

  get createdAt() {
    return this._states.createdAt;
  }

  constructor(data?: Status) {
    super();
    this._initializeDOM();

    if (data) {
      this.data = data;
    }
  }

  private _initializeDOM() {
    const elements = this._states.elements = ({} as TootInternalStates["elements"])!;
    this.appendChild(element("div", { class: "flexfill" }, [
      element("div", { class: "tootbox-usercontent" }, [
        elements.img = element("img", { class: "tootbox-userimage indicateclickable noselect" }),
        element("div", { class: "flexfill" }, [
          element("div", { class: "tootbox-topwrapper" }, [
            element("div", { class: `tootbox-usernamewrapper` }, [
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
      elements.subcontentContainer = element("div", { class: `tweetbox-subcontent` }, [
        element("div", { class: "tweetbox-subcontent-titlebox opacity5" }, [
          element("div", { class: "vertical-outer" }, [
            elements.subcontentTitle = element("div", { class: "vertical-inner" })
          ])
        ]),
        elements.subcontent = element("div")
      ])
    ]));
  }

  private _clearDOM() {
    this._states.elements!.img.src = "";
    this._states.elements!.content.innerHTML = "";
    this._states.elements!.timeAnchor.textContent = "";
    this._states.elements!.displayName.textContent = "";
    this._states.elements!.screenName.textContent = "";
  }
}
customElements.define("deu-tootbox", TootBox);