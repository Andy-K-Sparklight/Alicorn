import React, { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  createStyles,
  IconButton,
  makeStyles,
  Toolbar,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { ipcRenderer } from "electron";
import { jumpTo, Pages, triggerSetPage } from "./GoTo";
import { safeGet } from "../modules/commons/Null";
import { saveConfigSync } from "../modules/config/ConfigSupport";
import { saveGDTSync } from "../modules/container/ContainerUtil";
import { saveJDTSync } from "../modules/java/JInfo";
import { saveMirrorSync } from "../modules/download/Mirror";
import { Code, FlightTakeoff, PowerSettingsNew } from "@material-ui/icons";
import { LaunchPad } from "./LaunchPad";
import { tr } from "./Translator";
import { Route } from "react-router";

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      width: "100%",
      backgroundColor: theme.palette.secondary.light,
    },
    content: {
      marginTop: theme.spacing(10),
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
      <AppBar>
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
            <Tooltip title={tr("MainMenu.OpenDevTools")}>
              <IconButton color={"inherit"}>
                <Code />
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            className={classes.floatButton}
            onClick={() => {
              jumpTo("/LaunchPad");
              triggerSetPage(Pages.LaunchPad);
            }}
          >
            <Tooltip title={tr("MainMenu.QuickLaunchPad")}>
              <IconButton color={"inherit"}>
                <FlightTakeoff />
              </IconButton>
            </Tooltip>
          </Box>
          <Box onClick={remoteCloseWindow}>
            <Tooltip title={tr("MainMenu.Exit")}>
              <IconButton className={classes.exitButton} color={"inherit"}>
                <PowerSettingsNew />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Box className={classes.content}>
        <Route path={"/LaunchPad"} component={LaunchPad} />
      </Box>
    </Box>
  );
}

function remoteCloseWindow(): void {
  console.log("Closing!");
  prepareToQuit();
  ipcRenderer.send("closeWindow");
}

function remoteOpenDevTools(): void {
  ipcRenderer.send("openDevTools");
}

function prepareToQuit(): void {
  console.log("Preparing to quit...");
  saveConfigSync();
  saveGDTSync();
  saveJDTSync();
  saveMirrorSync();
  console.log("All chunks are saved.");
}
