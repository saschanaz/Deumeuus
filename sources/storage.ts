import * as localforage from "localforage";
import { ClientInformation } from "./api";

export async function getInstanceTokenMap() {
  return await localforage.getItem("instanceTokenMap") as Record<string, ClientInformation> | undefined;
}

export async function setInstanceTokenMap(map: Record<string, ClientInformation>) {
  await localforage.setItem("instanceTokenMap", map);
}

interface UserInformation {
  accessToken: string;
  instance: string;
}

export async function getUserInformationList() {
  return await localforage.getItem("userInformationList") as UserInformation[] | undefined;
}

export async function setUserInformationList(userInformations: UserInformation[]) {
  await localforage.setItem("userInformationList", userInformations);
}
