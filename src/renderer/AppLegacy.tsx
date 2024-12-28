import {
    AccountCircle,
    AllInbox,
    ArrowBack,
    Code,
    FlightTakeoff,
    GetApp,
    Handyman,
    Home as HomeIcon,
    ImportContacts,
    Info,
    ManageAccounts,
    Menu,
    PowerSettingsNew,
    Refresh,
    Settings,
    ViewModule
} from "@mui/icons-material";
import {
    Alert,
    AppBar,
    Box,
    Chip,
    ClassNameMap,
    Container,
    Drawer,
    Fab,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Snackbar,
    Toolbar,
    Tooltip,
    Typography
} from "@mui/material";
import { Route, Switch } from "wouter";
import { makeStyles } from "@mui/styles";
import { ipcRenderer } from "electron";
import React, { useEffect, useRef, useState } from "react";
import pkg from "../../package.json";
import { safeGet } from "@/modules/commons/Null";
import { getBoolean, getString, saveConfig } from "@/modules/config/ConfigSupport";
import { saveGDT } from "@/modules/container/ContainerUtil";
import { saveVF } from "@/modules/container/ValidateRecord";
import { saveJDT } from "@/modules/java/JavaInfo";
import { waitUpdateFinished } from "@/modules/selfupdate/Updator";
import { ContainerManager } from "./ContainerManager";
import { CrashReportDisplay } from "./CrashReportDisplay";
import { canGoBack, CHANGE_PAGE_WARN, goBack, jumpTo, setChangePageWarn, triggerSetPage } from "./GoTo";
import { InstallCore } from "./InstallCore";
import { Instruction } from "./Instruction";
import { JavaSelector } from "./JavaSelector";
import { LaunchPad } from "./LaunchPad";
import { YNDialog2 } from "./OperatingHint";
import { OptionsPage } from "./Options";
import { ReadyToLaunch } from "./ReadyToLaunch";
import { saveStatistics } from "./Statistics";
import { AlicornTheme } from "./Stylex";
import { TheEndingOfTheEnd } from "./TheEndingOfTheEnd";
import { TipsOfToday } from "./TipsOfToday";
import { tr } from "./Translator";
import { UpdateHint } from "./UpdateHint";
import { VersionView } from "./VersionView";
import { Welcome } from "./Welcome";
import { YggdrasilAccountManager } from "./YggdrasilAccountManager";
import { Home } from "@/renderer/pages/Home";

const useStyles = makeStyles((theme: AlicornTheme) => ({
    root: {
        flexGrow: 1,
        width: "100%",
        backgroundColor: theme.palette.secondary.light
    },
    content: {
        marginTop: theme.spacing(3)
    },
    buttonText: {
        marginRight: theme.spacing(1)
    },
    exitButton: {
        marginRight: 0
    },
    floatMore: {
        marginRight: 0,
        marginLeft: theme.spacing(0.8)
    },
    floatButton: {
        marginRight: 0
    },
    title: {
        flexGrow: 1
    }
}));

