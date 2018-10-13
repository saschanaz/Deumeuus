import { apiFetch, CursorsMixin } from "../api";
import { Account, Field, Relationship, Status } from "../entities";
import { MastodonIDLimiter } from "./common";

interface UserCredentialsSource {
  /** Selected preference: Default privacy of new toots */
  privacy: boolean;
  /** Selected preference: Mark media as sensitive by default? */
  sensitive: boolean;
  /** Plain - text version of the account's note */
  note: string;
}

export interface UserCredentials extends Account {
  source: UserCredentialsSource & {
    /** Array of profile metadata, each element has 'name' and 'value' */
    fields: Field[];
  };
}

export interface MastodonAccountsUpdateCredentialsParameters {
  /** The name to display in the user's profile */
  display_name?: string;
  /** A new biography for the user */
  note?: string;
  /** An avatar for the user (encoded using multipart/form-data) */
  avatar?: Blob;
  /** A header image for the user (encoded using multipart/form-data) */
  header?: Blob;
  /** Manually approve followers? */
  locked?: boolean;
  /** (2.4 or later) extra source attribute from verify_credentials */
  source: Partial<UserCredentialsSource>;
  /** (2.4 or later) profile metadata field. */
  fields_attributes?: Field[];
}

export interface MastodonAccountsStatusesParameters extends MastodonIDLimiter {
  /** Only return statuses that have media attachments */
  only_media?: boolean;
  /** Only return statuses that have been pinned */
  pinned?: boolean;
  /** Skip statuses that reply to other statuses */
  exclude_replies?: boolean;
}

export interface MastodonAccountsFollowParameters {
  /** Determines whether the followed account's reblogs will show up in the home timeline */
  reblogs?: boolean;
}

export interface MastodonAccountsMuteParameters {
  /** Determines whether the mute will mute notifications or not. Default(true) */
  notifications?: boolean;
}

export interface MastodonAccountsRelationshipsParameters {
  /** Account IDs (can be an array) */
  id: string | string[];
}

export interface MastodonAccountsSearchParameters {
  /** What to search for */
  q: string;
  /** Maximum number of matching accounts to return (default: 40) */
  limit?: number;
  /** Limit the search to following (boolean, default false) */
  following?: boolean;
}

export class MastodonAccountsAPI {
  constructor(public instanceURL: string, private userAccessToken: string) { }

  private _fetch<T>(method: string, path: string, queryMap: Record<string, any> = {}) {
    return apiFetch<T>(this.instanceURL, this.userAccessToken, method, path, queryMap);
  }

  get(id: string) {
    return this._fetch<Account>("GET", `/api/v1/accounts/${id}`);
  }

  verifyCredentials() {
    return this._fetch<UserCredentials>("GET", "/api/v1/accounts/verify_credentials");
  }

  updateCredentials(params?: MastodonAccountsUpdateCredentialsParameters) {
    return this._fetch<Account>("PATCH", "/api/v1/accounts/update_credentials", params);
  }

  followers(id: string, limiter?: MastodonIDLimiter) {
    return this._fetch<Account[] & CursorsMixin>("GET", `/api/v1/accounts/${id}/followers`, limiter);
  }

  following(id: string, limiter?: MastodonIDLimiter) {
    return this._fetch<Account[] & CursorsMixin>("GET", `/api/v1/accounts/${id}/following`, limiter);
  }

  statuses(id: string, params?: MastodonAccountsStatusesParameters) {
    return this._fetch<Status[] & CursorsMixin>("GET", `/api/v1/accounts/${id}/statuses`, params);
  }

  follow(id: string, params?: MastodonAccountsFollowParameters) {
    return this._fetch<Relationship>("POST", `/api/v1/accounts/${id}/follow`, params);
  }

  unfollow(id: string) {
    return this._fetch<Relationship>("POST", `/api/v1/accounts/${id}/unfollow`);
  }

  block(id: string) {
    return this._fetch<Relationship>("POST", `/api/v1/accounts/${id}/block`);
  }

  unblock(id: string) {
    return this._fetch<Relationship>("POST", `/api/v1/accounts/${id}/unblock`);
  }

  mute(id: string, params?: MastodonAccountsMuteParameters) {
    return this._fetch<Relationship>("POST", `/api/v1/accounts/${id}/mute`, params);
  }

  unmute(id: string) {
    return this._fetch<Relationship>("POST", `/api/v1/accounts/${id}/unmute`);
  }

  pin(id: string) {
    return this._fetch<Relationship>("POST", `/api/v1/accounts/${id}/pin`);
  }

  unpin(id: string) {
    return this._fetch<Relationship>("POST", `/api/v1/accounts/${id}/unpin`);
  }

  relationships(params: MastodonAccountsRelationshipsParameters) {
    return this._fetch<Relationship[]>("GET", `/api/v1/accounts/relationships`, params);
  }

  search(params: MastodonAccountsSearchParameters) {
    return this._fetch<Account[]>("GET", `/api/v1/accounts/search`, params);
  }
}
