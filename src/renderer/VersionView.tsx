import { Box, createStyles, makeStyles, Typography } from "@material-ui/core";
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import pkg from "../../package.json";
import { tr } from "./Translator";
const modeList = ["Copyright", "Privacy", "Credit"];
export function VersionView(): JSX.Element {
  const [ecVersion, setEcVersion] = useState(
    tr("VersionView.Electron.Fetching")
  );
  const [displayMode, setDisplayMode] = useState(0);
  useEffect(() => {
    void (async () => {
      setEcVersion(await ipcRenderer.invoke("getElectronVersion"));
    })();
  }, []);
  const classes = makeStyles((theme) =>
    createStyles({
      root: {},
      title: {
        fontSize: "larger",
        color: theme.palette.primary.main,
      },
      text: {
        fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
      },
    })
  )();
  return (
    <Box className={classes.root}>
      <Typography className={classes.title} gutterBottom>
        {tr(
          "VersionView.Name",
          `AppVersion=${pkg.appVersion}`,
          `UpdatorVersion=${pkg.updatorVersion}`
        )}
      </Typography>
      <Typography className={classes.text} color={"secondary"}>
        {tr(
          "VersionView.EcVersion",
          `Build=${pkg.devDependencies.electron.slice(1)}`,
          `Current=${ecVersion}`
        )}
      </Typography>
      <Typography className={classes.text} color={"secondary"} gutterBottom>
        {tr(
          "VersionView.Electron." +
            cmpVersion(ecVersion, pkg.devDependencies.electron.slice(1))
        )}
      </Typography>
      <Typography className={classes.text} color={"secondary"} gutterBottom>
        {tr("VersionView.Description")}
      </Typography>
      <Typography className={classes.text} color={"secondary"} gutterBottom>
        {tr("VersionView.AuthorName") + " " + tr("VersionView.Authors")}
      </Typography>
      <br />
      <Typography className={classes.text} color={"secondary"} gutterBottom>
        {tr("VersionView.FreeSoftwareClaim")}
      </Typography>
      <Box
        onClick={() => {
          setDisplayMode((v) => {
            let r = v + 1;
            if (r >= modeList.length) {
              r = 0;
            }
            return r;
          });
        }}
      >
        <Typography className={classes.text} color={"secondary"} gutterBottom>
          {tr("VersionView." + modeList[displayMode])}
        </Typography>
        <Typography className={classes.text} color={"secondary"} gutterBottom>
          {tr("VersionView.ClickToSeeNext")}
        </Typography>
      </Box>
      <Typography
        className={classes.text}
        color={"primary"}
        style={{
          float: "right",
          marginRight: "2%",
        }}
      >
        {tr("VersionView.SuperCowPower")}
      </Typography>
    </Box>
  );
}
function cmpVersion(
  current: string,
  build: string
): "Perfect" | "OK" | "Attention" {
  if (current === build) {
    return "Perfect";
  }
  if (current.split(".")[0] === build.split(".")[0]) {
    return "OK";
  }
  return "Attention";
}