export function AppLegacy(): JSX.Element {
    const classes = useStyles();
    const [page, setPage] = useState(getString("startup-page.name", "Tutor"));
    const [openErr, setErrOpen] = useState(false);
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
    const [_refreshBit, setRefreshBit] = useState(false);
    const [openDrawer, setOpenDrawer] = useState(false);
    const sessionID = useRef(0);
    const clearSnacks = () => {
        setInfoOpen(false);
        setSuccOpen(false);
        setWarnOpen(false);
        setErrOpen(false);
        sessionID.current++;
    };
    useEffect(gotoMainIfEmpty, [window.location.hash]);
    // useEffect(popupInstruction(page), [page]);
    useEffect(bindRefreshListener(setRefreshBit), []);
    useEffect(() => {
        ipcRenderer.addListener("menu-click", (_e, lb) => {
            jumpTo("/" + lb);
            triggerSetPage(lb);
        });
    }, []);
    useEffect(
        bindChangePageWarn(
            setOpenChangePageWarn,
            setHaveHistory,
            setJumpPageTarget,
            setPageTarget
        ),
        []
    );
    useEffect(bindChangePage(setPageTarget, setPage), []);
    // useEffect(answerOnQuit, []);
    useEffect(showUpdate, []);
    useEffect(timelySave, []);
    useEffect(
        bindMsgTips(
            setErr,
            setWarn,
            setInfo,
            setSucc,
            setErrOpen,
            setWarnOpen,
            setInfoOpen,
            setSuccOpen,
            clearSnacks
        ),
        []
    );

    clearBootStage();

    return (
        <Box
            className={classes.root}
            onDragOver={(e) => {
                e.preventDefault();
            }}
            onDragEnter={(e) => {
                e.dataTransfer.dropEffect = "copy";
            }}
        >
            <AppTopBar page={page} setOpenDrawer={setOpenDrawer} classes={classes}/>
            <Box className={classes.content + " yggdrasil_droppable"} id={"app_main"}>
                <>
                    <Routes/>
                    <Instruction/>
                </>
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
            <TipsOfToday/>
            <Snackbar
                open={openErr}
                autoHideDuration={10000}
                onClose={handleSnackCloseFactory(sessionID, setErrOpen)}
            >
                <Alert severity={"error"}>{err}</Alert>
            </Snackbar>
            <Snackbar
                open={openSucc}
                autoHideDuration={5000}
                onClose={handleSnackCloseFactory(sessionID, setSuccOpen)}
            >
                <Alert severity={"success"}>{succ}</Alert>
            </Snackbar>
            <Snackbar
                open={openWarn}
                autoHideDuration={8000}
                onClose={handleSnackCloseFactory(sessionID, setWarnOpen)}
            >
                <Alert severity={"warning"}>{warn}</Alert>
            </Snackbar>
            <Snackbar
                open={openInfo}
                autoHideDuration={5000}
                onClose={handleSnackCloseFactory(sessionID, setInfoOpen)}
            >
                <Alert severity={"info"}>{info}</Alert>
            </Snackbar>
        </Box>
    );
}

function timelySave() {
    const id = setInterval(async () => {
        await commitChanges();
    }, 300000);
    return () => {
        clearInterval(id);
    };
}

function bindChangePage(
    setPageTarget: React.Dispatch<React.SetStateAction<string>>,
    setPage: React.Dispatch<React.SetStateAction<string>>
) {
    return () => {
        const f = (e: Event) => {
            // @ts-ignore
            if (window[CHANGE_PAGE_WARN]) {
                setPageTarget(String(safeGet(e, ["detail"], "Welcome")));
                return;
            }
            setPage(String(safeGet(e, ["detail"], "Welcome")));
        };
        document.addEventListener("setPage", f);
        return () => {
            document.removeEventListener("setPage", f);
        };
    };
}

function answerOnQuit() {
}

function bindChangePageWarn(
    setOpenChangePageWarn: React.Dispatch<React.SetStateAction<boolean>>,
    setHaveHistory: React.Dispatch<React.SetStateAction<boolean>>,
    setJumpPageTarget: React.Dispatch<React.SetStateAction<string>>,
    setPageTarget: React.Dispatch<React.SetStateAction<string>>
) {
    return () => {
        const f1 = (e: Event) => {
            setOpenChangePageWarn(true);
            const s = safeGet(e, ["detail"], {});
            // @ts-ignore
            const target = String(s.target || "");
            // @ts-ignore
            const history = !!s.history;
            setHaveHistory(history);
            setJumpPageTarget(target);
        };
        window.addEventListener("changePageWarn", f1);
        const f = (e: Event) => {
            setPageTarget(String(safeGet(e, ["detail"], "Welcome")));
        };
        window.addEventListener("changePageWarnTitle", f);
        return () => {
            window.removeEventListener("changePageWarn", f1);
            window.removeEventListener("changePageWarnTitle", f);
        };
    };
}

function bindRefreshListener(
    setRefreshBit: React.Dispatch<React.SetStateAction<boolean>>
) {
    return () => {
        const fun = (_e: Event) => {
            setRefreshBit((o) => !o);
        };
        window.addEventListener("refreshApp", fun);
        return () => {
            window.removeEventListener("refreshApp", fun);
        };
    };
}

