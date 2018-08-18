import { apiFetch } from "../api";
import { Status } from "../entities";
import { MastodonIDLimiter } from "./common";

export interface MastodonTimelineParameters extends MastodonIDLimiter {
  /** Only return statuses originating from this instance (public and tag timelines only) */
  local?: boolean;
  /** Only return statuses that have media attachments (public and tag timelines only) */
  only_media?: boolean;
}

export class MastodonTimelinesAPI {
  constructor(public instanceURL: string, private userAccessToken: string) { }

  private fetch<T>(method: string, path: string, queryMap: Record<string, any> = {}) {
    return apiFetch<T>(this.instanceURL, this.userAccessToken, method, path, queryMap);
  }

  home(params?: MastodonTimelineParameters) {
    return this.fetch<Status[]>("GET", "/api/v1/timelines/home", params);
  }

  public(params?: MastodonTimelineParameters) {
    return this.fetch<Status[]>("GET", "/api/v1/timelines/public", params);
  }

  tag(hashtag: string, params?: MastodonTimelineParameters) {
    return this.fetch<Status[]>("GET", `/api/v1/timelines/tag/${hashtag}`, params);
  }

  list(listId: string, params?: MastodonTimelineParameters) {
    return this.fetch<Status[]>("GET", `/api/v1/timelines/list/${listId}`, params);
  }
}