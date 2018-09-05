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

  home(limiter?: MastodonIDLimiter) {
    return this.fetch<Status[]>("GET", "/api/v1/timelines/home", limiter);
  }

  public(limiter?: MastodonTimelineParameters) {
    return this.fetch<Status[]>("GET", "/api/v1/timelines/public", limiter);
  }

  tag(hashtag: string, limiter?: MastodonTimelineParameters) {
    return this.fetch<Status[]>("GET", `/api/v1/timelines/tag/${hashtag}`, limiter);
  }

  list(listId: string, limiter?: MastodonIDLimiter) {
    return this.fetch<Status[]>("GET", `/api/v1/timelines/list/${listId}`, limiter);
  }
}