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
import {
  AccountCircle,
  AllInbox,
  Code,
  FlightTakeoff,
  GetApp,
  Info,
  PowerSettingsNew,
  WebAsset,
} from "@material-ui/icons";
import { LaunchPad } from "./LaunchPad";
import { tr } from "./Translator";
import { Route } from "react-router";
import { CoreDetail } from "./CoreDetailView";
import { ReadyToLaunch } from "./ReadyToLaunch";
import { saveVFSync } from "../modules/container/ValidateRecord";
import { VersionView } from "./VersionView";
import { ContainerManager } from "./ContainerManager";
import { InstallCore } from "./InstallCore";
import { AccountManager } from "./AccountManager";
import { Terminal } from "./Terminal";

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
  const [page, setPage] = useState(Pages.Version.toString());
  useEffect(() => {
    if (!EVENT_LISTENED_FLAG) {
      EVENT_LISTENED_FLAG = true;
      document.addEventListener("setPage", (e) => {
        setPage(String(safeGet(e, ["detail"], Pages.Version)));
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
          <Tooltip title={tr("MainMenu.OpenDevTools")}>
            <IconButton
              color={"inherit"}
              className={classes.floatButton}
              onClick={() => {
                remoteOpenDevTools();
              }}
            >
              <Code />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr("MainMenu.Version")}>
            <IconButton
              className={classes.floatButton}
              onClick={() => {
                jumpTo("/Version");
                triggerSetPage(Pages.Version);
              }}
              color={"inherit"}
            >
              <Info />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr("MainMenu.QuickTerminal")}>
            <IconButton
              className={classes.floatButton}
              onClick={() => {
                jumpTo("/Terminal");
                triggerSetPage(Pages.Terminal);
              }}
              color={"inherit"}
            >
              <WebAsset />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr("MainMenu.QuickManageAccount")}>
            <IconButton
              className={classes.floatButton}
              onClick={() => {
                jumpTo("/AccountManager");
                triggerSetPage(Pages.AccountManager);
              }}
              color={"inherit"}
            >
              <AccountCircle />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr("MainMenu.QuickManageContainer")}>
            <IconButton
              className={classes.floatButton}
              onClick={() => {
                jumpTo("/ContainerManager");
                triggerSetPage(Pages.ContainerManager);
              }}
              color={"inherit"}
            >
              <AllInbox />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr("MainMenu.QuickInstallCore")}>
            <IconButton
              className={classes.floatButton}
              onClick={() => {
                jumpTo("/InstallCore");
                triggerSetPage(Pages.InstallCore);
              }}
              color={"inherit"}
            >
              <GetApp />
            </IconButton>
          </Tooltip>

          <Tooltip title={tr("MainMenu.QuickLaunchPad")}>
            <IconButton
              color={"inherit"}
              className={classes.floatButton}
              onClick={() => {
                jumpTo("/LaunchPad");
                triggerSetPage(Pages.LaunchPad);
              }}
            >
              <FlightTakeoff />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr("MainMenu.Exit")}>
            <IconButton
              className={classes.exitButton}
              onClick={remoteCloseWindow}
              color={"inherit"}
            >
              <PowerSettingsNew />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box className={classes.content}>
        <Route path={"/"} component={VersionView} exact />
        <Route path={"/LaunchPad"} component={LaunchPad} />
        <Route path={"/InstallCore"} component={InstallCore} />
        <Route path={"/CoreDetail/:container/:id"} component={CoreDetail} />
        <Route
          path={"/ReadyToLaunch/:container/:id"}
          component={ReadyToLaunch}
        />
        <Route path={"/Version"} component={VersionView} />
        <Route path={"/ContainerManager"} component={ContainerManager} />
        <Route path={"/AccountManager"} component={AccountManager} />
        <Route path={"/Terminal"} component={Terminal} />
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
  saveVFSync();
  console.log("All chunks are saved.");
}
