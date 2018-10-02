import * as localforage from "localforage";

export const styleElement = document.createElement("style");

const uiSettings = new Windows.UI.ViewManagement.UISettings();
uiSettings.addEventListener("colorvalueschanged", () => {
  if (styleElement.sheet) {
    applyStyle(currentStyle);
  }
});
const defaultStyle: AppStyle = Object.freeze({
  backgroundColor: "#1a1a1a",
  backgroundMenuColor: "#262626",
  fontFamily: '"Segoe UI", sans-serif',
  // accentColor can be 'SystemColor' to receive color from UISettings
  accentColor: "SystemColor",
  accentColorBold: "SystemColor",
  accentColorFaint: "SystemColor"
});
const currentStyle = { ...defaultStyle };

export interface AppStyle {
  backgroundColor: string;
  fontFamily: string;
  accentColor: string;
  accentColorBold: string;
  accentColorFaint: string;
}
async function loadSavedStyle() {
  const loaded = await localforage.getItem("style") as AppStyle;
  if (loaded) {
    Object.assign(currentStyle, loaded);
  }
}

export function applyStyle(style: AppStyle) {
  const controllableSheet = styleElement.sheet as CSSStyleSheet;
  if (!controllableSheet) {
    throw new Error("The style element must be added to the document as a child before applying style");
  }
  const view = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();

  // https://social.msdn.microsoft.com/Forums/vstudio/en-US/76543875-2725-43ed-9df9-04fe82b0176f
  view.titleBar.backgroundColor
    = view.titleBar.inactiveBackgroundColor
    = view.titleBar.buttonBackgroundColor
    = view.titleBar.buttonInactiveBackgroundColor
    = Windows.UI.ColorHelper.fromArgb(0xFF, 0x1a, 0x1a, 0x1a);

  controllableSheet.insertRule(`body, dialog {
    background-color: ${style.backgroundColor};
    font-family: ${style.fontFamily} !important;
}`);
  controllableSheet.insertRule(`textarea {
    font-family: ${style.fontFamily};
}`);

  if (style.accentColor === "SystemColor") {
    const systemAccentColor = uiSettings.getColorValue(Windows.UI.ViewManagement.UIColorType.accent);
    /* TODO: select based on system color mode (light mode/dark mode) */
    const systemAccentBoldColor = uiSettings.getColorValue(Windows.UI.ViewManagement.UIColorType.accentLight1);
    const systemAccentFaintColor = uiSettings.getColorValue(Windows.UI.ViewManagement.UIColorType.accentDark1);
    style.accentColor = `rgb(${systemAccentColor.r}, ${systemAccentColor.g}, ${systemAccentColor.b})`;
    style.accentColorBold =
      `rgb(${systemAccentBoldColor.r}, ${systemAccentBoldColor.g}, ${systemAccentBoldColor.b})`;
    style.accentColorFaint =
      `rgb(${systemAccentFaintColor.r}, ${systemAccentFaintColor.g}, ${systemAccentFaintColor.b})`;
  }
  controllableSheet.insertRule(`:root {
    --accent-color: ${style.accentColor};
    --accent-color-bold: ${style.accentColorBold};
    --accent-color-faint: ${style.accentColorFaint};
}`);
  controllableSheet.insertRule(`
.userinformationslot-followbutton-connected,
.userprofilepage-scrollablemenubuttons > *:hover,
.userprofilepage-scrollablemenubuttons > *:disabled
{ background-color: ${style.accentColor} }`);
}

export async function applySavedOrDefaultStyle() {
  await loadSavedStyle();
  applyStyle(currentStyle);
}
