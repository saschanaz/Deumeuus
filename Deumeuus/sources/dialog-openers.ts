import { MastodonAPI } from "./api";
import openDialog from "./dialog-open";
import { Status } from "./entities";
import ConversationViewer from "./ui/conversation-viewer";

export function openConversationPopup(user: MastodonAPI, status: Status) {
  openDialog({
    nodes: [new ConversationViewer({ user, status })],
    classes: ["limitedwidth"]
  });
}
