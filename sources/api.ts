import * as li from "li";
import { MastodonAccountsAPI } from "./apis/accounts";
import { MastodonNotificationsAPI } from "./apis/notifications";
import { MastodonStatusesAPI } from "./apis/statuses";
import { MastodonStreamingAPI } from "./apis/streaming";
import { MastodonTimelinesAPI } from "./apis/timelines";

export interface CursorsMixin {
  cursors: {
    /** max_id to load older items */
    older: string | null;
    /** since_id to load newer items */
    newer: string;
  } | undefined;
}

interface Appendable {
  append(name: string, value: string): void;
}

function appendQueryEntries<T extends Appendable>(base: T, queryMap: Record<string, any>) {
  for (const [key, value] of Object.entries(queryMap)) {
    if (Array.isArray(value)) {
      if (value.some(item => typeof item === "object")) {
        // Support for fields_attributes
        // https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#updating-the-current-user
        for (const [i, item] of value.entries()) {
          if (typeof item !== "object") {
            throw new Error("Heterogeneously typed array is not supported");
          }
          for (const [k, v] of Object.entries<any>(item)) {
            base.append(`${key}[${i}][${k}]`, v);
          }
        }
      } else {
        // Support for exclude_types
        // https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#fetching-a-users-notifications
        for (const item of value) {
          base.append(`${key}[]`, item);
        }
      }
    } else if (typeof value === "object") {
      // Support for source
      // https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#updating-the-current-user
      for (const [k, v] of Object.entries<any>(value)) {
        base.append(`${key}[${k}]`, v);
      }
    } else {
      base.append(key, value);
    }
  }
}

function queryMapToString(queryMap: Record<string, any>) {
  const params = new URLSearchParams();
  appendQueryEntries(params, queryMap);
  const result = params.toString();
  if (result) {
    return `?${result}`;
  }
  return "";
}

function queryMapToFormData(queryMap: Record<string, any>) {
  const data = new FormData();
  appendQueryEntries(data, queryMap);
  return data;
}

export async function apiFetch<T>(
  instance: string,
  accessToken: string,
  method: string,
  path: string,
  queryMap: Record<string, any> = {}
) {
  const remote = new URL(`${path}${method === "GET" ? queryMapToString(queryMap) : ""}`, instance);
  const body = method !== "GET" ? queryMapToFormData(queryMap) : null;
  const response = await fetch(remote.toString(), {
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
    if (response.headers.has("Link")) {
      data.cursors = linkToCursors(remote, response.headers.get("Link")!);
    }
    return data as T;
  }
  throw new Error((data && data.error) ? `API error: ${data.error}` : "Unknown API error");
}

function linkToCursors(remote: URL, link: string) {
  const parsed = li.parse(link);
  const next = "next" in parsed ? new URL(parsed.next) : null;
  const prev = new URL(parsed.prev);
  const originPath = remote.origin + remote.pathname;
  if (next) {
    if (next.origin + next.pathname !== originPath) {
      throw new Error("`next` field from Link header unexpectedly includes different path.");
    }
    if (!next.searchParams.has("max_id")) {
      throw new Error("`next` field from Link header unexpectedly lacks `max_id`.");
    }
  }
  if (prev.origin + prev.pathname !== originPath) {
    throw new Error("`prev` field from Link header unexpectedly includes different path.");
  }
  if (!prev.searchParams.has("since_id")) {
    throw new Error("`prev` field from Link header unexpectedly lacks `since_id`.");
  }

  return {
    older: next && next.searchParams.get("max_id"),
    newer: prev.searchParams.get("since_id")
  };
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
