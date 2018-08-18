import { apiFetch } from "../api";
import { Status } from "../entities";
import { MastodonIDLimiter } from "./common";

export interface MastodonStatusPostParameters {
  /** The text of the status */
  status: string;
  /** local ID of the status you want to reply to */
  in_reply_to_id?: string;
  /** {@link Array} of media IDs to attach to the status (maximum 4) */
  media_ids?: string[];
  /** Set this to mark the media of the status as NSFW */
  sensitive?: boolean;
  /** Text to be shown as a warning before the actual content */
  spoiler_text?: string;
  /** Either "direct", "private", "unlisted" or "public" */
  visibility?: "direct" | "private" | "unlisted" | "public";
  /** ISO 639-2 language code of the toot, to skip automatic detection */
  language?: string;
}

export class MastodonStatusesAPI {
  constructor(public instanceURL: string, private userAccessToken: string) { }

  private fetch<T>(method: string, path: string, queryMap: Record<string, any> = {}) {
    return apiFetch<T>(this.instanceURL, this.userAccessToken, method, path, queryMap);
  }

  get(id: string) {
    return this.fetch<Status>("GET", `/api/v1/statuses/${id}`);
  }

  getContext(id: string) {
    return this.fetch<Status>("GET", `/api/v1/statuses/${id}/context`);
  }

  getCard(id: string) {
    return this.fetch<Status>("GET", `/api/v1/statuses/${id}/card`);
  }

  getRebloggers(id: string, limiter?: MastodonIDLimiter) {
    return this.fetch<Status>("GET", `/api/v1/statuses/${id}/reblogged_by`, limiter);
  }

  getFavouriters(id: string, limiter?: MastodonIDLimiter) {
    return this.fetch<Status>("GET", `/api/v1/statuses/${id}/favourited_by`, limiter);
  }

  post(params: MastodonStatusPostParameters) {
    return this.fetch<Status>("POST", "/api/v1/statuses", params);
  }

  delete(id: string) {
    return this.fetch("DELETE", `/api/v1/statuses/${id}`);
  }
}