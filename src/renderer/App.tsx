import {
  AppBar,
  Box,
  createStyles,
  Drawer,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  Build,
  Code,
  Dns,
  FlightTakeoff,
  GetApp,
  Help,
  Home,
  Info,
  Menu,
  PowerSettingsNew,
  Refresh,
  Settings,
  ShowChart,
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
import { handleDnD } from "../modules/dnd/DnDCenter";
import {
  saveResolveLock,
  saveResolveLockSync,
} from "../modules/download/ResolveLock";
import { saveJDT, saveJDTSync } from "../modules/java/JInfo";
import { waitUpdateFinished } from "../modules/selfupdate/Updator";
import { saveServers, saveServersSync } from "../modules/server/ServerFiles";
import { ContainerManager } from "./ContainerManager";
import { CrashReportDisplay } from "./CrashReportDisplay";
import { waitInstDone } from "./FirstRunSetup";
import {
  canGoBack,
  CHANGE_PAGE_WARN,
  goBack,
  jumpTo,
  setChangePageWarn,
  triggerSetPage,
} from "./GoTo";
import { InstallCore } from "./InstallCore";
import { Instruction, isInstBusy, startInst } from "./Instruction";
import { JavaSelector } from "./JavaSelector";
import { LaunchPad } from "./LaunchPad";
import { YNDialog2 } from "./OperatingHint";
import { OptionsPage } from "./Options";
import { PffFront } from "./PffFront";
import { ReadyToLaunch } from "./ReadyToLaunch";
import { ServerList } from "./ServerList";
import { saveStatistics, Statistics } from "./Statistics";
import { tr } from "./Translator";
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
  const [openDrawer, setOpenDrawer] = useState(false);
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
      jumpTo(getString("startup-page.url", "/Welcome"));
      triggerSetPage(getString("startup-page.name", "Welcome"));
    }
  }, [window.location.hash]);
  useEffect(() => {
    if (getBoolean("interactive.assistant?")) {
      if (page.length > 0 && !isInstBusy()) {
        if (window.localStorage.getItem("Instruction.Read." + page) !== "1") {
          const k = `Instruction.${page}.0`;
          if (tr(k) !== k) {
            startInst(page);
            void (async (p) => {
              await waitInstDone();
              window.localStorage.setItem("Instruction.Read." + p, "1");
            })(page);
          }
        }
      }
    }
  }, [page]);
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
            if (enteredCommand === "/") {
              setShowCommand(false);
              window.sessionStorage.removeItem("isCommand");
            } else {
              setEnteredCommand(enteredCommand.slice(0, -1));
            }
            return;
          }
          if (e.key === "Enter") {
            window.dispatchEvent(
              new CustomEvent("AlicornCommand", { detail: enteredCommand })
            );
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

          jumpTo("/AccountManager/1/" + encodeURIComponent(server));
          triggerSetPage("AccountManager");

          window.dispatchEvent(
            new CustomEvent("YggdrasilAccountInfoDropped", {
              detail: decodeURIComponent(server),
            })
          );
          return;
        }
        void handleDnD(e);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDragEnter={(e) => {
        e.dataTransfer.dropEffect = "copy";
      }}
    >
      <AppBar>
        <Toolbar
          onMouseDown={
            getString("frame.drag-impl") === "Delta" ? onMouseDown : undefined
          }
        >
          <IconButton
            style={{
              display: showCommand ? "none" : undefined,
              marginRight: "6px",
            }}
            onClick={() => {
              if (!showCommand) {
                setOpenDrawer(true);
              }
            }}
          >
            <Menu />
          </IconButton>
          <Box
            className={
              classes.title +
              (getString("frame.drag-impl") === "Webkit" ? " window-drag" : "")
            }
          >
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
          <Box
            style={
              showCommand || window.location.hash.includes("QuickSetup")
                ? { display: "none" }
                : {}
            }
          >
            {canGoBack() ? (
              <Tooltip title={tr("MainMenu.GoBack")}>
                <IconButton
                  color={"inherit"}
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
              color={"secondary"}
              className={classes.floatMore}
              size={"medium"}
              onClick={() => {
                void shell.openExternal("https://almc.pages.dev");
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
            <Tooltip title={tr("MainMenu.QuickOptions")}>
              <IconButton
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
            {getBoolean("dev") ? (
              <Tooltip title={tr("MainMenu.Browser")}>
                <IconButton
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
                className={classes.floatButton}
                onClick={() => {
                  jumpTo("/AccountManager");
                  triggerSetPage("AccountManager");
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
                  triggerSetPage("ContainerManager");
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
                  triggerSetPage("InstallCore");
                }}
                color={"inherit"}
              >
                <GetApp />
              </IconButton>
            </Tooltip>
            <Fab
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
        <Instruction />
        <Route path={"/LaunchPad/:server?"} component={LaunchPad} />
        <Route path={"/InstallCore"} component={InstallCore} />
        <Route
          path={"/ReadyToLaunch/:container/:id/:server?"}
          component={ReadyToLaunch}
        />
        <Route path={"/Version"} component={VersionView} />
        <Route
          path={"/ContainerManager/:modpack?"}
          component={ContainerManager}
        />
        <Route
          path={"/AccountManager/:adding?/:server?"}
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
        <Route path={"/ServerList"} component={ServerList} />
        <Route path={"/UtilitiesIndex"} component={UtilitiesIndex} />
        <Route path={"/Utilities/NetCheck"} component={NetCheck} />
        <Route path={"/Utilities/CutieConnect"} component={CutieConnet} />
        <Route path={"/Utilities/BuildUp"} component={BuildUp} />
        <Route path={"/Utilities/PffVisual"} component={PffVisual} />
        <Route
          path={"/Utilities/CarouselBoutique"}
          component={CarouselBoutique}
        />
        <Route path={"/Statistics"} component={Statistics} />
      </Box>
      <PagesDrawer
        open={openDrawer}
        onClose={() => {
          setOpenDrawer(false);
        }}
      />
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
          zIndex: 999,
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
          zIndex: 999,
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
          zIndex: 999,
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

const PAGES_ICONS_MAP: Record<string, JSX.Element> = {
  LaunchPad: <FlightTakeoff />,
  Welcome: <Home />,
  InstallCore: <GetApp />,
  ContainerManager: <AllInbox />,
  JavaSelector: <ViewModule />,
  AccountManager: <AccountCircle />,
  ServerList: <Dns />,
  UtilitiesIndex: <Build />,
  Statistics: <ShowChart />,
  Options: <Settings />,
  Version: <Info />,
};

function PagesDrawer(props: {
  open: boolean;
  onClose: () => unknown;
}): JSX.Element {
  return (
    <Drawer anchor={"left"} open={props.open} onClose={props.onClose}>
      <List>
        {Object.entries(PAGES_ICONS_MAP).map(([p, i]) => {
          return (
            <ListItem
              key={p}
              onClick={() => {
                props.onClose();
                jumpTo("/" + p);
                triggerSetPage(p);
              }}
              button
            >
              <ListItemIcon>{i}</ListItemIcon>
              <ListItemText>{tr(p)}</ListItemText>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
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

function handleDrag(name: string): (e: React.DragEvent) => void {
  return (e) => {
    console.log("Dragging " + name);
    e.dataTransfer.setData("text/x-alicorn-remove-btn", name);
    e.dataTransfer.dropEffect = "move";
  };
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
  saveStatistics();
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
  saveStatistics();
  console.log("All chunks are saved.");
}

let animationId: number | null = null;
let mouseX: number | null = null;
let mouseY: number | null = null;

function onMouseDown(e: React.MouseEvent) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  document.addEventListener("mouseup", onMouseUp);
  requestAnimationFrame(moveWindow);
}

function onMouseUp() {
  document.removeEventListener("mouseup", onMouseUp);
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
}

function moveWindow() {
  ipcRenderer.send("windowMoving", { mouseX, mouseY });
  animationId = requestAnimationFrame(moveWindow);
}
