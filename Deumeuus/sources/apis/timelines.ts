import { apiFetch } from "../api";
import { Status } from "../entities";

export interface MastodonTimelineParamaters {
  /** Only return statuses originating from this instance (public and tag timelines only) */
  local?: boolean;
  /** Only return statuses that have media attachments (public and tag timelines only) */
  only_media?: boolean;
  /** Get a list of timelines with ID less than this value */
  max_id?: string;
  /** Get a list of timelines with ID greater than this value */
  since_id?: string;
  /** Maximum number of statuses on the requested timeline to get (Default 20, Max 40) */
  limit?: number;
}

export class MastodonTimelinesAPI {
  constructor(public instanceURL: string, private userAccessToken: string) { }

  private fetch<T>(method: string, path: string, queryMap: Record<string, any> = {}) {
    return apiFetch<T>(this.instanceURL, this.userAccessToken, method, path, queryMap);
  }

  async home(params?: MastodonTimelineParamaters) {
    return this.fetch("GET", "/api/v1/timelines/home", params) as Promise<Status[]>;
  }
}