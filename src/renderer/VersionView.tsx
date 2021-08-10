import { Box, createStyles, makeStyles, Typography } from "@material-ui/core";
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import pkg from "../../package.json";
import { tr } from "./Translator";
export function VersionView(): JSX.Element {
  const [ecVersion, setEcVersion] = useState(
    tr("VersionView.Electron.Fetching")
  );
  useEffect(() => {
    (async () => {
      setEcVersion(await ipcRenderer.invoke("getElectronVersion"));
    })();
  }, []);
  const classes = makeStyles((theme) =>
    createStyles({
      root: {
        marginLeft: theme.spacing(2),
      },
      title: {
        fontSize: "larger",
        color: theme.palette.primary.main,
      },
      text: {
        fontSize: "small",
      },
    })
  )();
  return (
    <Box className={classes.root}>
      <Typography className={classes.title} gutterBottom>
        {tr("VersionView.Name") + " " + pkg.appVersion}
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
      <Typography className={classes.text} color={"secondary"} gutterBottom>
        {tr("VersionView.Copyright1")}
      </Typography>
      <Typography className={classes.text} color={"secondary"} gutterBottom>
        {tr("VersionView.Copyright2")}
      </Typography>

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
