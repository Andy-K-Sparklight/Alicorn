import React from "react";
import ReactDOM from "react-dom";
import { initTranslator } from "./Translator";
import { Box, createMuiTheme, MuiThemeProvider } from "@material-ui/core";
import { loadConfig } from "../modules/config/ConfigSupport";
import { loadGDT } from "../modules/container/ContainerUtil";
import { loadJDT } from "../modules/java/JInfo";
import { initEncrypt } from "../modules/security/Encrypt";
import { loadMirror } from "../modules/download/Mirror";
import { initConcurrentDownloader } from "../modules/download/Concurrent";
import { initDownloadWrapper } from "../modules/download/DownloadWrapper";
import { initModInfo } from "../modules/modx/ModInfo";
import { initForgeInstallModule } from "../modules/pff/install/ForgeInstall";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { initVF } from "../modules/container/ValidateRecord";
import { prepareAJ } from "../modules/auth/AJHelper";
import { initCommands } from "../modules/command/CommandHandler";

const GLOBAL_STYLES: React.CSSProperties = {
  userSelect: "none",
};
export const ALICORN_DEFAULT_THEME_DARK = createMuiTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#5d2391",
      light: "#d796f0",
    },
    secondary: {
      main: "#df307f",
      light: "#ffe0f0",
    },
  },
});
export const ALICORN_DEFAULT_THEME_LIGHT = createMuiTheme({
  palette: {
    type: "light",
    primary: {
      main: "#5d2391",
      light: "#d796f0",
    },
    secondary: {
      main: "#df307f",
      light: "#ffe0f0",
    },
  },
});

function RendererBootstrap(): JSX.Element {
  return (
    <Box style={GLOBAL_STYLES}>
      <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_DARK}>
        <HashRouter>
          <App />
        </HashRouter>
      </MuiThemeProvider>
    </Box>
  );
}

initTranslator();
window.addEventListener("unhandledrejection", (e) => {
  console.log(e.reason);
  window.dispatchEvent(new CustomEvent("sysError", { detail: e.reason }));
});
window.addEventListener("error", (e) => {
  console.log(e.message);
  window.dispatchEvent(new CustomEvent("sysError", { detail: e.message }));
});
(async () => {
  console.log("Initializing modules...");
  await loadConfig();
  initCommands();
  await loadGDT();
  await initEncrypt();
  await loadMirror();
  await initConcurrentDownloader();
  initDownloadWrapper();
  await initModInfo();
  await initForgeInstallModule();
  await initVF();
  await prepareAJ(); // Authlib Injector
  await loadJDT();
  console.log("Delayed init tasks finished.");
})();

ReactDOM.render(<RendererBootstrap />, document.getElementById("root"));
