import ScrollAgnosticTimeline, { BeforeAutoRemoveEvent } from "scroll-agnostic-timeline";
import { MastodonIDLimiter } from "../apis/common";
import Flow from "./flow";

interface RemoteListInternalStates<T extends HTMLElement> {
  load: ((limiter: MastodonIDLimiter) => Promise<boolean>) | null;

  elements: {
    timeline: ScrollAgnosticTimeline<Flow<T>>
  };
}

export default class RemoteList<T extends HTMLElement> extends HTMLElement {
  private _states: RemoteListInternalStates<T> = {
    load: null,

    elements: this._initializeDOM()
  };

  get load() {
    return this._states.load;
  }
  set load(value: RemoteListInternalStates<T>["load"]) {
    this._states.load = value;
  }

  get identify() {
    return this._states.elements.timeline.identify;
  }
  set identify(value: ScrollAgnosticTimeline<Flow<T>>["identify"]) {
    this._states.elements.timeline.identify = value;
  }

  get compare() {
    return this._states.elements.timeline.compare;
  }
  set compare(value: ScrollAgnosticTimeline<Flow<T>>["compare"]) {
    this._states.elements.timeline.compare = value;
  }

  get max() {
    return this._states.elements.timeline.max;
  }
  set max(value: ScrollAgnosticTimeline<Flow<T>>["max"]) {
    this._states.elements.timeline.max = value;
  }

  get realtime() {
    return this._states.elements.timeline.classList.contains("realtime");
  }
  set realtime(value: boolean) {
    this._states.elements.timeline.classList.toggle("realtime", value);
  }

  get items() {
    return this._states.elements.timeline.children;
  }

  add(flow: Flow<T>) {
    return this._states.elements.timeline.appendChild(flow);
  }

  find(id: string | number) {
    return this._states.elements.timeline.find(id);
  }

  private _initializeDOM() {
    const elements = {} as RemoteListInternalStates<T>["elements"];
    elements.timeline = new ScrollAgnosticTimeline();
    this.appendChild(elements.timeline as Node);

    elements.timeline.max = 100;
    elements.timeline.addEventListener("click", ev => this._loadTimelineHandler(ev));
    elements.timeline.addEventListener("beforeautoremove", ((ev: BeforeAutoRemoveEvent<Flow<T>>) => {
      if (ev.oldChild.nextElementSibling) {
        ev.oldChild.nextElementSibling.setAttribute("hashole", "");
      }
    }) as EventListener);
    return elements;
  }

  private async _loadTimelineHandler(ev: MouseEvent) {
    if (!(ev.target instanceof Element)) {
      throw new Error("???");
    }
    const { load, elements } = this._states;
    if (!load || !this.identify || !ev.target.classList.contains("flow-hole")) {
      return;
    }
    // TODO: add older/newer fields to Flow and prefer using them if assigned
    const parent = ev.target.parentElement! as Flow<T>;
    const limit = 20;
    const id = this.identify(parent).toString();
    if (!ev.target.previousElementSibling) {
      const limiter: MastodonIDLimiter = {
        limit,
        since_id: id
      };
      if (parent.previousElementSibling instanceof Flow) {
        if (parent.dataset.older) {
          limiter.max_id = parent.dataset.older;
        } else {
          limiter.max_id = this.identify(parent.previousElementSibling).toString();
        }
      }
      const moreToLoad = await load(limiter);
      if (!moreToLoad) {
        parent.removeAttribute("hashole");
      }
    } else if (!ev.target.nextElementSibling) {
      // last-item only thing, so only max_id
      // use dataset.older for unsorted paged lists
      const max = parent.dataset.older || id;
      const moreToLoad = await load({
        limit,
        max_id: max
      });
      elements.timeline.classList.toggle("no-procedings", !moreToLoad);
    }
  }
}
customElements.define("sa-timeline", ScrollAgnosticTimeline);
customElements.define("deu-remotelist", RemoteList);
