import { element } from "domliner";
import { CursorsMixin, MastodonAPI } from "../api";
import compareBigInt from "../bigint-compare";
import openDialog from "../dialog-open";
import { openAccountPopup } from "../dialog-openers";
import { Account } from "../entities";
import preprocessHTMLAsFragment from "../preprocess-html";
import AccountBox from "./accountbox";
import Flow from "./flow";
import NamedPage from "./namedpage";
import RemoteList from "./remotelist";

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
    customFields: HTMLDivElement;
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

    if (value.fields) {
      for (const field of value.fields) {
        elements.customFields.appendChild(
          element("div", undefined, [
            `☆ ${field.name}`,
            element("span", { class: "itemtext ellipsiswrap" }, [preprocessHTMLAsFragment(field.value)])
          ])
        );
      }
    }

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
      element("div", undefined, [
        element("div", { class: "items contentflow fontsize110" }, [
          element("input", {
            type: "button",
            class: "clickable buttoninherit inherittextalign",
            value: "☆ Follows",
            ".onclick": () => {
              const { user, account } = this._states;
              if (user && account) {
                openRelationsList(user, account.id, "following", "Follows");
              }
            }
          }),
          element("input", {
            type: "button",
            class: "clickable buttoninherit inherittextalign",
            value: "☆ Followers",
            ".onclick": () => {
              const { user, account } = this._states;
              if (user && account) {
                openRelationsList(user, account.id, "followers", "Followers");
              }
            }
          }),
          element("div", undefined, [
            "☆ Joined",
            elements.joinedDayLine = element("span", { class: "itemtext ellipsiswrap" })
          ])
        ]),
        elements.customFields = element("div", { class: "items contentflow fontsize110" })
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
    elements.customFields.textContent = "";
  }

  private _listenEvents(elements: AccountDetailsViewInternalStates["elements"]) {
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

async function openRelationsList(user: MastodonAPI, id: string, api: "following" | "followers", pageTitle: string) {
  const remoteList = new RemoteList();
  remoteList.classList.add("fillheight");
  remoteList.max = 5;
  remoteList.identify = x => x.dataset.newer!;
  remoteList.compare = (x, y) => compareBigInt(y.dataset.newer!, x.dataset.newer!);
  remoteList.load = async limiter => {
    const fls = await user.accounts[api](id, limiter);
    if (fls.length) {
      remoteList.add(wrapAccounts(user, fls));
    }
    return !!(fls.cursors && fls.cursors.older);
  };
  const followings = await user.accounts[api](id);
  if (!followings.cursors || !followings.cursors.older) {
    remoteList.noProcedings = true;
  }
  const flow = wrapAccounts(user, followings);
  remoteList.add(flow);

  openDialog({
    nodes: [
      element(new NamedPage({
        pageTitle,
        content: remoteList
      }), { class: "fillheight" })
    ],
    classes: ["limitedwidth"]
  });
}

function wrapAccounts(user: MastodonAPI, accounts: Account[] & CursorsMixin) {
  const page = element("div", undefined, accounts.map(
    account => new AccountBox({ user, account })
  ));
  const flow = new Flow(page);
  if (accounts.cursors) {
    flow.dataset.newer = accounts.cursors.newer;
    if (accounts.cursors.older) {
      flow.dataset.older = accounts.cursors.older;
    }
  }
  return flow;
}
