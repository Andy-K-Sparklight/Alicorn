import React, { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  createStyles,
  IconButton,
  makeStyles,
  Snackbar,
  Toolbar,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { ipcRenderer } from "electron";
import {
  CHANGE_PAGE_WARN,
  jumpTo,
  Pages,
  setChangePageWarn,
  triggerSetPage,
} from "./GoTo";
import { safeGet } from "../modules/commons/Null";
import {
  getBoolean,
  getString,
  saveConfig,
  saveConfigSync,
} from "../modules/config/ConfigSupport";
import { saveGDT, saveGDTSync } from "../modules/container/ContainerUtil";
import { saveJDT, saveJDTSync } from "../modules/java/JInfo";
import {
  AccountCircle,
  AllInbox,
  Apps,
  Code,
  FlightTakeoff,
  GetApp,
  Info,
  PowerSettingsNew,
  Settings,
  Web,
} from "@material-ui/icons";
import { LaunchPad } from "./LaunchPad";
import { tr } from "./Translator";
import { Route } from "react-router";
import { ReadyToLaunch } from "./ReadyToLaunch";
import { saveVF, saveVFSync } from "../modules/container/ValidateRecord";
import { VersionView } from "./VersionView";
import { ContainerManager } from "./ContainerManager";
import { InstallCore } from "./InstallCore";
import { YggdrasilAccountManager } from "./YggdrasilAccountManager";
import { JavaSelector } from "./JavaSelector";
import { OptionsPage } from "./Options";
import { CrashReportDisplay } from "./CrashReportDisplay";
import {
  saveResolveLock,
  saveResolveLockSync,
} from "../modules/download/ResolveLock";
import { PffFront } from "./PffFront";
import { Welcome } from "./Welcome";
import { YNDialog2 } from "./OperatingHint";

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      width: "100%",
      backgroundColor: theme.palette.secondary.light,
    },
    content: {
      marginTop: theme.spacing(4),
    },
    exitButton: {
      marginRight: 0,
    },
    floatButton: {
      float: "right",
      marginRight: 0,
    },
    title: {
      flexGrow: 1,
    },
  })
);

export function App(): JSX.Element {
  const classes = useStyles();
  const [page, setPage] = useState(Pages.Welcome.toString());
  const [openNotice, setNoticeOpen] = useState(false);
  const [openChangePageWarn, setOpenChangePageWarn] = useState(false);
  const [pageTarget, setPageTarget] = useState("");
  const [jumpPageTarget, setJumpPageTarget] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    window.addEventListener("changePageWarn", (e) => {
      console.log("Change page warn triggered.");
      setOpenChangePageWarn(true);
      setJumpPageTarget(String(safeGet(e, ["detail"], Pages.Welcome)));
    });
  }, []);
  useEffect(() => {
    document.addEventListener("setPage", (e) => {
      // @ts-ignore
      if (window[CHANGE_PAGE_WARN]) {
        setPageTarget(String(safeGet(e, ["detail"], Pages.Welcome)));
        return;
      }
      setPage(String(safeGet(e, ["detail"], Pages.Welcome)));
    });
  }, []);
  useEffect(() => {
    const id = setInterval(async () => {
      await intervalSaveData();
    }, 300000);
    return () => {
      clearInterval(id);
    };
  }, []);
  useEffect(() => {
    window.addEventListener("sysError", (e) => {
      setErr(String(safeGet(e, ["detail"], "Unknown Error")));
      setNoticeOpen(true);
      ipcRenderer.send(
        "reportError",
        String(safeGet(e, ["detail"], "Unknown Error"))
      );
    });
  }, []);
  return (
    <Box className={classes.root}>
      <AppBar>
        <Toolbar>
          <Box className={"window-drag" + " " + classes.title}>
            {/* Drag our window with title */}
            <Typography variant={"h6"}>{tr(page)}</Typography>
          </Box>
          <Tooltip
            title={
              getBoolean("dev")
                ? tr("MainMenu.OpenDevToolsFormal")
                : tr("MainMenu.OpenDevToolsKidding")
            }
          >
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
          <Tooltip title={tr("MainMenu.QuickOptions")}>
            <IconButton
              className={classes.floatButton}
              onClick={() => {
                jumpTo("/Options");
                triggerSetPage(Pages.Options);
              }}
              color={"inherit"}
            >
              <Settings />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr("MainMenu.QuickJavaSelector")}>
            <IconButton
              className={classes.floatButton}
              onClick={() => {
                jumpTo("/JavaSelector");
                triggerSetPage(Pages.JavaSelector);
              }}
              color={"inherit"}
            >
              <Apps />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr("MainMenu.Browser")}>
            <IconButton
              className={classes.floatButton}
              onClick={() => {
                (async () => {
                  await ipcRenderer.invoke(
                    "openBrowser",
                    getBoolean("web.allow-natives"),
                    getString("web.global-proxy")
                  );
                })();
              }}
              color={"inherit"}
            >
              <Web />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr("MainMenu.QuickManageAccount")}>
            <IconButton
              className={classes.floatButton}
              onClick={() => {
                jumpTo("/YggdrasilAccountManager");
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
        <Route path={"/"} component={Welcome} exact />
        <Route path={"/LaunchPad"} component={LaunchPad} />
        <Route path={"/InstallCore"} component={InstallCore} />
        <Route
          path={"/ReadyToLaunch/:container/:id/:server?"}
          component={ReadyToLaunch}
        />
        <Route path={"/Version"} component={VersionView} />
        <Route path={"/ContainerManager"} component={ContainerManager} />
        <Route
          path={"/YggdrasilAccountManager"}
          component={YggdrasilAccountManager}
        />
        <Route path={"/JavaSelector"} component={JavaSelector} />
        <Route path={"/Options"} component={OptionsPage} />
        <Route path={"/CrashReportDisplay"} component={CrashReportDisplay} />
        <Route path={"/PffFront/:container/:version"} component={PffFront} />
        <Route path={"/Welcome"} component={Welcome} />
      </Box>

      <YNDialog2
        onClose={() => {
          setOpenChangePageWarn(false);
        }}
        open={openChangePageWarn}
        onAccept={() => {
          setChangePageWarn(false);
          jumpTo(jumpPageTarget);
          triggerSetPage(pageTarget);
        }}
        title={tr("System.JumpPageWarn.Title")}
        content={tr("System.JumpPageWarn.Description")}
        yes={tr("System.JumpPageWarn.Yes")}
        no={tr("System.JumpPageWarn.No")}
      />

      <Snackbar
        open={openNotice}
        style={{
          width: "90%",
        }}
        message={tr("System.Error") + err}
        autoHideDuration={10000}
        onClose={() => {
          setNoticeOpen(false);
        }}
      />
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
  saveVFSync();
  saveResolveLockSync();
  console.log("All chunks are saved.");
}

async function intervalSaveData(): Promise<void> {
  console.log("Saving data...");
  await saveConfig();
  await saveGDT();
  await saveJDT();
  await saveVF();
  await saveResolveLock();
  console.log("All chunks are saved.");
}
