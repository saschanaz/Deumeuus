import { element } from "domliner";
import { MastodonAPI } from "../api";
import { openAccountPopup } from "../dialog-openers";
import { Account } from "../entities";
import preprocessHTMLAsFragment from "../preprocess-html";
import { getRelativeTimeStatus } from "../relative-time";

interface AccountBoxInternalStates {
  user: MastodonAPI | null;
  account: Account | null;

  elements: {
    img: HTMLImageElement;
    userNameWrapper: HTMLDivElement;
    displayName: HTMLSpanElement;
    screenName: HTMLSpanElement;
    timeAnchor: HTMLAnchorElement;
    content: HTMLDivElement;
  };
}

export default class AccountBox extends HTMLElement {
  private _states: AccountBoxInternalStates = {
    user: null,
    account: null,

    elements: this._initializeDOM()
  };

  get user() {
    return this._states.user;
  }
  set user(user: MastodonAPI | null) {
    this._states.user = user;
  }

  get account() {
    return this._states.account;
  }
  set account(account: Account | null) {
    this._states.account = account;
    this._clearDOM();
    if (!account) {
      return;
    }

    const { elements } = this._states;
    elements.img.src = account.avatar;
    elements.timeAnchor.textContent = getRelativeTimeStatus(new Date(account.created_at)).text;
    elements.timeAnchor.href = account.url;
    elements.displayName.textContent = account.display_name;
    elements.screenName.textContent = `@${account.username}`;
    elements.content.appendChild(preprocessHTMLAsFragment(account.note));
  }

  constructor({ user, account }: { user?: MastodonAPI | null, account?: Account } = {}) {
    super();

    if (user) {
      this.user = user;
    }
    if (account) {
      this.account = account;
    }
  }

  private _initializeDOM() {
    const elements = {} as AccountBoxInternalStates["elements"];
    element(this, undefined, [
      elements.img = element("img", { class: "tootbox-userimage" }),
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
    ]);

    this.addEventListener("click", ((ev: PointerEvent) => {
      const target = ev.target as HTMLElement;
      if (
        target.localName !== "a" &&
        // Mastodon external links have spans inside
        target.parentElement!.localName !== "a" &&
        !target.classList.contains("clickable")
      ) {
        this.dispatchEvent(new CustomEvent("deu-backdropclick", {
          detail: { data: this._states.account, pointerId: ev.pointerId }
        }));
      }
    }) as EventListener);
    this.addEventListener("deu-mentionclick-internal", (async (ev: CustomEvent) => {
      ev.stopImmediatePropagation();
      const { user } = this._states;
      if (!user) {
        return;
      }
      const accounts = await user.accounts.search({ q: ev.detail.address, limit: 1 });
      if (accounts.length && accounts[0].url === ev.detail.href) {
        openAccountPopup(user, accounts[0]);
      } else {
        new Windows.UI.Popups.MessageDialog("Not found").showAsync();
      }
    }) as any);
    return elements;
  }

  private _clearDOM() {
    this._states.elements.img.src = "";
    this._states.elements.content.innerHTML = "";
    this._states.elements.timeAnchor.textContent = "";
    this._states.elements.displayName.textContent = "";
    this._states.elements.screenName.textContent = "";
  }
}
customElements.define("deu-accountbox", AccountBox);
