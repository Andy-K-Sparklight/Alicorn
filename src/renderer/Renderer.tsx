import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import { initTranslator } from "./Translator";
import { Box, createMuiTheme, MuiThemeProvider } from "@material-ui/core";
import { loadData, saveDefaultData } from "../modules/config/DataSupport";
import { HashRouter } from "react-router-dom";

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
  useEffect(() => {
    (async () => {
      try {
        await saveDefaultData(ALICORN_THEME_FILE);
        const themeFile = JSON.parse(await loadData(ALICORN_THEME_FILE));
        setTheme(createMuiTheme(themeFile));
      } catch {}
    })();
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
ReactDOM.render(<RendererBootstrap />, document.getElementById("root"));
