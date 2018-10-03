import { element } from "domliner";
import { MastodonAPI } from "./api";
import openDialog from "./dialog-open";
import { Status } from "./entities";
import ConversationViewer from "./ui/conversation-viewer";
import NamedPage from "./ui/namedpage";

export function openConversationPopup(user: MastodonAPI, status: Status) {
  openDialog({
    nodes: [
      element(new NamedPage({
        pageTitle: "Conversations",
        content: new ConversationViewer({ user, status })
      }), { class: "fillheight" })
    ],
    classes: ["limitedwidth"]
  });
}
