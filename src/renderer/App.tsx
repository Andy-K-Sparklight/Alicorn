import {
  AppBar,
  Box,
  createStyles,
  Fab,
  IconButton,
  makeStyles,
  Snackbar,
  Toolbar,
  Tooltip,
  Typography,
} from "@material-ui/core";
import {
  AccountCircle,
  AllInbox,
  ArrowBack,
  ArrowForward,
  Build,
  Code,
  Dns,
  FlightTakeoff,
  GetApp,
  Help,
  Info,
  PowerSettingsNew,
  Refresh,
  Settings,
  ViewModule,
  Web,
} from "@material-ui/icons";
import { Alert } from "@material-ui/lab";
import { ipcRenderer, shell } from "electron";
import React, { useEffect, useRef, useState } from "react";
import { Route } from "react-router-dom";
import { safeGet } from "../modules/commons/Null";
import {
  getBoolean,
  getString,
  saveConfig,
  saveConfigSync,
} from "../modules/config/ConfigSupport";
import { saveGDT, saveGDTSync } from "../modules/container/ContainerUtil";
import { saveVF, saveVFSync } from "../modules/container/ValidateRecord";
import {
  saveResolveLock,
  saveResolveLockSync,
} from "../modules/download/ResolveLock";
import { saveJDT, saveJDTSync } from "../modules/java/JInfo";
import { waitUpdateFinished } from "../modules/selfupdate/Updator";
import { saveServers, saveServersSync } from "../modules/server/ServerFiles";
import { ContainerManager } from "./ContainerManager";
import { CrashReportDisplay } from "./CrashReportDisplay";
import {
  canGoBack,
  CHANGE_PAGE_WARN,
  goBack,
  jumpTo,
  setChangePageWarn,
  triggerSetPage,
} from "./GoTo";
import { InstallCore } from "./InstallCore";
import { JavaSelector } from "./JavaSelector";
import { LaunchPad } from "./LaunchPad";
import { YNDialog2 } from "./OperatingHint";
import { OptionsPage } from "./Options";
import { PffFront } from "./PffFront";
import { QuickSetup } from "./QuickSetup";
import { ReadyToLaunch } from "./ReadyToLaunch";
import { ServerList } from "./ServerList";
import { tr } from "./Translator";
import { getNextTutorName, isShow, isTutor, Tutor } from "./Tutor";
import { BuildUp } from "./utilities/BuildUp";
import { CarouselBoutique } from "./utilities/CarouselBoutique";
import { CutieConnet } from "./utilities/CutieConnect";
import { NetCheck } from "./utilities/NetCheck";
import { PffVisual } from "./utilities/PffVisual";
import { UtilitiesIndex } from "./utilities/UtilitiesIndex";
import { VersionView } from "./VersionView";
import { Welcome } from "./Welcome";
import { YggdrasilAccountManager } from "./YggdrasilAccountManager";

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      width: "100%",
      backgroundColor: theme.palette.secondary.light,
    },
    content: {
      marginLeft: theme.spacing(4),
      marginRight: theme.spacing(4),
      marginTop: theme.spacing(4),
    },
    buttonText: {
      marginRight: theme.spacing(1),
    },
    exitButton: {
      marginRight: 0,
    },
    floatMore: {
      marginRight: 0,
      marginLeft: theme.spacing(0.8),
    },
    floatButton: {
      marginRight: theme.spacing(-0.8),
    },
    title: {
      flexGrow: 1,
    },
  })
);

