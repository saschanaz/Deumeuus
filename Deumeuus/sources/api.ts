export interface ClientInformation {
  id: string;
  client_id: string;
  client_secret: string;
}

export class MastodonAPI {
  constructor(instanceURL: string, key: ClientInformation) {

  }
}

export interface AppRegistration {
  client_name: string;
  redirect_uris: string;
  scopes: string;
  website?: string;
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