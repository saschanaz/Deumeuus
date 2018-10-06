import SystemNavigationManager = Windows.UI.Core.SystemNavigationManager;
import AppViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility;

export default function manageBackButtonViaBodyMutation() {
  const observer = new MutationObserver(mutations => {
    const dialogAdded = mutations.some(
      mutation => Array.from(mutation.addedNodes).some(isDialog)
    );
    if (dialogAdded) {
      const view = SystemNavigationManager.getForCurrentView();
      view.appViewBackButtonVisibility = AppViewBackButtonVisibility.visible;
    } else if (!Array.from(document.body.children).some(isDialog)) {
      const view = SystemNavigationManager.getForCurrentView();
      view.appViewBackButtonVisibility = AppViewBackButtonVisibility.collapsed;
    }
  });
  observer.observe(document.body, {
    childList: true
  });
  return observer;
}

function isDialog(node: Node) {
  return node.localName === "dialog";
}
