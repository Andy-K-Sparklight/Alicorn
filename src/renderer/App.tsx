import React, { useEffect, useState } from "react";
import {
  AppBar,
  createStyles,
  IconButton,
  makeStyles,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { tr } from "./Translator";
import { Code, FlightTakeoff, PowerSettingsNew } from "@material-ui/icons";
import { ipcRenderer } from "electron";
import { Route } from "react-router";
import { LaunchPad } from "./LaunchPad";
import { jumpTo, Pages, triggerSetPage } from "./GoTo";
import { safeGet } from "../modules/commons/Null";

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    exitButton: {
      marginRight: 0,
    },
    floatButton: {
      float: "right",
    },
    title: {
      flexGrow: 1,
    },
  })
);
let EVENT_LISTENED_FLAG = false;

export function App(): JSX.Element {
  const classes = useStyles();
  const [page, setPage] = useState(Pages.Today);
  useEffect(() => {
    if (!EVENT_LISTENED_FLAG) {
      EVENT_LISTENED_FLAG = true;
      document.addEventListener("setPage", (e) => {
        setPage(safeGet(e, ["detail"], Pages.Today) as Pages);
      });
    }
  });
  return (
    <div className={classes.root}>
      <AppBar position={"static"}>
        <Toolbar>
          <Typography variant={"h6"} className={classes.title}>
            {tr(page)}
          </Typography>
          <div
            onClick={() => {
              remoteOpenDevTools();
            }}
          >
            <IconButton className={classes.floatButton} color={"inherit"}>
              <Code />
            </IconButton>
          </div>
          <div
            onClick={() => {
              jumpTo("/LaunchPad");
              triggerSetPage(Pages.LaunchPad);
            }}
          >
            <IconButton className={classes.floatButton} color={"inherit"}>
              <FlightTakeoff />
            </IconButton>
          </div>
          <div onClick={remoteCloseWindow}>
            <IconButton className={classes.exitButton} color={"inherit"}>
              <PowerSettingsNew />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>

      <Route path={"/LaunchPad"} component={LaunchPad} />
    </div>
  );
}

function remoteCloseWindow(): void {
  ipcRenderer.send("closeWindow");
}

function remoteOpenDevTools(): void {
  ipcRenderer.send("openDevTools");
}
