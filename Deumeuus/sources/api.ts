import { MastodonAccountsAPI } from "./apis/accounts";
import { MastodonNotificationsAPI } from "./apis/notifications";
import { MastodonStatusesAPI } from "./apis/statuses";
import { MastodonStreamingAPI } from "./apis/streaming";
import { MastodonTimelinesAPI } from "./apis/timelines";

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

export async function apiFetch<T>(
  instance: string,
  accessToken: string,
  method: string,
  path: string,
  queryMap: Record<string, any> = {}
) {
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

  accounts = new MastodonAccountsAPI(this.instanceURL, this.userAccessToken);
  notifications = new MastodonNotificationsAPI(this.instanceURL, this.userAccessToken);
  statuses = new MastodonStatusesAPI(this.instanceURL, this.userAccessToken);
  timelines = new MastodonTimelinesAPI(this.instanceURL, this.userAccessToken);
  streaming = new MastodonStreamingAPI(this.instanceURL, this.userAccessToken);
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
