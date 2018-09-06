import { registerApp, MastodonAPI } from "./api";
import { authorizeUser, getUserToken } from "./oauth2";
import * as storage from "./storage";
import { DeumeuusScreen } from "./ui/screen";

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
  await storage.setUserInformationList(users);

  return user;
}

async function domReady() {
  if (document.readyState !== "loading") {
    return;
  }
  return new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve));
}

function startSelectionCanceller() {
  let potentialSelector = -1;
  document.body.addEventListener("pointerdown", ev => {
    const computed = getComputedStyle(ev.target! as Element);
    const userSelect = computed.userSelect || computed.webkitUserSelect;
    potentialSelector = userSelect !== "none" ? ev.pointerId : -1;
  });
  document.body.addEventListener("pointerup", ev => {
    if (ev.pointerId === potentialSelector) {
      return;
    }
    const computed = getComputedStyle(ev.target! as Element);
    const userSelect = computed.userSelect || computed.webkitUserSelect;
    if (userSelect === "none") {
      getSelection().empty();
    }
  })
}

async function main() {
  const user = await getStartingUser();
  const userControl = new MastodonAPI(user.instance, user.accessToken);
  const screen = new DeumeuusScreen();
  screen.user = userControl;

  await domReady();
  startSelectionCanceller();
  document.body.appendChild(screen);
}
main();
