import {
  FlashOn,
  FlightLand,
  FlightTakeoff,
  RssFeed,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Container,
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
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import EventEmitter from "events";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { Account } from "../modules/auth/Account";
import {
  AccountType,
  fillAccessData,
  getPresentAccounts,
  querySkinFor,
} from "../modules/auth/AccountUtil";
import { prefetchData } from "../modules/auth/AJHelper";
import { AuthlibAccount } from "../modules/auth/AuthlibAccount";
import { LocalAccount } from "../modules/auth/LocalAccount";
import {
  ACCOUNT_EXPIRES_KEY,
  ACCOUNT_LAST_REFRESHED_KEY,
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
import { launchProfile, markSafeLaunch } from "../modules/launch/LaunchPad";
import { stopMinecraft } from "../modules/launch/MinecraftBootstrap";
import { LaunchTracker } from "../modules/launch/Tracker";
import { prepareModsCheckFor, restoreMods } from "../modules/modx/DynModLoad";
import { GameProfile } from "../modules/profile/GameProfile";
import { loadProfile } from "../modules/profile/ProfileLoader";
import {
  dropAccountPromise,
  waitMSAccountReady,
} from "../modules/readyboom/AccountMaster";
import {
  setLastUsed,
  waitProfileReady,
} from "../modules/readyboom/PrepareProfile";
import { getMachineUniqueID } from "../modules/security/Unique";
import {
  initLocalYggdrasilServer,
  ROOT_YG_URL,
  skinTypeFor,
} from "../modules/skin/LocalYggdrasilServer";
import { jumpTo, setChangePageWarn, triggerSetPage } from "./GoTo";
import { ShiftEle } from "./Instruction";
import { submitError, submitSucc, submitWarn } from "./Message";
import { YNDialog } from "./OperatingHint";
import {
  ALICORN_DEFAULT_THEME_DARK,
  ALICORN_DEFAULT_THEME_LIGHT,
  isBgDark,
} from "./Renderer";
import { SkinDisplay2D, SkinDisplay3D } from "./SkinDisplay";
import { addStatistics } from "./Statistics";
import {
  AlicornTheme,
  fullWidth,
  useFormStyles,
  useInputStyles,
} from "./Stylex";
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
const useStyles = makeStyles((theme: AlicornTheme) => ({
  stepper: {
    backgroundColor: theme.palette.secondary.light,
    fontSize: "14px",
  },
  textSP: {
    fontSize: sessionStorage.getItem("smallFontSize") || "1em",
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
}));
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
    <Container>
      <ThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
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
            sx={{ width: "80%" }}
            className={fullWidthProgress.progress}
          />
        )}
      </ThemeProvider>
      <AskURLDialog />
    </Container>
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
  const [dry, setDry] = useState(false);
  const profileHash = useRef<string>(
    props.container.id + "/" + props.profile.id
  );
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
      const m = sessionStorage.getItem(CODE_KEY + lanPort);
      if (m) {
        await deactiveCode(
          m,
          getString("hoofoff.central", HOOFOFF_CENTRAL, true) + ":" + QUERY_PORT
        );
        sessionStorage.removeItem(CODE_KEY + lanPort);
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
    <Container className={classes.root}>
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
              },
              dry
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
      <br />

      <Stepper className={classes.stepper} activeStep={activeStep}>
        {LAUNCH_STEPS.map((s) => {
          return (
            <Step key={s}>
              <StepLabel>
                <Typography className={classes.textSP + " smtxt"}>
                  {tr("ReadyToLaunch.Status.Short." + s)}
                </Typography>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
      <br />
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
          <Typography className={"smtxt"}>
            {status === LaunchingStatus.FINISHED
              ? openLanButtonEnabled
                ? tr("ReadyToLaunch.OpenGameToLan")
                : tr("ReadyToLaunch.Kill")
              : tr("ReadyToLaunch.Start")}
          </Typography>
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
                      },
                      dry
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
                dry ? (
                  <FlashOn />
                ) : (
                  <FlightTakeoff />
                )
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
      <Tooltip title={tr("ReadyToLaunch.DryLaunchDesc")}>
        <FormControlLabel
          control={
            <Checkbox
              color={"primary"}
              disabled={status !== "Pending"}
              checked={dry}
              onChange={(e) => {
                setDry(e.target.checked);
              }}
            />
          }
          label={
            <Typography color={"primary"}>
              {tr("ReadyToLaunch.DryLaunch")}
            </Typography>
          }
        />
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
    </Container>
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
  setRunID: (id: string) => unknown = () => {},
  dry = false
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
      if (!(await waitMSAccountReady())) {
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
      } else {
        console.log("MS account auth job has been done by ReadyBoom. Skipped.");
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
    const st = await waitProfileReady(container.id, profile.id);
    if (!st) {
      // I shall do this
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
    } else {
      GLOBAL_LAUNCH_TRACKER.library({
        total: 1,
        resolved: 1,
        operateRecord: [{ file: "ReadyBoom Proxied", operation: "OPERATED" }],
      });
    }
    if (getBoolean("launch.fast-reboot")) {
      markReboot(profileHash);
    }
    NEED_QUERY_STATUS = false;
  } else {
    GLOBAL_LAUNCH_TRACKER.library({
      total: 1,
      resolved: 1,
      operateRecord: [{ file: "Quick Restart Proxied", operation: "OPERATED" }],
    });
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
  if (!dry) {
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
    window.dispatchEvent(new CustomEvent("GameQuit"));
    setStatus(LaunchingStatus.PENDING);
    window.dispatchEvent(new CustomEvent("MinecraftExitCleanUp"));
    if (c !== "0" && c !== "SIGINT") {
      addStatistics("Crash");
      let crashReports: string[] = [];
      console.log(
        `Attention! Minecraft(${runID}) might not have run properly!`
      );
      markSafeLaunch(container.id, profile.id);
      console.log(`Set ${container.id}/${profile.id} as safe mode.`);
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
      markSafeLaunch(container.id, profile.id, false);
      console.log(`Remove ${container.id}/${profile.id} from safe mode.`);
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
  let runID = "0";
  if (!dry) {
    runID = launchProfile(profile, container, jRunnable, acData, em, {
      useAj: useAj,
      ajHost: ajHost,
      ajPrefetch: prefetch,
      useServer: useServer,
      server: serverHost,
      useNd: useNd,
      ndServerId: ndServerId,
      resolution: resolutionPolicy ? new Pair(w, h) : undefined,
      javaVersion: jInfo ? jInfo.rootVersion : 0,
      maxMem: getNumber("memory", 0),
      gc1: getString("gc1", "pure"),
      gc2: getString("gc2", "pure"),
    });
  }
  addStatistics("Launch");
  setRunID(runID);
  localStorage.setItem(LAST_SUCCESSFUL_GAME_KEY, window.location.hash);
  setLastUsed(container.id, profile.id);
  setStatus(LaunchingStatus.FINISHED);
  console.log(`A new Minecraft instance (${runID}) has been launched.`);
  if (dry) {
    em.emit(PROCESS_LOG_GATE, "Dry launch successful!");
    setTimeout(() => {
      em.emit(PROCESS_LOG_GATE, "Stopping!");
      em.emit(PROCESS_END_GATE, "0");
    }, 5000);
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
  const btnClasses = makeStyles((theme: AlicornTheme) => ({
    btn: {
      color: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
    },
  }))();
  const [choice, setChoice] = useState<"MZ" | "AL" | "YG">(
    (localStorage.getItem(LAST_ACCOUNT_TAB_KEY + props.profileHash) as
      | "MZ"
      | "AL"
      | "YG") || "MZ"
  );
  const [pName, setName] = useState<string>(
    localStorage.getItem(LAST_USED_USER_NAME_KEY + props.profileHash) ||
      "Player"
  );
  const [bufPName, setBufPName] = useState(pName);
  const mounted = useRef<boolean>(false);
  const [accsMajor, accsRev] = useMemo(() => {
    const accountMap: Record<string, Account> = {};
    const accountMapRev: Map<Account, string> = new Map();
    for (const a of props.allAccounts) {
      const i = a.getAccountIdentifier();
      accountMap[i] = a;
      accountMapRev.set(a, i);
    }
    return [accountMap, accountMapRev];
  }, [props.allAccounts]);
  const accountMap = useRef<Record<string, Account>>(accsMajor);
  const accountMapRev = useRef<Map<Account, string>>(accsRev);
  const [msLogout, setMSLogout] = useState<
    | "ReadyToLaunch.MSLogout"
    | "ReadyToLaunch.MSLogoutRunning"
    | "ReadyToLaunch.MSLogoutDone"
  >("ReadyToLaunch.MSLogout");
  const la =
    localStorage.getItem(LAST_YG_ACCOUNT_NAME + props.profileHash) || "";
  let ll = "";
  if (la && accountMap.current[la] !== undefined) {
    ll = la;
  } else {
    // ll = Object.keys(accountMap)[0] || "";
  }
  const [sAccount, setAccount] = useState<string>(ll);
  const [skinUrl, setSkinUrl] = useState("");
  const lastRequireSkinDate = useRef(new Date().getTime());
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    void (async () => {
      const d = new Date().getTime();
      lastRequireSkinDate.current = d;
      if (choice === "MZ") {
        const u = await querySkinFor(new MicrosoftAccount(""));
        if (mounted.current && lastRequireSkinDate.current === d) {
          setSkinUrl(u);
        }
        return;
      }
      if (choice === "YG") {
        const a =
          accountMap.current[
            sAccount || Object.keys(accountMap.current).shift() || ""
          ];
        if (a) {
          const u = await querySkinFor(a);
          if (mounted.current && lastRequireSkinDate.current === d) {
            setSkinUrl(u);
          }
        } else {
          setSkinUrl("");
        }
        return;
      }
      if (choice === "AL") {
        const a = new LocalAccount(pName);
        const u = await querySkinFor(a);
        if (mounted.current && lastRequireSkinDate.current === d) {
          setSkinUrl(u);
          return;
        }
      }
      setSkinUrl("");
    })();
  }, [sAccount, choice, msLogout, bufPName]);
  return (
    <ThemeProvider
      theme={
        isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
      }
    >
      <Dialog
        open={props.open}
        onClose={() => {
          props.closeFunc();
        }}
      >
        <DialogContent style={{ overflow: "visible" }}>
          <DialogTitle>{tr("ReadyToLaunch.StartAuthTitle")}</DialogTitle>
          <DialogContentText>
            {tr("ReadyToLaunch.StartAuthMsg")}
          </DialogContentText>

          {skinUrl ? (
            getBoolean("features.skin-view-3d") ? (
              <Box
                style={{
                  position: "absolute",
                  right: 20,
                  top: -50,
                  overflow: "visible",
                  textAlign: "center",
                }}
              >
                <SkinDisplay3D skin={skinUrl} width={100} height={150} />
                <Typography style={{ color: "gray", marginTop: "-0.25em" }}>
                  {tr("AccountManager.SkinView3DShort")}
                </Typography>
              </Box>
            ) : (
              <Box
                style={{
                  position: "absolute",
                  right: 15,
                  top: 10,
                  overflow: "visible",
                  textAlign: "center",
                }}
              >
                <SkinDisplay2D skin={skinUrl} />
                <br />
                <br />
                <Typography style={{ color: "gray", marginTop: "2.625em" }}>
                  {tr("AccountManager.SkinView2DShort")}
                </Typography>
              </Box>
            )
          ) : (
            ""
          )}
          <RadioGroup
            row
            onChange={(e) => {
              if (["MZ", "AL", "YG"].includes(e.target.value)) {
                // @ts-ignore
                setChoice(e.target.value);
                localStorage.setItem(
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
              onBlur={(e) => {
                setBufPName(e.target.value); // Trigger reset
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
                  void (() => {
                    // @ts-ignore
                    window[SESSION_ACCESSDATA_CACHED_KEY] = false;
                    setMSLogout("ReadyToLaunch.MSLogoutRunning");
                    window.localStorage.setItem(
                      "MS.LoginWindowKey",
                      "alicorn_ms_login_" + new Date().getTime()
                    );
                    dropAccountPromise();
                    localStorage.setItem(MS_LAST_USED_REFRESH_KEY, "");
                    localStorage.setItem(MS_LAST_USED_ACTOKEN_KEY, "");
                    localStorage.setItem(MS_LAST_USED_UUID_KEY, "");
                    localStorage.setItem(MS_LAST_USED_USERNAME_KEY, "");
                    localStorage.removeItem(ACCOUNT_EXPIRES_KEY); // Reset time
                    localStorage.removeItem(ACCOUNT_LAST_REFRESHED_KEY);
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
                  sx={{ minWidth: "50%", color: "primary.main" }}
                  fullWidth
                  labelId={"Select-Account"}
                  onChange={(e) => {
                    if (e.target.value) {
                      setAccount(String(e.target.value));
                      localStorage.setItem(
                        LAST_YG_ACCOUNT_NAME + props.profileHash,
                        String(e.target.value)
                      );
                    }
                  }}
                  value={sAccount || Object.keys(accountMap.current).shift()}
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
                  localStorage.setItem(
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
    </ThemeProvider>
  );
}

function MiniJavaSelector(props: {
  hash: string;
  gameId: string;
  disabled: boolean;
  gameVersion: string;
}): JSX.Element {
  const classes = useFormStyles();
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
    <ThemeProvider
      theme={
        isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
      }
    >
      <Box
        className={classes.root}
        style={{
          marginTop: "0.3125em",
        }}
      >
        <FormControl variant={"outlined"} fullWidth>
          <InputLabel id={"Select-JRE"} className={classes.label}>
            {tr("JavaSelector.SelectJava")}
          </InputLabel>
          <Select
            label={tr("JavaSelector.SelectJava")}
            variant={"outlined"}
            labelId={"Select-JRE"}
            sx={{ color: "primary.main" }}
            color={"primary"}
            onChange={(e) => {
              const sj = String(e.target.value);
              setCurrentJava(sj);
              setJavaForProfile(props.hash, sj);
            }}
            fullWidth
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
          <br />
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
                color: "#ff8400",
              }}
              className={"smtxt"}
              gutterBottom
            >
              {tr("ReadyToLaunch.JCheck.Too" + c)}
            </Typography>
          );
        })()}
      </Box>
    </ThemeProvider>
  );
}

function setJavaForProfile(hash: string, jHome: string): void {
  localStorage[GKEY + hash] = jHome;
}

function getJavaAndCheckAvailable(hash: string, allowDefault = false): string {
  const t = localStorage[GKEY + hash];
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
  let b: string | undefined;
  if (LEGACY_VERSIONS.test(id)) {
    b = await getLegacyJDK();
  } else {
    if (MODERN_VERSIONS.test(id)) {
      b = await getNewJDK(16);
    } else {
      b = await getNewJDK(17);
    }
  }
  console.log("Configured java: " + b);
  return b || getDefaultJavaHome();
}

const LEGACY_VERSIONS = /^1\.([0-9]|1[0-2])([-.a-z].*?)?$/i;
const MODERN_VERSIONS = /^1\.(17|[2-9][0-9])(\.)?[0-9]*?/i;
const HIGH_VERSIONS = /^1\.(1[8-9]|[2-9][0-9])(\.)?[0-9]*?/i;

function checkJMCompatibility(mv: string, jv: number): "OLD" | "NEW" | "OK" {
  if (LEGACY_VERSIONS.test(mv) && jv > 8) {
    return "NEW";
  }
  if (MODERN_VERSIONS.test(mv) && jv < 16) {
    return "OLD";
  }
  if (HIGH_VERSIONS.test(mv) && jv < 17) {
    return "OLD";
  }
  return "OK";
}

function markReboot(hash: string): void {
  sessionStorage.setItem(REBOOT_KEY_BASE + hash, "1");
}

function clearReboot(hash: string): void {
  sessionStorage.removeItem(REBOOT_KEY_BASE + hash);
}

function isReboot(hash: string): boolean {
  return sessionStorage.getItem(REBOOT_KEY_BASE + hash) === "1";
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
          <>
            <br />
            <DialogContentText sx={{ color: "primary.main" }}>
              {tr("ReadyToLaunch.HoofoffCode", `Code=${code}`)}
            </DialogContentText>
            <br />
          </>
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
        <Tooltip
          title={
            <Typography className={"smtxt"}>
              {tr("ReadyToLaunch.RequirePremiumDesc")}
            </Typography>
          }
        >
          <FormControlLabel
            control={
              <Checkbox
                color={"primary"}
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
                sessionStorage.setItem(CODE_KEY + props.port, c);
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
      sx={{
        flexGrow: 1,
        fontSize: "medium",
        color: "secondary.main",
      }}
      gutterBottom
    >
      {hint}
    </Typography>
  );
}

function setProfileRelatedID(hash: string, rid: string): void {
  sessionStorage.setItem("MinecraftID" + hash, rid);
}

function getProfileRelatedID(hash: string): string {
  return sessionStorage.getItem("MinecraftID" + hash) || "";
}

const CODE_REGEX = /(?<=\?code=)[^&]+/gi;

function AskURLDialog(): JSX.Element {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fun = () => {
      setOpen(true);
    };
    window.addEventListener("OpenAskUrlDialog", fun);
    return () => {
      window.removeEventListener("OpenAskUrlDialog", fun);
    };
  }, []);
  return (
    <ThemeProvider
      theme={
        isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
      }
    >
      <Dialog
        open={open}
        onClose={() => {
          window.dispatchEvent(new CustomEvent("UrlAskCancelled"));
          setOpen(false);
        }}
      >
        <DialogTitle>{tr("ReadyToLaunch.LoginStepTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{tr("ReadyToLaunch.LoginStep")}</DialogContentText>
          <br />
          <DialogContentText>{tr("ReadyToLaunch.URLEnter")}</DialogContentText>
          <TextField
            autoFocus
            margin={"dense"}
            onChange={(e) => {
              setUrl(e.target.value);
            }}
            type={"url"}
            spellCheck={false}
            color={"primary"}
            fullWidth
            variant={"outlined"}
            value={url}
          />
        </DialogContent>
        <DialogActions>
          <Button
            disabled={!CODE_REGEX.test(url)}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("UrlAsked", { detail: url })
              );
              setUrl("");
              setOpen(false);
            }}
          >
            {tr("ReadyToLaunch.AcceptLogin")}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
