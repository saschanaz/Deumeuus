import { registerApp } from "./api"

import WebAuthenticationBroker = Windows.Security.Authentication.Web.WebAuthenticationBroker;
import WebAuthenticationOptions = Windows.Security.Authentication.Web.WebAuthenticationOptions;
import WebAuthenticationStatus = Windows.Security.Authentication.Web.WebAuthenticationStatus;

async function main() {
  const instance = "https://pawoo.net"
  const keys = await registerApp(instance, {
    client_name: "deumeuus",
    redirect_uris: "urn:ietf:wg:oauth:2.0:oob",
    scopes: "read write follow"
  });

  const redirect = "intent://oauthresponse";
  const uri = new Windows.Foundation.Uri(instance, `/oauth/authorize?scope=read%20write%20follow&response_type=code&redirect_uri=${encodeURIComponent(redirect)}&client_id=${keys.client_id}`);

  const broker = await WebAuthenticationBroker.authenticateAsync(
    WebAuthenticationOptions.none,
    uri,
    new Windows.Foundation.Uri(redirect)
  );

  switch (broker.responseStatus) {
    case WebAuthenticationStatus.errorHttp:
      await new Windows.UI.Popups.MessageDialog("Network error occured while doing authentication.").showAsync();
      return;
    case WebAuthenticationStatus.userCancel:
      await new Windows.UI.Popups.MessageDialog("You canceled authentication.").showAsync();
      return;
    case WebAuthenticationStatus.success:
      await new Windows.UI.Popups.MessageDialog("Authenticated successfully.").showAsync();
      console.log(broker.responseData);
      break;
  }
}
main();