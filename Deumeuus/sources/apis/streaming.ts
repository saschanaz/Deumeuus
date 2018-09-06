import { EventSourcePolyfill } from "event-source-polyfill";

export class MastodonStreamingAPI {
  constructor(public instanceURL: string, private userAccessToken: string) { }

  private async _fetchEventSource(path: string) {
    return new Promise<EventSourcePolyfill>((resolve, reject) => {
      const url = new URL(path, this.instanceURL).toString();
      const source = new EventSourcePolyfill(url, {
        headers: {
          Authorization: `Bearer ${this.userAccessToken}`
        }
      });
      source.addEventListener("open", () => resolve(source));
      source.addEventListener("error", reject);
    });
  }

  user() {
    return this._fetchEventSource(`/api/v1/streaming/user`);
  }
}