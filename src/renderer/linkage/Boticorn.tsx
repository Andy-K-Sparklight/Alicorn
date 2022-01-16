import { Button, Container, ThemeProvider, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  initBoticorn,
  isBoticornAvailable,
  upgradeBoticorn,
} from "../../modules/boticorn/Driver";
import { getBoolean, set } from "../../modules/config/ConfigSupport";
import { submitError, submitInfo, submitSucc } from "../Message";
import {
  ALICORN_DEFAULT_THEME_DARK,
  ALICORN_DEFAULT_THEME_LIGHT,
  isBgDark,
} from "../Renderer";
import { useTextStyles } from "../Stylex";
import { tr } from "../Translator";

export function Boticorn(): JSX.Element {
  const classes = useTextStyles();
  const [enabled, setEnabled] = useState(getBoolean("interactive.boticorn"));
  const [isRunning, setRunning] = useState(false);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    void (async () => {
      setAvailable(await isBoticornAvailable());
    })();
  }, []);
  return (
    <ThemeProvider
      theme={
        isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
      }
    >
      <Container>
        <Typography className={classes.secondText} gutterBottom>
          {tr("Boticorn.Desc")}
        </Typography>
        <br />
        <Typography className={classes.secondText} gutterBottom>
          {tr(
            available
              ? enabled
                ? "Boticorn.Enabled"
                : "Boticorn.Disabled"
              : "Boticorn.NotInstalled"
          )}
        </Typography>
        <br />

        <Button
          color={"primary"}
          variant={"contained"}
          disabled={isRunning}
          onClick={async () => {
            if (available) {
              if (enabled) {
                set("interactive.boticorn", false);
                setEnabled(false);
              } else {
                set("interactive.boticorn", true);
                setEnabled(true);
              }
            } else {
              try {
                setRunning(true);
                submitInfo(tr("Boticorn.Installing"));
                if (!(await upgradeBoticorn())) {
                  throw "Upgrade Failed!";
                }
                set("interactive.boticorn", true);
                setEnabled(true);
                setAvailable(true);
                await initBoticorn();
                submitSucc(tr("Boticorn.InstallOK"));
              } catch {
                submitError(tr("Boticorn.FailedToInstall"));
              }
            }
          }}
        >
          {tr(
            available
              ? enabled
                ? "Boticorn.Disable"
                : "Boticorn.Enable"
              : "Boticorn.Install"
          )}
        </Button>
        <br />
        <br />
        <Typography className={classes.secondText} gutterBottom>
          {tr("Boticorn.Hint")}
        </Typography>
      </Container>
    </ThemeProvider>
  );
}
