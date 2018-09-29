import WebAuthenticationBroker = Windows.Security.Authentication.Web.WebAuthenticationBroker;
import WebAuthenticationResult = Windows.Security.Authentication.Web.WebAuthenticationResult;
import WebAuthenticationOptions = Windows.Security.Authentication.Web.WebAuthenticationOptions;
import WebAuthenticationStatus = Windows.Security.Authentication.Web.WebAuthenticationStatus;

export async function authorizeUser(instance: string, redirect: string, clientId: string) {
  const uri = new Windows.Foundation.Uri(instance, `/oauth/authorize?scope=read%20write%20follow&response_type=code&redirect_uri=${encodeURIComponent(redirect)}&client_id=${clientId}`);

  let authentication: WebAuthenticationResult | undefined;
  while (!authentication || authentication.responseStatus !== WebAuthenticationStatus.success) {
    authentication = await WebAuthenticationBroker.authenticateAsync(
      WebAuthenticationOptions.none,
      uri,
      new Windows.Foundation.Uri(redirect)
    );
    switch (authentication.responseStatus) {
      case WebAuthenticationStatus.errorHttp:
        await new Windows.UI.Popups.MessageDialog("Network error occured while doing authentication.").showAsync();
        break;
      case WebAuthenticationStatus.userCancel:
        await new Windows.UI.Popups.MessageDialog("You canceled authentication.").showAsync();
        break;
    }
  }
  const token = new URL(authentication!.responseData).searchParams.get("code");
  if (!token) {
    throw new Error("Couldn't get user token from authentication response");
  }
  return token;
}

export interface AccessTokenRequest {
  grant_type: "authorization_code";
  client_id: string;
  client_secret: string;
  code: string;
  redirect_uri: string;
}

export interface AccessTokenResponse {
  access_token: string;
  created_at: string;
  scope: string;
  token_type: string;
}

export async function getUserToken(instance: string, params: AccessTokenRequest) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }
  const response = await fetch(`${instance}/oauth/token`, {
    method: "POST",
    body: formData
  });
  return response.json() as Promise<AccessTokenResponse>;
}
