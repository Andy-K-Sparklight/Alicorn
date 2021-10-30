import {
  Box,
  Button,
  Checkbox,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  makeStyles,
  MenuItem,
  MuiThemeProvider,
  Radio,
  RadioGroup,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { FlightLand, FlightTakeoff, RssFeed } from "@material-ui/icons";
import { ipcRenderer } from "electron";
import EventEmitter from "events";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Account } from "../modules/auth/Account";
import {
  AccountType,
  fillAccessData,
  getPresentAccounts,
} from "../modules/auth/AccountUtil";
import { prefetchData } from "../modules/auth/AJHelper";
import { AuthlibAccount } from "../modules/auth/AuthlibAccount";
import { LocalAccount } from "../modules/auth/LocalAccount";
import {
  MicrosoftAccount,
  MS_LAST_USED_ACTOKEN_KEY,
  MS_LAST_USED_REFRESH_KEY,
  MS_LAST_USED_USERNAME_KEY,
  MS_LAST_USED_UUID_KEY,
} from "../modules/auth/MicrosoftAccount";
import { Nide8Account } from "../modules/auth/Nide8Account";
import { uniqueHash } from "../modules/commons/BasicHash";
import { Pair } from "../modules/commons/Collections";
import {
  PROCESS_END_GATE,
  PROCESS_LOG_GATE,
  ReleaseType,
} from "../modules/commons/Constants";
import { isNull } from "../modules/commons/Null";
import {
  getBoolean,
  getNumber,
  getString,
} from "../modules/config/ConfigSupport";
import { getContainer } from "../modules/container/ContainerUtil";
import { MinecraftContainer } from "../modules/container/MinecraftContainer";
import { killEdge, runEdge } from "../modules/cutie/BootEdge";
import { acquireCode, deactiveCode } from "../modules/cutie/Hoofoff";
import {
  getWrapperStatus,
  WrapperStatus,
} from "../modules/download/DownloadWrapper";
import {
  getAllJava,
  getDefaultJavaHome,
  getJavaInfoRaw,
  getJavaRunnable,
  getLegacyJDK,
  getNewJDK,
  parseJavaInfo,
  parseJavaInfoRaw,
} from "../modules/java/JInfo";
import {
  ensureAllAssets,
  ensureAssetsIndex,
  ensureClient,
  ensureLibraries,
  ensureLog4jFile,
  ensureNatives,
} from "../modules/launch/Ensurance";
import { launchProfile } from "../modules/launch/LaunchPad";
import { stopMinecraft } from "../modules/launch/MinecraftBootstrap";
import { LaunchTracker } from "../modules/launch/Tracker";
import {
  initLocalYggdrasilServer,
  ROOT_YG_URL,
  skinTypeFor,
} from "../modules/localskin/LocalYggdrasilServer";
import { prepareModsCheckFor, restoreMods } from "../modules/modx/DynModLoad";
import { GameProfile } from "../modules/profile/GameProfile";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { getMachineUniqueID } from "../modules/security/Unique";
import { jumpTo, setChangePageWarn, triggerSetPage } from "./GoTo";
import { ShiftEle } from "./Instruction";
import { submitError, submitSucc, submitWarn } from "./Message";
import { YNDialog } from "./OperatingHint";
import {
  ALICORN_DEFAULT_THEME_DARK,
  ALICORN_DEFAULT_THEME_LIGHT,
} from "./Renderer";
import { addStatistics } from "./Statistics";
import { fullWidth, useFormStyles, useInputStyles } from "./Stylex";
import { randsl, tr } from "./Translator";
import {
  HOOFOFF_CENTRAL,
  NETWORK_PORT,
  QUERY_PORT,
} from "./utilities/CutieConnect";
import { SpecialKnowledge } from "./Welcome";
import { toReadableType } from "./YggdrasilAccountManager";

const SESSION_ACCESSDATA_CACHED_KEY = "ReadyToLaunch.SessionAccessData"; // Microsoft account only
export const LAST_SUCCESSFUL_GAME_KEY = "ReadyToLaunch.LastSuccessfulGame";
export const REBOOT_KEY_BASE = "ReadyToLaunch.Reboot.";
const useStyles = makeStyles((theme) =>
  createStyles({
    stepper: {
      backgroundColor: theme.palette.secondary.light,
    },
    textSP: {
      fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
      color: theme.palette.secondary.main,
    },
    text: {
      fontSize: "medium",
      flexGrow: 1,
      color: theme.palette.secondary.main,
    },
    root: {
      textAlign: "center",
    },
    primaryText: {
      flexGrow: 1,
      color: theme.palette.primary.main,
    },
  })
);
const LAST_USED_USER_NAME_KEY = "ReadyToLaunch.LastUsedUsername";
const GKEY = "Profile.PrefJava";
const DEF = "Default";
let NEED_QUERY_STATUS = false;
export const LAST_LAUNCH_REPORT_KEY = "ReadyToLaunch.LastLaunchReport";
export const LAST_FAILURE_INFO_KEY = "ReadyToLaunch.LastFailureInfo";
export const LAST_LOGS_KEY = "ReadyToLaunch.LastLogs";
export const LAST_CRASH_KEY = "ReadyToLaunch.LastCrash";
export function ReadyToLaunch(): JSX.Element {
  const [coreProfile, setProfile] = useState(new GameProfile({}));
  const [profileLoadedBit, setLoaded] = useState(0);
  let { id, container, server } =
    useParams<{ id: string; container: string; server?: string }>();
  id = decodeURIComponent(id);
  container = decodeURIComponent(container);
  server = server ? decodeURIComponent(server) : undefined;
  const mounted = useRef<boolean>();

  useEffect(() => {
    mounted.current = true;

    void (async () => {
      try {
        const d = await loadProfile(id, getContainer(container));
        if (mounted.current) {
          setProfile(d);
          setLoaded(1);
        }
      } catch (e) {
        console.log(e);
        if (mounted.current) {
          setLoaded(2);
        }
      }
    })();

    return () => {
      mounted.current = false;
    };
  }, []);
  const fullWidthProgress = fullWidth();
  return (
    <Box
      style={{
        textAlign: "center",
      }}
    >
      <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
        {profileLoadedBit === 1 ? (
          <Launching
            profile={coreProfile}
            container={getContainer(container)}
            server={server}
          />
        ) : profileLoadedBit === 2 ? (
          <Typography
            style={{ fontSize: "medium", color: "#ff8400" }}
            gutterBottom
          >
            {tr("ReadyToLaunch.CouldNotLoad")}
          </Typography>
        ) : (
          <LinearProgress
            color={"secondary"}
            style={{ width: "80%" }}
            className={fullWidthProgress.progress}
          />
        )}
      </MuiThemeProvider>
    </Box>
  );
}

