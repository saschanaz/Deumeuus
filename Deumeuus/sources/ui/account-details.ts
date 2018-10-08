import { element } from "domliner";
import { MastodonAPI } from "../api";
import { Account } from "../entities";
import preprocessHTMLAsFragment from "../preprocess-html";

interface AccountDetailsViewInternalStates {
  user: MastodonAPI | null;
  account: Account | null;

  following: boolean;
  followIntermediate: boolean;

  elements: {
    shortStatsBox: HTMLDivElement;
    userDescriptionBox: HTMLDivElement;
    followStatusContainer: HTMLDivElement;
    followButton: HTMLInputElement;
    joinedDayLine: HTMLSpanElement;
  };
}
export default class AccountDetailsView extends HTMLElement {
  private _states: AccountDetailsViewInternalStates = {
    user: null,
    account: null,
    following: false,
    followIntermediate: false,
    elements: this._initializeDOM()
  };

  get user() {
    return this._states.user;
  }
  set user(user: MastodonAPI | null) {
    this._states.user = user;

    if (this._states.account) {
      this._indicateUserFollowIfApplicable();
    }
  }

  get account() {
    return this._states.account;
  }
  set account(value: Account | null) {
    this._states.account = value;
    this._clearDOM();
    if (!value) {
      return;
    }

    const { elements } = this._states;
    elements.shortStatsBox.textContent
      = `Toots ${value.statuses_count} | Following ${value.following_count} | Followers ${value.followers_count}`;
    elements.userDescriptionBox.appendChild(preprocessHTMLAsFragment(value.note));

    const createdAt = new Date(value.created_at);
    const diffDay = Math.round((Date.now() - createdAt.valueOf()) / 1000 / 60 / 60 / 24);
    elements.joinedDayLine.textContent
      = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}-${createdAt.getDate()} (${diffDay} days ago)`;

    if (this._states.user) {
      this._indicateUserFollowIfApplicable();
    }
  }

  constructor({ user, account }: { user: MastodonAPI, account: Account }) {
    super();

    if (user) {
      this.user = user;
    }
    if (account) {
      this.account = account;
    }
  }

  private _initializeDOM() {
    const elements = {} as AccountDetailsViewInternalStates["elements"];
    element(this, undefined, [
      elements.shortStatsBox = element("div", { class: "shortstats" }),
      elements.userDescriptionBox = element("div", { class: "textwrap selectable" }),
      element("div", { class: "hspacebetween" }, [
        elements.followStatusContainer = element("div", { class: "followstatus" }),
        elements.followButton = element("input", {
          type: "button",
          class: "followbutton buttoninherit indicateclickable"
        })
      ]),
      element("div", { class: "items contentflow fontsize110" }, [
        element("input", {
          type: "button",
          class: "clickable buttoninherit inherittextalign contentflow-forcefullwidth palettedream",
          value: "\ue836 사진 보기" /* picture frame */
        }),
        element("div", undefined, [
          "☆ Joined",
          elements.joinedDayLine = element("span", { class: "itemtext ellipsiswrap" })
        ])
      ])
    ]);
    this._listenEvents(elements);
    return elements;
  }

  private _clearDOM() {
    const { elements } = this._states;

    elements.shortStatsBox.textContent = "";
    elements.userDescriptionBox.textContent = "";
    elements.followButton.value = "";
    elements.joinedDayLine.textContent = "";
  }

  private _listenEvents(elements: AccountDetailsViewInternalStates["elements"]) {
    elements.followButton.addEventListener("click", async () => {
      const { user, account } = this._states;
      if (!user || !account || this._states.followIntermediate || !elements.followButton.value) {
        return;
      }

      this._states.followIntermediate = true;
      this._indicateFollowIntermediate();
      if (!this._states.following) {
        try {
          await user.accounts.follow(account.id);
          this._states.following = true;
          this._states.followIntermediate = false;
          this._indicateFollow();
        } catch (err) {
          this._indicateUnfollow();
          new Windows.UI.Popups.MessageDialog(`Couldn't follow the user.\r\n${err.message || err}`).showAsync();
        }
      } else {
        try {
          await user.accounts.unfollow(account.id);
          this._states.following = false;
          this._states.followIntermediate = false;
          this._indicateUnfollow();
        } catch (err) {
          this._indicateFollow();
          new Windows.UI.Popups.MessageDialog(`Couldn't unfollow the user.\r\n${err.message || err}`).showAsync();
        }
      }
    });
  }

  private async _indicateUserFollowIfApplicable() {
    const { user, account, elements } = this._states;
    if (!user || !account) {
      return;
    }
    const [friendship] = await user.accounts.relationships({ id: account.id });
    this._states.following = friendship.following;
    if (this._states.following) {
      this._indicateFollow();
    } else {
      this._indicateUnfollow();
    }
    elements.followStatusContainer.textContent =
      friendship.followed_by ? "Follows you" : "Not follows you";
  }

  private _indicateFollow() {
    const { followButton } = this._states.elements;
    followButton.classList.add("followbutton-connected");
    followButton.classList.remove("followbutton-disconnected");
    followButton.classList.remove("opacity5");
    followButton.value = "Following";
  }

  private _indicateUnfollow() {
    const { followButton } = this._states.elements;
    followButton.classList.remove("followbutton-connected");
    followButton.classList.add("followbutton-disconnected");
    followButton.classList.remove("opacity5");
    followButton.value = "Follow";
  }

  private _indicateFollowIntermediate() {
    const { followButton } = this._states.elements;
    followButton.classList.add("followbutton-connected");
    followButton.classList.remove("followbutton-disconnected");
    followButton.classList.add("opacity5");
    followButton.value = "Sending";
  }
}
customElements.define("deu-accountdetails", AccountDetailsView);