function handleSnackCloseFactory(
    sessionID: React.MutableRefObject<number>,
    op: React.Dispatch<React.SetStateAction<boolean>>
) {
    const s = sessionID.current;
    return () => {
        if (sessionID.current === s) {
            op(false);
        }
    };
}

function clearBootStage() {
    const bs = document.getElementById("boot_stages");
    if (bs) {
        bs.style.display = "none";
    }
    // @ts-ignore
    window.clearLogScreen();
}

function gotoMainIfEmpty() {
    if (window.location.hash === "#/" || window.location.hash === "") {
        jumpTo(getString("startup-page.url", "/Welcome"));
        triggerSetPage(getString("startup-page.name", "Welcome"));
    }
}

function showUpdate() {
    const o = parseInt(window.localStorage.getItem("LastVersion") || "");
    if (!isNaN(o)) {
        if (o < pkg.updatorVersion) {
            jumpTo("/UpdateHint");
            triggerSetPage("UpdateHint");
        }
    }
}

function bindMsgTips(
    setErr: React.Dispatch<React.SetStateAction<string>>,
    setWarn: React.Dispatch<React.SetStateAction<string>>,
    setInfo: React.Dispatch<React.SetStateAction<string>>,
    setSucc: React.Dispatch<React.SetStateAction<string>>,
    setErrOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setWarnOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setInfoOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setSuccOpen: React.Dispatch<React.SetStateAction<boolean>>,
    clearSnacks: () => void
) {
    return () => {
        const f3 = (e: Event) => {
            setErr(String(safeGet(e, ["detail"], "Unknown Error")));
            clearSnacks();
            setErrOpen(true);
        };
        window.addEventListener("sysError", f3);
        const f1 = (e: Event) => {
            setWarn(String(safeGet(e, ["detail"], "Unknown Warning")));
            clearSnacks();
            setWarnOpen(true);
        };
        window.addEventListener("sysWarn", f1);

        const f0 = (e: Event) => {
            setInfo(String(safeGet(e, ["detail"], "")));
            clearSnacks();
            setInfoOpen(true);
        };
        window.addEventListener("sysInfo", f0);

        const f = (e: Event) => {
            setSucc(String(safeGet(e, ["detail"], "")));
            clearSnacks();
            setSuccOpen(true);
        };
        window.addEventListener("sysSucc", f);
        return () => {
            window.removeEventListener("sysError", f3);
            window.removeEventListener("sysSucc", f);
            window.removeEventListener("sysInfo", f0);
            window.removeEventListener("sysWarn", f1);
        };
    };
}

// -------- Routes --------

function Routes(): JSX.Element {
    return (
        <Container>
            <Switch>
                <Route path={"/Home"} component={Home}/>
                <Route path={"/LaunchPad/:server?"} component={LaunchPad}/>
                <Route path={"/InstallCore"} component={InstallCore}/>
                <Route
                    path={"/ReadyToLaunch/:container/:id/:server?"}
                    component={ReadyToLaunch}
                />
                <Route path={"/Version"} component={VersionView}/>
                <Route
                    path={"/ContainerManager/:modpack?/:togo?"}
                    component={ContainerManager}
                />
                <Route
                    path={"/AccountManager/:adding?/:server?"}
                    component={YggdrasilAccountManager}
                />
                <Route path={"/JavaSelector"} component={JavaSelector}/>
                <Route path={"/Options"} component={OptionsPage}/>
                <Route path={"/CrashReportDisplay"} component={CrashReportDisplay}/>
                <Route path={"/Welcome"} component={Welcome}/>
                <Route path={"/TheEndingOfTheEnd"} component={TheEndingOfTheEnd}/>
                <Route path={"/UpdateHint"} component={UpdateHint}/>
            </Switch>
        </Container>
    );
}

