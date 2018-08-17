import * as entities from "./entities";
import { MastodonTimelinesAPI } from "./apis/timelines";

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
    params.append(key, value);
  }
  const result = params.toString();
  if (result) {
    return `?${result}`;
  }
  return "";
}

export async function apiFetch<T>(instance: string, accessToken: string, method: string, path: string, queryMap: Record<string, any> = {}) {
  const queries = new URLSearchParams()
  const response = await fetch(`${instance}/${path}${queryMapToString(queryMap)}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  const data = await response.json();
  if (response.ok) {
    return data as T;
  }
  throw new Error((data && data.error) ? `API error: ${data.error}` : "Unknown API error");
}

export class MastodonAPI {
  constructor(public instanceURL: string, private userAccessToken: string) { }

  timelines = new MastodonTimelinesAPI(this.instanceURL, this.userAccessToken);

  private fetch<T>(method: string, path: string, queryMap: Record<string, any> = {}) {
    return apiFetch<T>(this.instanceURL, this.userAccessToken, method, path, queryMap);
  }

  async verifyCredentials() {
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
