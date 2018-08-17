import { registerApp, MastodonAPI } from "./api";
import { authorizeUser, getUserToken } from "./oauth2";
import * as storage from "./storage";

import WebAuthenticationBroker = Windows.Security.Authentication.Web.WebAuthenticationBroker;
import WebAuthenticationResult = Windows.Security.Authentication.Web.WebAuthenticationResult;
import WebAuthenticationOptions = Windows.Security.Authentication.Web.WebAuthenticationOptions;
import WebAuthenticationStatus = Windows.Security.Authentication.Web.WebAuthenticationStatus;

async function getStartingUser() {
  const users = (await storage.getUserInformationList()) || [];
  if (users.length) {
    return users[0];
  }

  const instance = "https://pawoo.net"
  const redirect = "deumeuus://ana.s.tasia";
  const keys = await registerApp(instance, {
    client_name: "deumeuus",
    redirect_uris: redirect,
    scopes: "read write follow"
  });

  const authCode = await authorizeUser(instance, redirect, keys.client_id);
  const authToken = await getUserToken(instance, {
    client_id: keys.client_id,
    client_secret: keys.client_secret,
    code: authCode,
    grant_type: "authorization_code",
    redirect_uri: redirect
  })

  const user = {
    accessToken: authToken.access_token,
    instance
  };
  users.push(user);
  await storage.setUserInforamationList(users);

  return user;
}

async function main() {
  const user = await getStartingUser();

  const userControl = new MastodonAPI(user.instance, user.accessToken);
  const credentials = await userControl.verifyCredentials();
  console.log(credentials);
}
main();