// -------- AppBar --------
function AppTopBar(props: {
    page: string;
    classes: ClassNameMap;
    setOpenDrawer: (o: boolean) => void;
}): JSX.Element {
    const classes = props.classes;
    if (getString("frame.drag-impl") === "TitleBar") {
        return <></>;
    }
    return (
        <AppBar enableColorOnDark>
            <Toolbar>
                <IconButton
                    sx={{
                        marginRight: "0.3rem"
                    }}
                    color={"inherit"}
                    onClick={() => {
                        props.setOpenDrawer(true);
                    }}
                >
                    <Menu/>
                </IconButton>
                <Box className={classes.title}>
                    <Typography
                        variant={"h6"}
                        className={
                            getString("frame.drag-impl") === "Webkit" ? " window-drag" : ""
                        }
                        onMouseDown={
                            getString("frame.drag-impl") === "Delta" ? onMouseDown : undefined
                        }
                    >
                        {tr(props.page)}
                    </Typography>
                </Box>
                <Box
                    style={
                        window.location.hash.includes("QuickSetup")
                            ? { display: "none" }
                            : {}
                    }
                >
                    {canGoBack() ? (
                        <Tooltip
                            title={
                                <Typography className={"smtxt"}>
                                    {tr("MainMenu.GoBack")}
                                </Typography>
                            }
                        >
                            <IconButton
                                color={"inherit"}
                                className={classes.floatButton}
                                onClick={() => {
                                    goBack();
                                }}
                            >
                                <ArrowBack/>
                            </IconButton>
                        </Tooltip>
                    ) : (
                        ""
                    )}
                    {getBoolean("dev") ? (
                        <Tooltip
                            title={
                                <Typography className={"smtxt"}>
                                    {tr("MainMenu.Reload")}
                                </Typography>
                            }
                        >
                            <IconButton
                                color={"inherit"}
                                className={classes.floatButton}
                                onClick={() => {
                                    remoteHideWindow();
                                    waitUpdateFinished(() => {
                                        commitChanges()
                                            .then(() => {
                                                ipcRenderer.send("readyToClose");
                                                ipcRenderer.send("reload");
                                            })
                                            .catch(() => {
                                            });
                                    });
                                }}
                            >
                                <Refresh/>
                            </IconButton>
                        </Tooltip>
                    ) : (
                        ""
                    )}
                    {getBoolean("dev") ? (
                        <Tooltip
                            title={
                                <Typography className={"smtxt"}>
                                    {tr("MainMenu.OpenDevToolsFormal")}
                                </Typography>
                            }
                        >
                            <IconButton
                                color={"inherit"}
                                className={classes.floatButton}
                                onClick={() => {
                                    remoteOpenDevTools();
                                }}
                            >
                                <Code/>
                            </IconButton>
                        </Tooltip>
                    ) : (
                        ""
                    )}

                    <Tooltip
                        title={
                            <Typography className={"smtxt"}>
                                {tr("MainMenu.UtilitiesIndex")}
                            </Typography>
                        }
                    >
                        <IconButton
                            color={"inherit"}
                            className={classes.floatButton}
                            onClick={() => {
                                jumpTo("/UtilitiesIndex");
                                triggerSetPage("UtilitiesIndex");
                            }}
                        >
                            <Handyman/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip
                        title={
                            <Typography className={"smtxt"}>
                                {tr("MainMenu.QuickManageAccount")}
                            </Typography>
                        }
                    >
                        <IconButton
                            className={classes.floatButton}
                            onClick={() => {
                                jumpTo("/AccountManager");
                                triggerSetPage("AccountManager");
                            }}
                            color={"inherit"}
                        >
                            <ManageAccounts/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip
                        title={
                            <Typography className={"smtxt"}>
                                {tr("MainMenu.QuickManageContainer")}
                            </Typography>
                        }
                    >
                        <IconButton
                            className={classes.floatButton}
                            onClick={() => {
                                jumpTo("/ContainerManager");
                                triggerSetPage("ContainerManager");
                            }}
                            color={"inherit"}
                        >
                            <AllInbox/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip
                        title={
                            <Typography className={"smtxt"}>
                                {tr("MainMenu.QuickInstallCore")}
                            </Typography>
                        }
                    >
                        <IconButton
                            className={classes.floatButton}
                            onClick={() => {
                                jumpTo("/InstallCore");
                                triggerSetPage("InstallCore");
                            }}
                            color={"inherit"}
                        >
                            <GetApp/>
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
                        <FlightTakeoff className={classes.buttonText}/>
                        {tr("LaunchPad")}
                    </Fab>
                    <Tooltip
                        title={
                            <Typography className={"smtxt"}>{tr("MainMenu.Exit")}</Typography>
                        }
                    >
                        <IconButton
                            id={"hotbar_exit"}
                            className={classes.exitButton}
                            onClick={exitApp}
                            color={"inherit"}
                        >
                            <PowerSettingsNew/>
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

async function exitApp(): Promise<void> {
    remoteHideWindow();
    await ipcRenderer.invoke("markLoginItem", getBoolean("auto-launch"));
    waitUpdateFinished(() => {
        remoteCloseWindow();
    });
}

const PAGES_ICONS_MAP: Record<string, JSX.Element> = {
    LaunchPad: <FlightTakeoff/>,
    Welcome: <HomeIcon/>,
    InstallCore: <GetApp/>,
    ContainerManager: <AllInbox/>,
    JavaSelector: <ViewModule/>,
    AccountManager: <AccountCircle/>,
    Options: <Settings/>,
    Version: <Info/>,
    TheEndingOfTheEnd: <ImportContacts/>
};


function PagesDrawer(props: {
    open: boolean;
    onClose: () => unknown;
}): JSX.Element {
    return (
        <Drawer
            anchor={"left"}
            open={props.open}
            className={"window-no-drag"}
            onClose={props.onClose}
        >
            <List>
                {Object.entries(PAGES_ICONS_MAP).map(([p, i]) => {
                    return (
                        <ListItemButton
                            key={p}
                            onClick={() => {
                                props.onClose();
                                jumpTo("/" + p);
                                triggerSetPage(p);
                            }}
                        >
                            <ListItemIcon>{i}</ListItemIcon>
                            <ListItemText>
                                {tr(p)}
                            </ListItemText>
                        </ListItemButton>
                    );
                })}
            </List>
        </Drawer>
    );
}

export function remoteHideWindow(): void {
    console.log("Preparing to exit!");
    native.bwctl.hide();
}

function remoteCloseWindow(): void {
    console.log("Closing!");
    window.localStorage.setItem("LastVersion", pkg.updatorVersion.toString());
    commitChanges()
        .then(() => {
            native.bwctl.close(); // TODO do not close on osx
        })
        .catch(() => {
        });
}

function remoteOpenDevTools(): void {
    ipcRenderer.send("openDevTools");
    console.log(
        "%c" + tr("System.DevToolsWarn1"),
        "font-size:3.5rem;color:royalblue;font-weight:900;"
    );
    console.log("%c" + tr("System.DevToolsWarn2"), "font-size:1rem;color:red;");
    console.log("%c" + tr("System.DevToolsWarn3"), "font-size:2rem;color:red;");
}

export async function commitChanges(): Promise<void> {
    console.log("Saving data...");
    await saveConfig();
    await saveGDT();
    await saveJDT();
    await saveVF();
    saveStatistics();
    console.log("All chunks are saved.");
}

let animationId: number | null = null;
let mouseX: number | null = null;
let mouseY: number | null = null;

function onMouseDown(e: React.MouseEvent) {
    if (e.button === 0) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        document.addEventListener("mouseup", onMouseUp);
        requestAnimationFrame(moveWindow);
    }
}

function onMouseUp(e: MouseEvent) {
    if (e.button === 0) {
        document.removeEventListener("mouseup", onMouseUp);
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }
}

function moveWindow() {
    ipcRenderer.send("windowMoving", { mouseX, mouseY });
    animationId = requestAnimationFrame(moveWindow);
}

function BetaTag(): JSX.Element {
    return (
        <>
            &nbsp;
            <Chip
                label={tr("Beta")}
                size={"small"}
                color={"warning"}
                variant={"outlined"}
            />
        </>
    );
}
