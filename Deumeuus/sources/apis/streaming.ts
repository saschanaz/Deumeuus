import { Notification, Status } from "../entities";

export type MastodonStreamingContent = {
  event: "update";
  data: Status;
} & {
  event: "notification";
  data: Notification;
} & {
  event: "delete";
  data: string;
} & {
  event: "filters_changed";
}

function eventSourceToAsyncIterator() {

}

export class MastodonStreamingAPI {
  constructor(public instanceURL: string, private userAccessToken: string) { }

  user() {
    
  }
}