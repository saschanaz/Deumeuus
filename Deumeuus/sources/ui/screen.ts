import { MastodonAPI } from "../api";
import ScrollAgnosticTimeline from "scroll-agnostic-timeline";
import TootBox from "./tootbox";
import Flow from "./flow";

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
    timeline: ScrollAgnosticTimeline<Flow<TootBox>>;
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
      this._retriveToots();
    }
  }

  constructor() {
    super();
    this._initializeDOM();
  }

  private _initializeDOM() {
    const elements = this._states.elements = {} as any;
    const timeline = elements.timeline = new ScrollAgnosticTimeline<Flow<TootBox>>();
    timeline.compare = (x, y) => {
      const lengthDiff = y.content!.data!.id.length - x.content!.data!.id.length;
      if (lengthDiff) {
        return lengthDiff;
      }
      return y.content!.data!.id.localeCompare(x.content!.data!.id);
    }
    this.appendChild(timeline as HTMLElement);
  }

  private async _retriveToots() {
    if (!this._states.user) {
      throw new Error("No account information to retrieve toots");
    }
    const toots = await this._states.user.timelines.home();
    toots
      .map(toot => new Flow(new TootBox(toot)))
      .forEach(box => this._states.elements!.timeline.appendChild(box));
  }

  async connectedCallback() {
    // if the user attribute is set, start retrieving toots
    if (this._states.user) {
      await this._retriveToots();
    }
  }

  disconnectedCallback() {
    // TODO: disconnect any ongoing streams
  }
}
customElements.define("sa-timeline", ScrollAgnosticTimeline);
customElements.define("deu-screen", DeumeuusScreen);