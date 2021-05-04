import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { initTranslator } from "./Translator";
import { Box, createMuiTheme, MuiThemeProvider } from "@material-ui/core";
import { loadData, saveDefaultData } from "../modules/config/DataSupport";
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
import { initBuiltInCommands } from "../modules/command/CommandHandler";

const ALICORN_THEME_FILE = "alicorn.theme.json";
const GLOBAL_STYLES: React.CSSProperties = {
  userSelect: "none",
};
const ALICORN_DEFAULT_THEME = createMuiTheme({
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

function RendererBootstrap(): JSX.Element {
  const [theme, setTheme] = useState(ALICORN_DEFAULT_THEME);
  const [themeLoadedBit, setLoaded] = useState(false);
  useEffect(() => {
    if (!themeLoadedBit) {
      setLoaded(true);
      (async () => {
        try {
          await saveDefaultData(ALICORN_THEME_FILE);
          const themeFile = JSON.parse(await loadData(ALICORN_THEME_FILE));
          setTheme(createMuiTheme(themeFile));
        } catch {}
      })();
    }
  });
  return (
    <Box style={GLOBAL_STYLES}>
      <MuiThemeProvider theme={theme}>
        <HashRouter>
          <App />
        </HashRouter>
      </MuiThemeProvider>
    </Box>
  );
}

initTranslator();
(async () => {
  console.log("Initializing modules...");
  await loadConfig();
  initBuiltInCommands();
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
