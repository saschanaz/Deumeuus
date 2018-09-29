import { MastodonNotificationsAPI } from "./apis/notifications";
import { MastodonStatusesAPI } from "./apis/statuses";
import { MastodonStreamingAPI } from "./apis/streaming";
import { MastodonTimelinesAPI } from "./apis/timelines";
import * as entities from "./entities";

export interface UserCredentials extends entities.Account {
  /** Selected preference: Default privacy of new toots*/
  privacy: boolean;
  /** Selected preference: Mark media as sensitive by default? */
  sensitive: boolean;
  /** Plain - text version of the account's note */
  note: string;
  /** Array of profile metadata, each element has 'name' and 'value' */
  fields: any[];
}

function queryMapToString(queryMap: Record<string, any>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(queryMap)) {
    if (Array.isArray(value)) {
      // Mastodon follows Rails convention
      // https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#parameter-types
      for (const item of value) {
        params.append(`${key}[]`, item);
      }
    } else {
      params.append(key, value);
    }
  }
  const result = params.toString();
  if (result) {
    return `?${result}`;
  }
  return "";
}

function queryMapToFormData(queryMap: Record<string, any>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(queryMap)) {
    data.append(key, value);
  }
  return data;
}

export async function apiFetch<T>(instance: string, accessToken: string, method: string, path: string, queryMap: Record<string, any> = {}) {
  const remote = new URL(`${path}${method === "GET" ? queryMapToString(queryMap) : ""}`, instance).toString();
  const body = method !== "GET" ? queryMapToFormData(queryMap) : null;
  const response = await fetch(remote, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body
  });
  if (response.status === 404) {
    throw new Error(await response.text());
  }
  const data = await response.json();
  if (response.ok) {
    return data as T;
  }
  throw new Error((data && data.error) ? `API error: ${data.error}` : "Unknown API error");
}

export class MastodonAPI {
  constructor(public instanceURL: string, private userAccessToken: string) { }

  notifications = new MastodonNotificationsAPI(this.instanceURL, this.userAccessToken);
  statuses = new MastodonStatusesAPI(this.instanceURL, this.userAccessToken);
  timelines = new MastodonTimelinesAPI(this.instanceURL, this.userAccessToken);
  streaming = new MastodonStreamingAPI(this.instanceURL, this.userAccessToken);

  private fetch<T>(method: string, path: string, queryMap: Record<string, any> = {}) {
    return apiFetch<T>(this.instanceURL, this.userAccessToken, method, path, queryMap);
  }

  verifyCredentials() {
    return this.fetch("GET", "/api/v1/accounts/verify_credentials") as Promise<UserCredentials>;
  }
}

export interface AppRegistration {
  client_name: string;
  redirect_uris: string;
  scopes: string;
  website?: string;
}

export interface ClientInformation {
  id: string;
  client_id: string;
  client_secret: string;
}

export async function registerApp(instanceURL: string, args: AppRegistration) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(args)) {
    formData.append(key, value);
  }
  const response = await fetch(`${instanceURL}/api/v1/apps`, {
    method: "POST",
    body: formData
  });
  return response.json() as Promise<ClientInformation>;
}
