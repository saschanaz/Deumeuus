import { apiFetch } from "../api";
import { Notification } from "../entities";
import { MastodonIDLimiter } from "./common";

export interface MastodonNotificationParameters extends MastodonIDLimiter {
  /** Arary of notifications to exclude (Allowed types: "follow", "favourite", "reblog", "mention") */
  exclude_types?: Notification["type"][]
}

export class MastodonNotificationsAPI {
  constructor(public instanceURL: string, private userAccessToken: string) { }

  private fetch<T>(method: string, path: string, queryMap: Record<string, any> = {}) {
    return apiFetch<T>(this.instanceURL, this.userAccessToken, method, path, queryMap);
  }

  getAll(params?: MastodonNotificationParameters) {
    return this.fetch<Notification[]>("GET", "/api/v1/notifications", params);
  }

  get(id: string) {
    return this.fetch<Notification>("POST", `/api/v1/notifications/${id}`);
  }

  dismiss(id: string) {
    return this.fetch<void>("POST", "/api/v1/notifications/dismiss", { id });
  }
}