export function App(): JSX.Element {
  const classes = useStyles();
  const [page, setPage] = useState(getString("startup-page.name", "Tutor"));
  const [enteredCommand, setEnteredCommand] = useState("/");
  const [showCommand, setShowCommand] = useState(false);
  const [openNotice, setNoticeOpen] = useState(false);
  const [openWarn, setWarnOpen] = useState(false);
  const [openChangePageWarn, setOpenChangePageWarn] = useState(false);
  const [pageTarget, setPageTarget] = useState("");
  const [jumpPageTarget, setJumpPageTarget] = useState("");
  const [haveHistory, setHaveHistory] = useState(false);
  const [err, setErr] = useState("");
  const [warn, setWarn] = useState("");
  const [info, setInfo] = useState("");
  const [openInfo, setInfoOpen] = useState(false);
  const [openSucc, setSuccOpen] = useState(false);
  const [succ, setSucc] = useState("");
  const [refreshBit, setRefreshBit] = useState(false);
  const sessionID = useRef(0);
  const clearSnacks = () => {
    setInfoOpen(false);
    setSuccOpen(false);
    setWarnOpen(false);
    setNoticeOpen(false);
    sessionID.current++;
  };
  useEffect(() => {
    if (window.location.hash === "#/") {
      jumpTo(getString("startup-page.url", "/Tutor/1"));
      triggerSetPage(getString("startup-page.name", "Tutor"));
    }
  }, [window.location.hash]);
  useEffect(() => {
    const fun = (_e: Event) => {
      setRefreshBit(!refreshBit);
    };
    window.addEventListener("refreshApp", fun);
    return () => {
      window.removeEventListener("refreshApp", fun);
    };
  });
  useEffect(() => {
    window.addEventListener("changePageWarn", (e) => {
      setOpenChangePageWarn(true);
      const s = safeGet(e, ["detail"], {});
      // @ts-ignore
      const target = String(s.target || "");
      // @ts-ignore
      const history = !!s.history;
      setHaveHistory(history);
      setJumpPageTarget(target);
    });
    window.addEventListener("changePageWarnTitle", (e) => {
      setPageTarget(String(safeGet(e, ["detail"], "Welcome")));
    });
  }, []);
  useEffect(() => {
    document.addEventListener("setPage", (e) => {
      // @ts-ignore
      if (window[CHANGE_PAGE_WARN]) {
        setPageTarget(String(safeGet(e, ["detail"], "Welcome")));
        return;
      }
      setPage(String(safeGet(e, ["detail"], "Welcome")));
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
      clearSnacks();
      setNoticeOpen(true);
      ipcRenderer.send(
        "reportError",
        String(safeGet(e, ["detail"], "Unknown Error"))
      );
    });
    window.addEventListener("sysWarn", (e) => {
      setWarn(String(safeGet(e, ["detail"], "Unknown Warning")));
      clearSnacks();
      setWarnOpen(true);
    });
    window.addEventListener("sysInfo", (e) => {
      setInfo(String(safeGet(e, ["detail"], "")));
      clearSnacks();
      setInfoOpen(true);
    });
    window.addEventListener("sysSucc", (e) => {
      setSucc(String(safeGet(e, ["detail"], "")));
      clearSnacks();
      setSuccOpen(true);
    });
  }, []);

  useEffect(() => {
    const fun = (e: KeyboardEvent) => {
      if (getBoolean("command")) {
        if (e.key === "/") {
          setEnteredCommand("/"); // Clear on "/"
          setShowCommand(true);
          window.sessionStorage.setItem("isCommand", "1");
          return;
        }
        if (showCommand) {
          if (e.key === "Delete") {
            if (showCommand) {
              if (enteredCommand === "/") {
                setShowCommand(false);
                window.sessionStorage.removeItem("isCommand");
              } else {
                setEnteredCommand(enteredCommand.slice(0, -1));
              }
            }
            return;
          }
          if (e.key === "Enter") {
            if (showCommand) {
              window.dispatchEvent(
                new CustomEvent("AlicornCommand", { detail: enteredCommand })
              );
            }
            setEnteredCommand("/");
            setShowCommand(false);
            window.sessionStorage.removeItem("isCommand");
            return;
          }
          setEnteredCommand(enteredCommand + e.key);
        }
      }
    };
    const f1 = () => {
      if (showCommand) {
        setEnteredCommand(enteredCommand + " ");
      }
    };
    window.addEventListener("keypress", fun);
    window.addEventListener("HelpSpace", f1);
    return () => {
      window.removeEventListener("keypress", fun);
      window.removeEventListener("HelpSpace", f1);
    };
  });
  return (
    <Box
      className={classes.root}
      onDrop={(e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        if (data.toString().includes("authlib-injector")) {
          const server = data
            .toString()
            .split("authlib-injector:yggdrasil-server:")[1];

          jumpTo("/YggdrasilAccountManager/1/" + server);
          triggerSetPage("AccountManager");

          window.dispatchEvent(
            new CustomEvent("YggdrasilAccountInfoDropped", {
              detail: decodeURIComponent(server),
            })
          );
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
    >
      <AppBar>
        <Toolbar>
          <Box className={"window-drag" + " " + classes.title}>
            {/* Drag our window with title */}
            <Typography
              variant={"h6"}
              style={
                showCommand
                  ? {
                      fontSize:
                        window.sessionStorage.getItem("smallFontSize") ||
                        "16px",
                    }
                  : {}
              }
            >
              {showCommand ? enteredCommand : tr(page)}
            </Typography>
          </Box>
          <Box style={showCommand ? { display: "none" } : {}}>
            <Tooltip title={tr("MainMenu.NextTutorPage")}>
              <IconButton
                style={isTutor() ? {} : { display: "none" }}
                color={"inherit"}
                className={classes.floatButton}
                onClick={() => {
                  jumpTo("/Tutor/" + getNextTutorName());
                  triggerSetPage("Tutor");
                }}
              >
                <ArrowForward />
              </IconButton>
            </Tooltip>
            {canGoBack() ? (
              <Tooltip title={tr("MainMenu.GoBack")}>
                <IconButton
                  color={"inherit"}
                  style={genHideStyles("GoBack")}
                  className={classes.floatButton}
                  onClick={() => {
                    goBack();
                  }}
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>
            ) : (
              ""
            )}
            <Fab
              variant={"extended"}
              style={genHideStyles("Help")}
              color={"secondary"}
              className={classes.floatMore}
              size={"medium"}
              onClick={() => {
                void shell.openExternal("https://al.xuogroup.top/faq/");
              }}
            >
              <Help className={classes.buttonText} />
              {tr("MainMenu.Help")}
            </Fab>
            {getBoolean("dev") ? (
              <Tooltip title={tr("MainMenu.Reload")}>
                <IconButton
                  color={"inherit"}
                  className={classes.floatButton}
                  onClick={() => {
                    window.location.hash = "";
                    window.location.reload();
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            ) : (
              ""
            )}
            {getBoolean("dev") ? (
              <Tooltip title={tr("MainMenu.OpenDevToolsFormal")}>
                <IconButton
                  style={genHideStyles("Dev")}
                  color={"inherit"}
                  className={classes.floatButton}
                  onClick={() => {
                    remoteOpenDevTools();
                  }}
                >
                  <Code />
                </IconButton>
              </Tooltip>
            ) : (
              ""
            )}

            <Tooltip title={tr("MainMenu.UtilitiesIndex")}>
              <IconButton
                style={genHideStyles("UtilitiesIndex")}
                color={"inherit"}
                className={classes.floatButton}
                onClick={() => {
                  jumpTo("/UtilitiesIndex");
                  triggerSetPage("UtilitiesIndex");
                }}
              >
                <Build />
              </IconButton>
            </Tooltip>
            <Tooltip title={tr("MainMenu.Version")}>
              <IconButton
                style={genHideStyles("Version")}
                className={classes.floatButton}
                onClick={() => {
                  jumpTo("/Version");
                  triggerSetPage("Version");
                }}
                color={"inherit"}
              >
                <Info />
              </IconButton>
            </Tooltip>
            <Tooltip title={tr("MainMenu.QuickOptions")}>
              <IconButton
                style={genHideStyles("Options")}
                className={classes.floatButton}
                onClick={() => {
                  jumpTo("/Options");
                  triggerSetPage("Options");
                }}
                color={"inherit"}
              >
                <Settings />
              </IconButton>
            </Tooltip>
            <Tooltip title={tr("MainMenu.QuickJavaSelector")}>
              <IconButton
                style={genHideStyles("JavaSelector")}
                className={classes.floatButton}
                onClick={() => {
                  jumpTo("/JavaSelector");
                  triggerSetPage("JavaSelector");
                }}
                color={"inherit"}
              >
                <ViewModule />
              </IconButton>
            </Tooltip>
            {getBoolean("dev.experimental") ? (
              <Tooltip title={tr("MainMenu.QuickServerList")}>
                <IconButton
                  style={genHideStyles("ServerList")}
                  className={classes.floatButton}
                  onClick={() => {
                    jumpTo("/ServerList");
                    triggerSetPage("ServerList");
                  }}
                  color={"inherit"}
                >
                  <Dns />
                </IconButton>
              </Tooltip>
            ) : (
              ""
            )}
            {getBoolean("dev") ? (
              <Tooltip title={tr("MainMenu.Browser")}>
                <IconButton
                  style={genHideStyles("Browser")}
                  className={classes.floatButton}
                  onClick={() => {
                    void (async () => {
                      await ipcRenderer.invoke(
                        "openBrowser",
                        false,
                        getString("web.global-proxy")
                      );
                    })();
                  }}
                  color={"inherit"}
                >
                  <Web />
                </IconButton>
              </Tooltip>
            ) : (
              ""
            )}

            <Tooltip title={tr("MainMenu.QuickManageAccount")}>
              <IconButton
                style={genHideStyles("AccountManager")}
                className={classes.floatButton}
                onClick={() => {
                  jumpTo("/YggdrasilAccountManager");
                  triggerSetPage("AccountManager");
                }}
                color={"inherit"}
              >
                <AccountCircle />
              </IconButton>
            </Tooltip>
            <Tooltip title={tr("MainMenu.QuickManageContainer")}>
              <IconButton
                style={genHideStyles("ContainerManager")}
                className={classes.floatButton}
                onClick={() => {
                  jumpTo("/ContainerManager");
                  triggerSetPage("ContainerManager");
                }}
                color={"inherit"}
              >
                <AllInbox />
              </IconButton>
            </Tooltip>
            <Tooltip title={tr("MainMenu.QuickInstallCore")}>
              <IconButton
                style={genHideStyles("InstallCore")}
                className={classes.floatButton}
                onClick={() => {
                  jumpTo("/InstallCore");
                  triggerSetPage("InstallCore");
                }}
                color={"inherit"}
              >
                <GetApp />
              </IconButton>
            </Tooltip>
            <Fab
              style={genHideStyles("LaunchPad")}
              color={"secondary"}
              variant={"extended"}
              size={"medium"}
              className={classes.floatMore}
              onClick={() => {
                jumpTo("/LaunchPad");
                triggerSetPage("LaunchPad");
              }}
            >
              <FlightTakeoff className={classes.buttonText} />
              {tr("LaunchPad")}
            </Fab>
            <Tooltip title={tr("MainMenu.Exit")}>
              <IconButton
                style={genHideStyles("Exit")}
                className={classes.exitButton}
                onClick={() => {
                  remoteHideWindow();
                  waitUpdateFinished(() => {
                    remoteCloseWindow();
                  });
                }}
                color={"inherit"}
              >
                <PowerSettingsNew />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Box className={classes.content + " yggdrasil_droppable"} id={"app_main"}>
        <Route path={"/LaunchPad/:server?"} component={LaunchPad} />
        <Route path={"/InstallCore"} component={InstallCore} />
        <Route
          path={"/ReadyToLaunch/:container/:id/:server?"}
          component={ReadyToLaunch}
        />
        <Route path={"/Version"} component={VersionView} />
        <Route path={"/ContainerManager"} component={ContainerManager} />
        <Route
          path={"/YggdrasilAccountManager/:adding?/:server?"}
          component={YggdrasilAccountManager}
        />
        <Route path={"/JavaSelector"} component={JavaSelector} />
        <Route path={"/Options"} component={OptionsPage} />
        <Route path={"/CrashReportDisplay"} component={CrashReportDisplay} />
        <Route
          path={"/PffFront/:container/:version/:loader/:name?/:autostart?"}
          component={PffFront}
        />
        <Route path={"/Welcome"} component={Welcome} />
        <Route path={"/Tutor/:page"} component={Tutor} />
        <Route path={"/ServerList"} component={ServerList} />
        <Route path={"/QuickSetup"} component={QuickSetup} />
        <Route path={"/UtilitiesIndex"} component={UtilitiesIndex} />
        <Route path={"/Utilities/NetCheck"} component={NetCheck} />
        <Route path={"/Utilities/CutieConnect"} component={CutieConnet} />
        <Route path={"/Utilities/BuildUp"} component={BuildUp} />
        <Route path={"/Utilities/PffVisual"} component={PffVisual} />
        <Route
          path={"/Utilities/CarouselBoutique"}
          component={CarouselBoutique}
        />
      </Box>

      <YNDialog2
        onClose={() => {
          setOpenChangePageWarn(false);
        }}
        open={openChangePageWarn}
        onAccept={() => {
          setChangePageWarn(false);
          jumpTo(jumpPageTarget, haveHistory);
          triggerSetPage(pageTarget, haveHistory);
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
        autoHideDuration={5000}
        onClose={(() => {
          const s = sessionID.current;
          return () => {
            if (sessionID.current === s) {
              setNoticeOpen(false);
            }
          };
        })()}
      >
        <Alert severity={"error"}>{err}</Alert>
      </Snackbar>
      <Snackbar
        open={openSucc}
        style={{
          width: "90%",
        }}
        autoHideDuration={5000}
        onClose={(() => {
          const s = sessionID.current;
          return () => {
            if (sessionID.current === s) {
              setSuccOpen(false);
            }
          };
        })()}
      >
        <Alert severity={"success"}>{succ}</Alert>
      </Snackbar>
      <Snackbar
        open={openWarn}
        style={{
          width: "90%",
        }}
        autoHideDuration={5000}
        onClose={(() => {
          const s = sessionID.current;
          return () => {
            if (sessionID.current === s) {
              setWarnOpen(false);
            }
          };
        })()}
      >
        <Alert severity={"warning"}>{warn}</Alert>
      </Snackbar>
      <Snackbar
        open={openInfo}
        style={{
          width: "90%",
        }}
        autoHideDuration={5000}
        onClose={(() => {
          const s = sessionID.current;
          return () => {
            if (sessionID.current === s) {
              setInfoOpen(false);
            }
          };
        })()}
      >
        <Alert severity={"info"}>{info}</Alert>
      </Snackbar>
    </Box>
  );
}
export function remoteHideWindow(): void {
  console.log("Preparing to exit!");
  ipcRenderer.send("hideWindow");
}

export function remoteCloseWindow(): void {
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
  saveServersSync();
  console.log("All chunks are saved.");
}

async function intervalSaveData(): Promise<void> {
  console.log("Saving data...");
  await saveConfig();
  await saveGDT();
  await saveJDT();
  await saveVF();
  await saveResolveLock();
  await saveServers();
  console.log("All chunks are saved.");
}

function genHideStyles(name: string): React.CSSProperties {
  if (!isTutor()) {
    return {};
  }
  if (isShow(name)) {
    return {};
  } else {
    return { display: "none" };
  }
}