const LAUNCH_STEPS = [
  "Pending",
  "PerformingAuth",
  "CheckingFiles",
  "PreparingMods",
  "GeneratingArgs",
  "Finished",
];
const REV_LAUNCH_STEPS = {
  Pending: 0,
  PerformingAuth: 1,
  CheckingFiles: 2,
  PreparingMods: 3,
  GeneratingArgs: 4,
  Finished: 5,
};
function Launching(props: {
  profile: GameProfile;
  container: MinecraftContainer;
  server?: string;
}): JSX.Element {
  const classes = useStyles();
  const mountedBit = useRef<boolean>(true);
  const [warning, setWarning] = useState(false);
  const [status, setStatus] = useState(LaunchingStatus.PENDING);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [selecting, setSelecting] = useState<boolean>(false);
  const [ws, setWrapperStatus] = useState<WrapperStatus>(getWrapperStatus());
  const [lanPort, setLanPort] = useState(0);
  const [openLanWindow, setOpenLanWindow] = useState(false);
  const [openLanButtonEnabled, setOpenLanButtonEnabled] = useState(false);
  const profileHash = useRef<string>(props.container + "/" + props.profile.id);
  useEffect(() => {
    const subscribe = setInterval(() => {
      if (NEED_QUERY_STATUS) {
        setWrapperStatus(getWrapperStatus());
      }
    }, 500);
    return () => {
      clearInterval(subscribe);
    };
  }, []);
  useEffect(() => {
    const fun = (e: Event) => {
      if (e instanceof CustomEvent) {
        if (typeof e.detail === "number" && !isNaN(e.detail)) {
          setLanPort(e.detail);
          setOpenLanButtonEnabled(true);
          setOpenLanWindow(true);
        }
      }
    };
    window.addEventListener("WorldServing", fun);
    return () => {
      window.removeEventListener("WorldServing", fun);
    };
  }, []);
  useEffect(() => {
    const fun = async () => {
      setLanPort(0);
      setOpenLanButtonEnabled(false);
      setOpenLanWindow(false);
      const m = window.sessionStorage.getItem(CODE_KEY + lanPort);
      if (m) {
        await deactiveCode(
          m,
          getString("hoofoff.central", HOOFOFF_CENTRAL, true) + ":" + QUERY_PORT
        );
        window.sessionStorage.removeItem(CODE_KEY + lanPort);
        submitSucc(tr("ReadyToLaunch.CodeDeactivated"));
      }
    };
    window.addEventListener("WorldStoppedServing", fun);
    return () => {
      window.removeEventListener("WorldStoppedServing", fun);
    };
  });
  useEffect(() => {
    const fun = async () => {
      let ke = false;
      if (lanPort > 0) {
        ke = true;
      }
      setLanPort(0);
      setOpenLanWindow(false);
      setOpenLanButtonEnabled(false);
      if (ke) {
        await killEdge();
      }
    };
    window.addEventListener("MinecraftExitCleanUp", fun);
    return () => {
      window.removeEventListener("MinecraftExitCleanUp", fun);
    };
  }, []);
  useEffect(() => {
    mountedBit.current = true;
  }, []);
  useEffect(() => {
    const fun = () => {
      setWarning(true);
    };
    window.addEventListener("mcFailure", fun);
    return () => {
      window.removeEventListener("mcFailure", fun);
    };
  }, []);

  return (
    <Box className={classes.root}>
      <AccountChoose
        open={selecting}
        closeFunc={() => {
          setSelecting(false);
        }}
        onChose={(a) => {
          setSelectedAccount(a);
          void (async () => {
            setProfileRelatedID(profileHash.current, "");
            // @ts-ignore
            window[LAST_LAUNCH_REPORT_KEY] = await startBoot(
              (st) => {
                if (mountedBit.current) {
                  setStatus(st);
                  setActiveStep(REV_LAUNCH_STEPS[st]);
                  setChangePageWarn(st !== LaunchingStatus.PENDING);
                }
              },
              props.profile,
              profileHash.current,
              props.container,
              a,
              props.server,
              (id) => {
                setProfileRelatedID(profileHash.current, id);
              }
            );
          })();
        }}
        allAccounts={getPresentAccounts()}
        profileHash={profileHash.current}
      />
      {warning ? (
        <YNDialog
          onClose={() => {
            setWarning(false);
          }}
          onAccept={() => {
            jumpTo("/CrashReportDisplay");
            triggerSetPage("CrashReportDisplay");
          }}
          title={tr("ReadyToLaunch.WarnError.Title")}
          content={tr("ReadyToLaunch.WarnError.Description")}
          yes={tr("ReadyToLaunch.WarnError.Yes")}
          no={tr("ReadyToLaunch.WarnError.No")}
        />
      ) : (
        ""
      )}

      <Typography className={classes.text} gutterBottom>
        {props.server
          ? tr(
              "ReadyToLaunch.HintServer",
              `ID=${props.profile.id}`,
              `Container=${props.container.id}`,
              `Server=${props.server}`
            )
          : tr(
              "ReadyToLaunch.Hint",
              `ID=${props.profile.id}`,
              `Container=${props.container.id}`
            )}
      </Typography>
      <Typography variant={"h6"} className={classes.primaryText} gutterBottom>
        {tr("ReadyToLaunch.Status." + status)}
      </Typography>
      <Stepper className={classes.stepper} activeStep={activeStep}>
        {LAUNCH_STEPS.map((s) => {
          return (
            <Step key={s}>
              <StepLabel>
                <Typography className={classes.textSP}>
                  {tr("ReadyToLaunch.Status.Short." + s)}
                </Typography>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
      {/* Insert Here */}
      {status === LaunchingStatus.PENDING ||
      status === LaunchingStatus.FINISHED ||
      status === LaunchingStatus.ACCOUNT_AUTHING ||
      status === LaunchingStatus.ARGS_GENERATING ? (
        <br />
      ) : (
        <>
          <Typography className={classes.text} gutterBottom>
            {tr(
              "ReadyToLaunch.Progress",
              `Current=${ws.inStack}`,
              `BufferMax=${getNumber("download.concurrent.max-tasks")}`,
              `Pending=${ws.pending}`
            )}
          </Typography>
        </>
      )}
      <MiniJavaSelector
        hash={profileHash.current}
        gameId={props.profile.id}
        gameVersion={props.profile.baseVersion.toString()}
        disabled={
          status !== LaunchingStatus.PENDING &&
          status !== LaunchingStatus.FINISHED
        }
      />
      {getBoolean("show-downloading-item") ? (
        <Typography className={classes.text} gutterBottom>
          {ws.doing}
        </Typography>
      ) : getBoolean("features.saying") ? (
        <WaitingText />
      ) : (
        <br />
      )}

      <Tooltip
        title={
          status === LaunchingStatus.FINISHED
            ? openLanButtonEnabled
              ? tr("ReadyToLaunch.OpenGameToLan")
              : tr("ReadyToLaunch.Kill")
            : tr("ReadyToLaunch.Start")
        }
      >
        <>
          <ShiftEle name={"Launch"}>
            <Fab
              color={"primary"}
              disabled={
                status !== LaunchingStatus.PENDING &&
                status !== LaunchingStatus.FINISHED
              }
              onClick={async () => {
                if (status === LaunchingStatus.PENDING) {
                  setProfileRelatedID(profileHash.current, "");
                  if (selectedAccount !== undefined) {
                    // @ts-ignore
                    window[LAST_LAUNCH_REPORT_KEY] = await startBoot(
                      (st) => {
                        if (mountedBit.current) {
                          setStatus(st);
                          setActiveStep(REV_LAUNCH_STEPS[st]);
                          setChangePageWarn(st !== LaunchingStatus.PENDING);
                        }
                      },
                      props.profile,
                      profileHash.current,
                      props.container,
                      selectedAccount,
                      props.server,
                      (id) => {
                        setProfileRelatedID(profileHash.current, id);
                      }
                    );
                  } else {
                    setSelecting(true);
                  }
                } else if (status === LaunchingStatus.FINISHED) {
                  if (openLanButtonEnabled) {
                    setOpenLanWindow(true);
                    return;
                  }
                  const i = getProfileRelatedID(profileHash.current);
                  if (i) {
                    console.log(`Forcefully stopping instance ${i}!`);
                    stopMinecraft(i);
                  }
                }
              }}
            >
              {status !== LaunchingStatus.FINISHED ? (
                <FlightTakeoff />
              ) : openLanButtonEnabled ? (
                <RssFeed />
              ) : (
                <FlightLand />
              )}
            </Fab>
          </ShiftEle>
        </>
      </Tooltip>
      <br />
      <br />
      <SpecialKnowledge />
      <OpenWorldDialog
        open={openLanWindow}
        baseVersion={props.profile.baseVersion}
        port={lanPort}
        onClose={() => {
          setOpenLanWindow(false);
        }}
      />
    </Box>
  );
}

export interface MCFailureInfo {
  tracker: LaunchTracker;
  profile: GameProfile;
  container: MinecraftContainer;
}
// Start to boot a Minecraft instance
// When Minecraft quit with a non-zero exit code, this function will post an event 'mcFailure'
// In its detail contains crash report (if found)
async function startBoot(
  setStatus: (status: LaunchingStatus) => void,
  profile: GameProfile,
  profileHash: string,
  container: MinecraftContainer,
  account: Account,
  server?: string,
  setRunID: (id: string) => unknown = () => {}
): Promise<LaunchTracker> {
  // @ts-ignore
  window[LAST_FAILURE_INFO_KEY] = undefined;
  // @ts-ignore
  window[LAST_LAUNCH_REPORT_KEY] = undefined;
  // @ts-ignore
  window[LAST_LOGS_KEY] = [];

  const GLOBAL_LAUNCH_TRACKER = new LaunchTracker();

  const FAILURE_INFO: MCFailureInfo = {
    container: container,
    tracker: GLOBAL_LAUNCH_TRACKER,
    profile: profile,
  };
  setStatus(LaunchingStatus.ACCOUNT_AUTHING);
  if (account.type === AccountType.MICROSOFT) {
    // @ts-ignore
    // if (!window[SESSION_ACCESSDATA_CACHED_KEY]) {
    if (!isReboot(profileHash)) {
      // If not reboot then validate
      if (!(await account.isAccessTokenValid())) {
        // Check if the access token is valid
        console.log("Token has expired! Refreshing.");
        if (!(await account.flushToken())) {
          console.log("Flush failed! Reauthing.");
          if (!(await account.performAuth(""))) {
            submitWarn(tr("ReadyToLaunch.FailedToAuth"));
          }
        } else {
          console.log("Token flushed successfully, continue.");
        }
      } else {
        console.log("Token valid, skipped auth.");
      }
    }
    // @ts-ignore
    //window[SESSION_ACCESSDATA_CACHED_KEY] = true;
    //}
  } else if (account.type !== AccountType.ALICORN) {
    // Alicorn don't need to flush fake token
    if (!(await account.isAccessTokenValid())) {
      // Don't know whether this will work or not, but we have to give a try
      if (!(await account.flushToken())) {
        submitWarn(tr("ReadyToLaunch.FailedToAuth"));
      }
    }
  }
  const acData = await fillAccessData(await account.buildAccessData());
  let useAj = false;
  let ajHost = "";
  let prefetch = "";
  let useNd = false;
  let ndServerId = "";

  // Setup skin if configured
  if (account.type === AccountType.ALICORN) {
    try {
      const skin = await skinTypeFor(account);

      await initLocalYggdrasilServer(account, skin);
      useAj = true;
      ajHost = ROOT_YG_URL; // Use local yggdrasil
      console.log("Successfully set skin!");
    } catch (e) {
      console.log("Skin setup failed!");
      console.log(e);
    }
  }
  if (account.type === AccountType.AUTHLIB_INJECTOR) {
    useAj = true;
    ajHost = (account as AuthlibAccount).authServer;
    console.log("Auth server is " + ajHost);
    console.log("Prefetching data!");
    prefetch = await prefetchData((account as AuthlibAccount).authServer);
  } else if (account.type === AccountType.NIDE8) {
    useNd = true;
    ndServerId = (account as Nide8Account).serverId;
    console.log("Nide server id is " + ndServerId);
  }
  let useServer = false;
  let serverHost = "";
  if (typeof server === "string" && server.length > 0) {
    useServer = true;
    serverHost = server.trim();
  }
  let resolutionPolicy = false;
  let w = 0;
  let h = 0;
  const resolution = getString("gw-size", "960x540").toLowerCase().split("x");
  if (resolution.length === 2) {
    [w, h] = resolution.map((e) => {
      return parseInt(e);
    });
    if (w > 0 && h > 0) {
      resolutionPolicy = true;
    }
  }
  if (!isReboot(profileHash)) {
    NEED_QUERY_STATUS = true;
    setStatus(LaunchingStatus.FILES_FILLING);
    await ensureAssetsIndex(profile, container);
    await Promise.all([
      ensureClient(profile),
      ensureLog4jFile(profile, container),
      (async () => {
        await ensureLibraries(profile, container, GLOBAL_LAUNCH_TRACKER);
        await ensureNatives(profile, container);
      })(),
      (async () => {
        await ensureAllAssets(profile, container, GLOBAL_LAUNCH_TRACKER);
      })(),
    ]); // Parallel
    if (getBoolean("launch.fast-reboot")) {
      markReboot(profileHash);
    }
    NEED_QUERY_STATUS = false;
  }
  setStatus(LaunchingStatus.MODS_PREPARING);
  if (profile.type === ReleaseType.MODIFIED) {
    await prepareModsCheckFor(profile, container, GLOBAL_LAUNCH_TRACKER);
  }
  setStatus(LaunchingStatus.ARGS_GENERATING);
  let jHome = getJavaAndCheckAvailable(profileHash, true);
  if (jHome === DEF) {
    jHome = await trySelectProperJava(profile.baseVersion);
  }
  const jRunnable = await getJavaRunnable(jHome);
  let jInfo;
  try {
    jInfo = parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(jHome)));
    GLOBAL_LAUNCH_TRACKER.java({
      runtime: jInfo.runtime,
      version: jInfo.rootVersion,
    });
  } catch {
    submitError(tr("ReadyToLaunch.InvalidJava"));
    return GLOBAL_LAUNCH_TRACKER;
  }
  const em = new EventEmitter();
  em.on(PROCESS_LOG_GATE, (d: string) => {
    const ds = d.split("\n");
    ds.forEach((d) => {
      if (d.includes("---- Minecraft Crash Report ----")) {
        d = d.trim();
      } else {
        d = d.trimRight();
      }
      if (d.length > 0) {
        // @ts-ignore
        window[LAST_LOGS_KEY].push(d);
        // @ts-ignore
        while (window[LAST_LOGS_KEY].length > 10000) {
          // @ts-ignore
          window[LAST_LOGS_KEY].shift();
        }
        console.log(d);
        if (getBoolean("features.detect-lan")) {
          if (d.toLowerCase().includes("started serving on")) {
            // "Started serving on 32997"
            const p = d.split("on").pop();
            if (p) {
              const px = parseInt(p.trim());
              if (!isNaN(px)) {
                window.dispatchEvent(
                  new CustomEvent("WorldServing", { detail: px })
                );
              }
            }
          } else if (d.toLowerCase().includes("stopping server")) {
            window.dispatchEvent(new CustomEvent("WorldStoppedServing"));
          }
        }
      }
    });
  });
  em.on(PROCESS_END_GATE, async (c) => {
    console.log(`Minecraft(${runID}) exited with exit code ${c}.`);
    setStatus(LaunchingStatus.PENDING);
    window.dispatchEvent(new CustomEvent("MinecraftExitCleanUp"));
    if (c !== "0" && c !== "SIGINT") {
      addStatistics("Crash");
      let crashReports: string[] = [];
      console.log(
        `Attention! Minecraft(${runID}) might not have run properly!`
      );
      // @ts-ignore
      const e = window[LAST_LOGS_KEY] as string[];
      const ei = e.lastIndexOf("---- Minecraft Crash Report ----");
      if (ei >= 0) {
        crashReports = e.splice(ei);
      }
      // @ts-ignore
      window[LAST_LOGS_KEY] = e;
      console.log("Gathering information...");
      // @ts-ignore
      window[LAST_CRASH_KEY] = crashReports;
      console.log("Reporting...");
      // @ts-ignore
      window[LAST_FAILURE_INFO_KEY] = FAILURE_INFO;
      window.dispatchEvent(new CustomEvent("mcFailure"));
      console.log("Crash report committed, continue tasks.");
      clearReboot(profileHash);
      console.log("Cleared reboot flag.");
    } else {
      // @ts-ignore
      window[LAST_LOGS_KEY] = [];
      if (gc) {
        gc();
      }
    }
    console.log("Restoring mods...");
    await restoreMods(container);
    console.log("Done!");
  });
  const runID = launchProfile(profile, container, jRunnable, acData, em, {
    useAj: useAj,
    ajHost: ajHost,
    ajPrefetch: prefetch,
    useServer: useServer,
    server: serverHost,
    useNd: useNd,
    ndServerId: ndServerId,
    resolution: resolutionPolicy ? new Pair(w, h) : undefined,
    javaVersion: jInfo.rootVersion,
    maxMem: getNumber("memory", 0),
    gc1: getString("gc1", "pure"),
    gc2: getString("gc2", "pure"),
  });
  addStatistics("Launch");
  setRunID(runID);
  window.localStorage.setItem(LAST_SUCCESSFUL_GAME_KEY, window.location.hash);
  setStatus(LaunchingStatus.FINISHED);
  console.log(`A new Minecraft instance (${runID}) has been launched.`);
  return GLOBAL_LAUNCH_TRACKER;
}

enum LaunchingStatus {
  PENDING = "Pending",
  ACCOUNT_AUTHING = "PerformingAuth",
  FILES_FILLING = "CheckingFiles",
  MODS_PREPARING = "PreparingMods",
  ARGS_GENERATING = "GeneratingArgs",
  FINISHED = "Finished",
}

const LAST_ACCOUNT_TAB_KEY = "ReadyToLaunch.LastSelectedAccountType";
const LAST_YG_ACCOUNT_NAME = "ReadyToLaunch.LastSelectedYggdrasilName";
function AccountChoose(props: {
  open: boolean;
  closeFunc: () => void;
  onChose: (a: Account) => unknown;
  allAccounts: Set<Account>;
  profileHash: string;
}): JSX.Element {
  const classes = useInputStyles();
  const btnClasses = makeStyles((theme) =>
    createStyles({
      btn: {
        color: theme.palette.primary.main,
        borderColor: theme.palette.primary.main,
      },
    })
  )();
  const [choice, setChoice] = useState<"MZ" | "AL" | "YG">(
    (window.localStorage.getItem(LAST_ACCOUNT_TAB_KEY + props.profileHash) as
      | "MZ"
      | "AL"
      | "YG") || "MZ"
  );
  const [pName, setName] = useState<string>(
    window.localStorage.getItem(LAST_USED_USER_NAME_KEY + props.profileHash) ||
      "Player"
  );
  const mounted = useRef<boolean>(false);

  const accountMap = useRef<Record<string, Account>>({});
  const accountMapRev = useRef<Map<Account, string>>(new Map());
  const [msLogout, setMSLogout] = useState<
    | "ReadyToLaunch.MSLogout"
    | "ReadyToLaunch.MSLogoutRunning"
    | "ReadyToLaunch.MSLogoutDone"
  >("ReadyToLaunch.MSLogout");
  useEffect(() => {
    for (const a of props.allAccounts) {
      const i = a.getAccountIdentifier();
      accountMap.current[i] = a;
      accountMapRev.current.set(a, i);
    }
  }, [props.allAccounts]);
  const la =
    window.localStorage.getItem(LAST_YG_ACCOUNT_NAME + props.profileHash) || "";
  let ll = "";
  if (la && accountMap.current[la] !== undefined) {
    ll = la;
  } else {
    // ll = Object.keys(accountMap)[0] || "";
  }
  const [sAccount, setAccount] = useState<string>(ll);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return (
    <Dialog
      open={props.open}
      onClose={() => {
        props.closeFunc();
      }}
    >
      <DialogContent>
        <DialogTitle>{tr("ReadyToLaunch.StartAuthTitle")}</DialogTitle>
        <DialogContentText>
          {tr("ReadyToLaunch.StartAuthMsg")}
        </DialogContentText>
        <RadioGroup
          row
          onChange={(e) => {
            if (["MZ", "AL", "YG"].includes(e.target.value)) {
              // @ts-ignore
              setChoice(e.target.value);
              window.localStorage.setItem(
                LAST_ACCOUNT_TAB_KEY + props.profileHash,
                e.target.value
              );
            }
          }}
        >
          <FormControlLabel
            value={"MZ"}
            control={<Radio checked={choice === "MZ"} />}
            label={tr("ReadyToLaunch.UseMZ")}
          />
          <FormControlLabel
            value={"YG"}
            control={<Radio checked={choice === "YG"} />}
            label={tr("ReadyToLaunch.UseYG")}
          />
          <FormControlLabel
            value={"AL"}
            control={<Radio checked={choice === "AL"} />}
            label={tr("ReadyToLaunch.UseAL")}
          />
        </RadioGroup>
        {choice === "AL" ? (
          <TextField
            className={classes.input}
            autoFocus
            margin={"dense"}
            onChange={(e) => {
              setName(e.target.value);
            }}
            label={tr("ReadyToLaunch.UseALName")}
            type={"text"}
            spellCheck={false}
            fullWidth
            color={"secondary"}
            variant={"outlined"}
            value={pName}
          />
        ) : (
          ""
        )}
        {choice === "MZ" ? (
          <>
            <Button
              variant={"outlined"}
              className={btnClasses.btn}
              disabled={msLogout === "ReadyToLaunch.MSLogoutRunning"}
              onClick={() => {
                void (async () => {
                  // @ts-ignore
                  window[SESSION_ACCESSDATA_CACHED_KEY] = false;
                  setMSLogout("ReadyToLaunch.MSLogoutRunning");
                  await ipcRenderer.invoke(
                    "msLogout",
                    getString("web.global-proxy")
                  );
                  localStorage.setItem(MS_LAST_USED_REFRESH_KEY, "");
                  localStorage.setItem(MS_LAST_USED_ACTOKEN_KEY, "");
                  localStorage.setItem(MS_LAST_USED_UUID_KEY, "");
                  localStorage.setItem(MS_LAST_USED_USERNAME_KEY, "");
                  if (mounted.current) {
                    setMSLogout("ReadyToLaunch.MSLogoutDone");
                  }
                })();
              }}
            >
              {tr(msLogout)}
            </Button>
          </>
        ) : (
          ""
        )}
        {choice === "YG" ? (
          <>
            <FormControl variant={"outlined"}>
              <InputLabel variant={"outlined"} id={"Select-Account"}>
                {tr("ReadyToLaunch.UseYGChoose")}
              </InputLabel>
              <Select
                label={tr("ReadyToLaunch.UseYGChoose")}
                variant={"outlined"}
                style={{ minWidth: "50%" }}
                fullWidth
                labelId={"Select-Account"}
                onChange={(e) => {
                  setAccount(String(e.target.value));
                  window.localStorage.setItem(
                    LAST_YG_ACCOUNT_NAME + props.profileHash,
                    String(e.target.value)
                  );
                }}
                value={sAccount}
              >
                {Array.from(props.allAccounts.keys()).map((a) => {
                  const hash =
                    accountMapRev.current.get(a) || a.getAccountIdentifier();
                  return (
                    <MenuItem key={hash} value={hash}>
                      {a.accountName + " - " + toReadableType(a.type)}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </>
        ) : (
          ""
        )}
      </DialogContent>
      <DialogActions>
        <Button
          disabled={
            (choice === "YG" &&
              (sAccount.length === 0 ||
                isNull(accountMap.current[sAccount]))) ||
            (choice === "AL" && pName.trim().length === 0)
          }
          onClick={() => {
            props.closeFunc();
            switch (choice) {
              case "MZ":
                props.onChose(new MicrosoftAccount(""));
                return;
              case "YG":
                props.onChose(accountMap.current[sAccount]);
                return;
              case "AL":
              default:
                window.localStorage.setItem(
                  LAST_USED_USER_NAME_KEY + props.profileHash,
                  pName
                );
                props.onChose(new LocalAccount(pName));
            }
          }}
        >
          {tr("ReadyToLaunch.Next")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MiniJavaSelector(props: {
  hash: string;
  gameId: string;
  disabled: boolean;
  gameVersion: string;
}): JSX.Element {
  const classes = useFormStyles();
  const fullWidthClasses = fullWidth();
  const mounted = useRef<boolean>(false);
  const [currentJava, setCurrentJava] = useState<string>(
    getJavaAndCheckAvailable(props.hash, true)
  );
  const [currentJavaVersion, setCurrentJavaVersion] = useState<number>();
  const loaded = useRef<boolean>(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    void (async () => {
      try {
        const ji = parseJavaInfo(
          parseJavaInfoRaw(
            await getJavaInfoRaw(
              currentJava === DEF
                ? await trySelectProperJava(props.gameVersion)
                : currentJava
            )
          )
        );
        loaded.current = true;
        if (mounted.current) {
          setCurrentJavaVersion(ji.rootVersion);
        }
      } catch {
        submitWarn(tr("ReadyToLaunch.NoJava"));
      }
    })();
  }, [currentJava]);
  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <Box
        className={classes.root}
        style={{
          marginTop: "5px",
        }}
      >
        <FormControl variant={"outlined"}>
          <InputLabel id={"Select-JRE"} className={classes.label}>
            {tr("JavaSelector.SelectJava")}
          </InputLabel>
          <Select
            margin={"dense"}
            label={tr("JavaSelector.SelectJava")}
            variant={"outlined"}
            labelId={"Select-JRE"}
            color={"primary"}
            className={classes.selector + " " + fullWidthClasses.form}
            onChange={(e) => {
              const sj = String(e.target.value);
              setCurrentJava(sj);
              setJavaForProfile(props.hash, sj);
            }}
            value={currentJava}
          >
            {(() => {
              const t = getAllJava().map((j) => {
                return (
                  <MenuItem key={j} value={j}>
                    {j}
                  </MenuItem>
                );
              });
              t.unshift(
                <MenuItem key={DEF} value={DEF}>
                  {tr("ReadyToLaunch.DefaultJava")}
                </MenuItem>
              );
              return t;
            })()}
          </Select>
        </FormControl>
        {(() => {
          if (!loaded.current || !currentJavaVersion) {
            return "";
          }
          const c = checkJMCompatibility(props.gameVersion, currentJavaVersion);
          if (c === "OK") {
            return "";
          }
          return (
            <Typography
              style={{
                fontSize:
                  window.sessionStorage.getItem("smallFontSize") || "16px",
                color: "#ff8400",
              }}
              gutterBottom
            >
              {tr("ReadyToLaunch.JCheck.Too" + c)}
            </Typography>
          );
        })()}
      </Box>
    </MuiThemeProvider>
  );
}

function setJavaForProfile(hash: string, jHome: string): void {
  window.localStorage[GKEY + hash] = jHome;
}

function getJavaAndCheckAvailable(hash: string, allowDefault = false): string {
  const t = window.localStorage[GKEY + hash];
  if (typeof t === "string" && t.length > 0) {
    if (t === DEF) {
      if (allowDefault) {
        return DEF;
      }
      return getDefaultJavaHome();
    }
    if (getAllJava().includes(t)) {
      return t;
    }
  }
  if (allowDefault) {
    return DEF;
  }
  return getDefaultJavaHome();
}

async function trySelectProperJava(id: string): Promise<string> {
  console.log("Selecting proper java for " + id);
  let b: string | undefined;
  if (LEGACY_VERSIONS.test(id)) {
    b = await getLegacyJDK();
  } else {
    b = await getNewJDK();
  }
  console.log("Configured java: " + b);
  return b || getDefaultJavaHome();
}

const LEGACY_VERSIONS = /^1\.([0-9]|1[0-2])([-.a-z].*?)?$/i;
const MODERN_VERSIONS = /^1\.(1[7-9]|[2-9][0-9])(\.)?[0-9]*?/i;

function checkJMCompatibility(mv: string, jv: number): "OLD" | "NEW" | "OK" {
  if (LEGACY_VERSIONS.test(mv) && jv > 8) {
    return "NEW";
  }
  if (MODERN_VERSIONS.test(mv) && jv < 16) {
    return "OLD";
  }
  return "OK";
}

function markReboot(hash: string): void {
  window.sessionStorage.setItem(REBOOT_KEY_BASE + hash, "1");
}

function clearReboot(hash: string): void {
  window.sessionStorage.removeItem(REBOOT_KEY_BASE + hash);
}

function isReboot(hash: string): boolean {
  return window.sessionStorage.getItem(REBOOT_KEY_BASE + hash) === "1";
}

const CODE_KEY = "Hoofoff.Code";

function OpenWorldDialog(props: {
  open: boolean;
  baseVersion: string;
  port: number;
  onClose: () => unknown;
}): JSX.Element {
  const [message, setMessage] = useState("Hi there!");
  const [expires, setExpires] = useState(1); // in hours
  const [count, setCount] = useState(5);
  const [premium, setPremium] = useState(true);
  const [code, setCode] = useState<string>();
  const [isRunning, setRunning] = useState(false);
  const [err, setErr] = useState<string>();
  const [shouldClose, setShouldClose] = useState(false);
  useEffect(() => {
    const fun = () => {
      setCode(undefined);
      setRunning(false);
      setErr(undefined);
    };
    window.addEventListener("MinecraftExitCleanUp", fun);
    return () => {
      window.removeEventListener("MinecraftExitCleanUp", fun);
    };
  }, []);
  return (
    <Dialog
      open={props.open}
      onClose={() => {
        props.onClose();
      }}
    >
      <DialogTitle>{tr("ReadyToLaunch.GenerateLink")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {tr("ReadyToLaunch.GenerateLinkDesc")}
        </DialogContentText>
        {code ? (
          <DialogContentText
            style={{ color: ALICORN_DEFAULT_THEME_DARK.palette.primary.main }}
          >
            {tr("ReadyToLaunch.HoofoffCode", `Code=${code}`)}
          </DialogContentText>
        ) : (
          ""
        )}
        <FormControl fullWidth variant={"outlined"}>
          <InputLabel id={"ReadyToLaunch-Expires"}>
            {tr("ReadyToLaunch.Expires")}
          </InputLabel>
          <Select
            label={tr("ReadyToLaunch.Expires")}
            variant={"outlined"}
            labelId={"ReadyToLaunch-Expires"}
            fullWidth
            color={"primary"}
            autoFocus
            margin={"dense"}
            value={expires}
            onChange={(e) => {
              setExpires(parseInt(String(e.target.value)));
            }}
          >
            <MenuItem value={1}>{tr("ReadyToLaunch.10Min")}</MenuItem>
            <MenuItem value={3}>{tr("ReadyToLaunch.30Min")}</MenuItem>
            <MenuItem value={6}>{tr("ReadyToLaunch.1Hour")}</MenuItem>
            <MenuItem value={18}>{tr("ReadyToLaunch.3Hour")}</MenuItem>
          </Select>
        </FormControl>
        <br /> <br />
        <FormControl fullWidth variant={"outlined"}>
          <InputLabel id={"ReadyToLaunch-Count"}>
            {tr("ReadyToLaunch.CanUse")}
          </InputLabel>
          <Select
            fullWidth
            label={tr("ReadyToLaunch.CanUse")}
            variant={"outlined"}
            labelId={"ReadyToLaunch-Count"}
            color={"primary"}
            margin={"dense"}
            value={count}
            onChange={(e) => {
              setCount(parseInt(String(e.target.value)));
            }}
          >
            <MenuItem value={1}>{tr("ReadyToLaunch.Once")}</MenuItem>
            <MenuItem value={5}>{tr("ReadyToLaunch.FiveTimes")}</MenuItem>
            <MenuItem value={20}>{tr("ReadyToLaunch.TwentyTimes")}</MenuItem>
            <MenuItem value={2147483647}>
              {tr("ReadyToLaunch.Unlimited")}
            </MenuItem>
          </Select>
        </FormControl>
        <br />
        <Tooltip title={tr("ReadyToLaunch.RequirePremiumDesc")}>
          <FormControlLabel
            control={
              <Checkbox
                checked={premium}
                onChange={(e) => {
                  setPremium(e.target.checked);
                }}
              />
            }
            label={tr("ReadyToLaunch.RequirePremium")}
          />
        </Tooltip>
        <DialogContentText>{tr("ReadyToLaunch.Message")}</DialogContentText>
        <TextField
          autoFocus
          margin={"dense"}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          type={"text"}
          spellCheck={false}
          color={"primary"}
          disabled={isRunning}
          fullWidth
          variant={"outlined"}
          value={message}
        />
        {err ? (
          <DialogContentText style={{ color: "#ff8400" }}>
            {tr("ReadyToLaunch.Errors." + err)}
          </DialogContentText>
        ) : (
          ""
        )}
      </DialogContent>
      <DialogActions>
        <Button
          disabled={isRunning}
          onClick={async () => {
            if (shouldClose) {
              setShouldClose(false);
              setErr(undefined);
              props.onClose();
              return;
            }
            setRunning(true);
            const gPort = props.port;
            const n = uniqueHash(await getMachineUniqueID());
            const p = uniqueHash(Math.random().toString());
            try {
              await killEdge();
              await runEdge(
                n,
                p,
                "10.16.32.128",
                getString("hoofoff.central", HOOFOFF_CENTRAL, true) +
                  ":" +
                  NETWORK_PORT
              );

              const c = await acquireCode(
                {
                  message: message,
                  ip: "10.16.32.128",
                  port: gPort,
                  network: n,
                  password: p,
                  premium: premium,
                  baseVersion: props.baseVersion,
                  nextIP: 0, // This is not necessary
                },
                expires * 600000,
                count,
                getString("hoofoff.central", HOOFOFF_CENTRAL, true) +
                  ":" +
                  QUERY_PORT
              );
              if (c.length === 6) {
                setCode(c);
                window.sessionStorage.setItem(CODE_KEY + props.port, c);
                submitSucc(tr("ReadyToLaunch.HoofoffCode", `Code=${c}`));
                setErr("");
                setShouldClose(true);
                setRunning(false);
              }
            } catch {
              setErr("AcquireFailed");
              setRunning(false);
            }
          }}
        >
          {shouldClose
            ? tr("ReadyToLaunch.GoBack")
            : tr("ReadyToLaunch.GetLink")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function WaitingText(): JSX.Element {
  const [hint, setHint] = useState(randsl("ReadyToLaunch.WaitingText"));
  useEffect(() => {
    const timer = setInterval(() => {
      setHint(randsl("ReadyToLaunch.WaitingText"));
    }, 5000);
    return () => {
      clearInterval(timer);
    };
  }, []);
  return (
    <Typography
      style={{
        flexGrow: 1,
        fontSize: "medium",
        color: ALICORN_DEFAULT_THEME_DARK.palette.secondary.main,
      }}
      gutterBottom
    >
      {hint}
    </Typography>
  );
}

function setProfileRelatedID(hash: string, rid: string): void {
  window.sessionStorage.setItem("MinecraftID" + hash, rid);
}

function getProfileRelatedID(hash: string): string {
  return window.sessionStorage.getItem("MinecraftID" + hash) || "";
}
