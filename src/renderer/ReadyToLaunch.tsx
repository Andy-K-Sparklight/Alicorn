import {
  Box,
  Button,
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
import { FlightLand, FlightTakeoff } from "@material-ui/icons";
import { ipcRenderer } from "electron";
import EventEmitter from "events";
import objectHash from "object-hash";
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
import { findNotIn, Pair } from "../modules/commons/Collections";
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
import { scanReports } from "../modules/crhelper/CrashReportFinder";
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
import { waitUpdateFinished } from "../modules/selfupdate/Updator";
import { remoteCloseWindow, remoteHideWindow } from "./App";
import { jumpTo, setChangePageWarn, triggerSetPage } from "./GoTo";
import { submitError, submitWarn } from "./Message";
import { YNDialog } from "./OperatingHint";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { fullWidth, useFormStyles, useInputStyles } from "./Stylex";
import { randsl, tr } from "./Translator";
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

export function ReadyToLaunch(): JSX.Element {
  const [coreProfile, setProfile] = useState(new GameProfile({}));
  const [profileLoadedBit, setLoaded] = useState(0);
  const { id, container, server } =
    useParams<{ id: string; container: string; server?: string }>();

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

function Launching(props: {
  profile: GameProfile;
  container: MinecraftContainer;
  server?: string;
}): JSX.Element {
  const classes = useStyles();
  const mountedBit = useRef<boolean>(true);
  const [warning, setWarning] = useState(false);
  const runID = useRef("");
  const [status, setStatus] = useState(LaunchingStatus.PENDING);
  const [hint, setHint] = useState(randsl("ReadyToLaunch.WaitingText"));
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [selecting, setSelecting] = useState<boolean>(false);
  const [ws, setWrapperStatus] = useState<WrapperStatus>(getWrapperStatus());
  const profileHash = useRef<string>(objectHash(props.profile));
  useEffect(() => {
    const timer = setInterval(() => {
      setHint(randsl("ReadyToLaunch.WaitingText"));
    }, 5000);
    const subscribe = setInterval(() => {
      if (NEED_QUERY_STATUS) {
        setWrapperStatus(getWrapperStatus());
      }
    }, 500);
    return () => {
      clearInterval(timer);
      clearInterval(subscribe);
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
            runID.current = "";
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
                runID.current = id;
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
      {status === LaunchingStatus.ACCOUNT_AUTHING ||
      status === LaunchingStatus.ARGS_GENERATING ||
      status === LaunchingStatus.MODS_PREPARING ? (
        <LinearProgress color={"secondary"} />
      ) : (
        ""
      )}
      {/* Insert Here */}
      {status === LaunchingStatus.PENDING ||
      status === LaunchingStatus.FINISHED ||
      status === LaunchingStatus.ACCOUNT_AUTHING ||
      status === LaunchingStatus.ARGS_GENERATING ? (
        ""
      ) : (
        <Box>
          <Typography className={classes.text} gutterBottom>
            {tr(
              "ReadyToLaunch.Progress",
              `Current=${ws.inStack}`,
              `BufferMax=${getNumber("download.concurrent.max-tasks")}`,
              `Pending=${ws.pending}`
            )}
          </Typography>
        </Box>
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
      ) : (
        <Typography className={classes.text} gutterBottom>
          {hint}
        </Typography>
      )}

      <Tooltip
        title={
          status === LaunchingStatus.FINISHED
            ? tr("ReadyToLaunch.Kill")
            : tr("ReadyToLaunch.Start")
        }
      >
        <Box>
          <Fab
            color={"primary"}
            disabled={
              status !== LaunchingStatus.PENDING &&
              status !== LaunchingStatus.FINISHED
            }
            onClick={async () => {
              if (status === LaunchingStatus.PENDING) {
                runID.current = "";
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
                      runID.current = id;
                    }
                  );
                } else {
                  setSelecting(true);
                }
              } else if (status === LaunchingStatus.FINISHED) {
                if (runID.current) {
                  console.log(`Forcefully stopping instance ${runID.current}!`);
                  stopMinecraft(runID.current);
                }
              }
            }}
          >
            {status !== LaunchingStatus.FINISHED ? (
              <FlightTakeoff />
            ) : (
              <FlightLand />
            )}
          </Fab>
        </Box>
      </Tooltip>
      <br />
      <br />
      <SpecialKnowledge />
    </Box>
  );
}

export interface MCFailureInfo {
  crashReport?: string;
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
          await account.performAuth("");
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
      await account.flushToken(); // Don't know whether this will work or not, but we have to give a try
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
      if (skin !== "NONE") {
        await initLocalYggdrasilServer(account, skin);
        useAj = true;
        ajHost = ROOT_YG_URL; // Use local yggdrasil
        console.log("Successfully set skin!");
      } else {
        console.log("No skin detected, will use default...");
      }
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
  const originCrashLogs = await scanReports(container);
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
  em.on(PROCESS_LOG_GATE, (d) => {
    // @ts-ignore
    window[LAST_LOGS_KEY].push(d);
    console.log(d);
  });
  em.on(PROCESS_END_GATE, async (c) => {
    console.log(`Minecraft(${runID}) exited with exit code ${c}.`);
    if (getBoolean("hide-when-game")) {
      ipcRenderer.send("showWindow");
    }
    setStatus(LaunchingStatus.PENDING);
    if (c !== "0" && c !== "SIGINT") {
      console.log(
        `Attention! Minecraft(${runID}) might not have run properly!`
      );
      console.log("Gathering information...");
      const finalCrashLogs = await scanReports(container);
      const logFile = findNotIn(finalCrashLogs, originCrashLogs);
      logFile.sort();
      FAILURE_INFO.crashReport = logFile[logFile.length - 1];
      // Get the last one, undefined if not exists
      console.log("Reporting...");
      // @ts-ignore
      window[LAST_FAILURE_INFO_KEY] = FAILURE_INFO;
      window.dispatchEvent(new CustomEvent("mcFailure"));
      console.log("Crash report committed, continue tasks.");
      clearReboot(profileHash);
      console.log("Cleared reboot flag.");
    } else {
      if (getBoolean("action.close-on-exit")) {
        remoteHideWindow();
        waitUpdateFinished(() => {
          remoteCloseWindow();
        });
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
  setRunID(runID);
  window.localStorage.setItem(LAST_SUCCESSFUL_GAME_KEY, window.location.hash);
  setStatus(LaunchingStatus.FINISHED);
  console.log(`A new Minecraft instance (${runID}) has been launched.`);
  if (getBoolean("hide-when-game")) {
    ipcRenderer.send("hideWindow");
  }
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

  const accountMap: Record<string, Account> = {};
  const [msLogout, setMSLogout] = useState<
    | "ReadyToLaunch.MSLogout"
    | "ReadyToLaunch.MSLogoutRunning"
    | "ReadyToLaunch.MSLogoutDone"
  >("ReadyToLaunch.MSLogout");
  for (const a of props.allAccounts) {
    accountMap[objectHash(a)] = a;
  }
  const la =
    window.localStorage.getItem(LAST_YG_ACCOUNT_NAME + props.profileHash) || "";
  let ll = "";
  if (la && accountMap[la] !== undefined) {
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
          <Box>
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
          </Box>
        ) : (
          ""
        )}
        {choice === "YG" ? (
          <Box>
            <InputLabel id={"Select-Account"}>
              {tr("ReadyToLaunch.UseYGChoose")}
            </InputLabel>
            <Select
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
                const hash = objectHash(a);
                return (
                  <MenuItem key={hash} value={hash}>
                    {a.accountName + " - " + toReadableType(a.type)}
                  </MenuItem>
                );
              })}
            </Select>
          </Box>
        ) : (
          ""
        )}
      </DialogContent>
      <DialogActions>
        <Button
          disabled={
            (choice === "YG" &&
              (sAccount.length === 0 || isNull(accountMap[sAccount]))) ||
            (choice === "AL" && pName.trim().length === 0)
          }
          onClick={() => {
            props.closeFunc();
            switch (choice) {
              case "MZ":
                props.onChose(new MicrosoftAccount(""));
                return;
              case "YG":
                props.onChose(accountMap[sAccount]);
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
        <FormControl>
          <InputLabel id={"Select-JRE"} className={classes.label}>
            {tr("JavaSelector.SelectJava")}
          </InputLabel>
          <Select
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
                  <MenuItem key={objectHash(j)} value={j}>
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
