import { MastodonAPI } from "../api";
import ScrollAgnosticTimeline, { BeforeAutoRemoveEvent } from "scroll-agnostic-timeline";
import TootBox from "./tootbox";
import Flow from "./flow";
import { MastodonIDLimiter } from "../apis/common";

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

  elements: {
    homeTimeline: ScrollAgnosticTimeline<Flow<TootBox>>;
  } | null;
}

export class DeumeuusScreen extends HTMLElement {
  private _states: DeumeuusScreenInternalStates = {
    user: null,

    elements: null
  };
  get user() {
    return this._states.user;
  }
  set user(account: MastodonAPI | null) {
    this._states.user = account;

    // if element is in dom tree, start retrieving toots
    if (document.body.contains(this)) {
      this._retrieveHomeTimeline();
    }
  }

  constructor() {
    super();
    this._initializeDOM();
  }

  private _initializeDOM() {
    const elements = this._states.elements = ({} as DeumeuusScreenInternalStates["elements"])!;
    const timeline = elements.homeTimeline = new ScrollAgnosticTimeline<Flow<TootBox>>();
    timeline.max = 100;
    timeline.compare = (x, y) => {
      const lengthDiff = y.content!.data!.id.length - x.content!.data!.id.length;
      if (lengthDiff) {
        return lengthDiff;
      }
      return y.content!.data!.id.localeCompare(x.content!.data!.id);
    }
    timeline.addEventListener("click", async ev => {
      if (ev.target instanceof Element) {
        if (ev.target.classList.contains("flow-hole")) {
          const parent = ev.target.parentElement! as Flow<TootBox>;
          const limit = 20;
          if (!ev.target.previousElementSibling) {
            const limiter: MastodonIDLimiter = {
              limit,
              since_id: parent.content!.data!.id
            };
            if (parent.previousElementSibling instanceof Flow) {
              limiter.max_id = parent.previousElementSibling.content.data.id;
            }
            const toots = await this._retriveHomeTimeline(limiter);
            if (toots.length < limit) {
              parent.removeAttribute("hashole");
            }
          }
          else if (!ev.target.nextElementSibling) {
            // last-item only thing, so only max_id
            const toots = await this._retriveHomeTimeline({
              limit,
              max_id: parent.content!.data!.id
            });
            timeline.classList.toggle("no-procedings", toots.length < limit);
          }
        }
      }
    });
    timeline.addEventListener("beforeautoremove", ((ev: BeforeAutoRemoveEvent<Flow<TootBox>>) => {
      if (ev.oldChild.nextElementSibling) {
        ev.oldChild.nextElementSibling.setAttribute("hashole", "");
      }
    }) as EventListener)
    this.appendChild(timeline as HTMLElement);
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

  async connectedCallback() {
    // if the user attribute is set, start retrieving toots
    if (this._states.user) {
      await this._retrieveHomeTimeline();
    }
  }

  disconnectedCallback() {
    // TODO: disconnect any ongoing streams
  }
}
customElements.define("sa-timeline", ScrollAgnosticTimeline);
customElements.define("deu-screen", DeumeuusScreen);