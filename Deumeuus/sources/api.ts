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

export class MastodonAPI {
  constructor(public instanceURL: string, private userAccessToken: string) { }

  private async fetch<T>(path: string, options: RequestInit = {}) {
    const response = await fetch(`${this.instanceURL}/${path}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.userAccessToken}`
      }
    });
    const data = await response.json();
    if (response.ok) {
      return data as T;
    }
    throw new Error((data && data.error) ? `API error: ${data.error}` : "Unknown API error");
  }

  async verifyCredentials() {
    return this.fetch("/api/v1/accounts/verify_credentials") as Promise<UserCredentials>;
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
