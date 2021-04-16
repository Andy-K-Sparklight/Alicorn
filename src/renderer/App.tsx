import React, { useEffect, useState } from "react";
import {
  AppBar,
  Box,
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
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  })
);
let EVENT_LISTENED_FLAG = false;

export function App(): JSX.Element {
  const classes = useStyles();
  const [page, setPage] = useState(Pages.Today.toString());
  useEffect(() => {
    if (!EVENT_LISTENED_FLAG) {
      EVENT_LISTENED_FLAG = true;
      document.addEventListener("setPage", (e) => {
        setPage(String(safeGet(e, ["detail"], Pages.Today)));
      });
    }
  });
  return (
    <Box className={classes.root}>
      <AppBar position={"static"}>
        <Toolbar>
          <Box className={"window-drag" + " " + classes.title}>
            {/* Drag our window with title */}
            <Typography variant={"h6"}>{tr(page)}</Typography>
          </Box>
          <Box
            className={classes.floatButton}
            onClick={() => {
              remoteOpenDevTools();
            }}
          >
            <IconButton color={"inherit"}>
              <Code />
            </IconButton>
          </Box>
          <Box
            className={classes.floatButton}
            onClick={() => {
              jumpTo("/LaunchPad");
              triggerSetPage(Pages.LaunchPad);
            }}
          >
            <IconButton color={"inherit"}>
              <FlightTakeoff />
            </IconButton>
          </Box>
          <Box onClick={remoteCloseWindow}>
            <IconButton className={classes.exitButton} color={"inherit"}>
              <PowerSettingsNew />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Route path={"/LaunchPad"} component={LaunchPad} />
    </Box>
  );
}

function remoteCloseWindow(): void {
  ipcRenderer.send("closeWindow");
}

function remoteOpenDevTools(): void {
  ipcRenderer.send("openDevTools");
}
