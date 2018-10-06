import { apiFetch } from "../api";
import { Account } from "../entities";

export interface UserCredentials extends Account {
  source: {
    /** Selected preference: Default privacy of new toots */
    privacy: boolean;
    /** Selected preference: Mark media as sensitive by default? */
    sensitive: boolean;
    /** Plain - text version of the account's note */
    note: string;
    /** Array of profile metadata, each element has 'name' and 'value' */
    fields: { name: string, value: string }[];
  };
}

export class MastodonAccountsAPI {
  constructor(public instanceURL: string, private userAccessToken: string) { }

  private _fetch<T>(method: string, path: string, queryMap: Record<string, any> = {}) {
    return apiFetch<T>(this.instanceURL, this.userAccessToken, method, path, queryMap);
  }

  get(id: string) {
    return this._fetch<Account>("POST", `/api/v1/accounts/${id}`);
  }

  verifyCredentials() {
    return this._fetch("GET", "/api/v1/accounts/verify_credentials") as Promise<UserCredentials>;
  }
}
