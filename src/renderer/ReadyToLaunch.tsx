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
import { FlightTakeoff } from "@material-ui/icons";
import { ipcRenderer } from "electron";
import EventEmitter from "events";
import objectHash from "object-hash";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Account } from "../modules/auth/Account";
import {
  AccountType,
  fillAccessData,
  getAllAccounts,
  loadAccount,
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
import { findNotIn } from "../modules/commons/Collections";
import {
  PROCESS_END_GATE,
  PROCESS_LOG_GATE,
  ReleaseType,
} from "../modules/commons/Constants";
import { isNull } from "../modules/commons/Null";
import { getNumber, getString } from "../modules/config/ConfigSupport";
import { getContainer } from "../modules/container/ContainerUtil";
import { MinecraftContainer } from "../modules/container/MinecraftContainer";
import { scanReports } from "../modules/crhelper/CrashReportFinder";
import {
  getWrapperStatus,
  subscribeWrapperUpdate,
  unsubscribeWrapperUpdate,
} from "../modules/download/DownloadWrapper";
import {
  getAllJava,
  getJavaInfoRaw,
  getJavaRunnable,
  getLastUsedJavaHome,
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
import { LaunchTracker } from "../modules/launch/Tracker";
import { prepareModsCheckFor, restoreMods } from "../modules/modx/DynModLoad";
import { GameProfile } from "../modules/profile/GameProfile";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { jumpTo, Pages, setChangePageWarn, triggerSetPage } from "./GoTo";
import { YNDialog } from "./OperatingHint";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { fullWidth, useFormStyles, useInputStyles } from "./Stylex";
import { randsl, tr } from "./Translator";
import { toReadableType } from "./YggdrasilAccountManager";

export const LAST_SUCCESSFUL_GAME_KEY = "ReadyToLaunch.LastSuccessfulGame";

const useStyles = makeStyles((theme) =>
  createStyles({
    stepper: {
      backgroundColor: theme.palette.secondary.light,
    },
    textSP: {
      fontSize: "small",
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

    (async () => {
      try {
        const d = await loadProfile(id, getContainer(container));
        if (mounted.current) {
          setProfile(d);
          setLoaded(1);
        }
      } catch {
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
  console.log("Re-renderering launching component!");
  const classes = useStyles();
  const mountedBit = useRef<boolean>(true);
  const [warning, setWarning] = useState(false);

  const [status, setStatus] = useState(LaunchingStatus.PENDING);
  const [hint, setHint] = useState(randsl("ReadyToLaunch.WaitingText"));
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [selecting, setSelecting] = useState<boolean>(false);
  const [allAccounts, setAccounts] = useState<Set<Account>>(new Set<Account>());
  const [refreshWrapperBit, refreshWrapper] = useState<boolean>(false);
  const profileHash = useRef<string>(objectHash(props.profile));
  useEffect(() => {
    const timer = setInterval(() => {
      setHint(randsl("ReadyToLaunch.WaitingText"));
    }, 5000);
    return () => {
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    mountedBit.current = true;
    (async () => {
      const a = await getAllAccounts();
      const builtAccount: Set<Account> = new Set<Account>();
      for (const accountFile of a) {
        const r = await loadAccount(accountFile);
        if (r) {
          builtAccount.add(r);
        }
      }
      if (mountedBit.current) {
        setAccounts(builtAccount);
      }
    })();
  }, []);
  useEffect(() => {
    subscribeWrapperUpdate("ReadyToLaunch", () => {
      refreshWrapper(!refreshWrapperBit);
    });
    return () => {
      unsubscribeWrapperUpdate("ReadyToLaunch");
    };
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
    "CheckingLibs",
    "CheckingAssets",
    "PreparingMods",
    "GeneratingArgs",
    "Finished",
  ];
  const REV_LAUNCH_STEPS = {
    Pending: 0,
    PerformingAuth: 1,
    CheckingLibs: 2,
    CheckingAssets: 3,
    PreparingMods: 4,
    GeneratingArgs: 5,
    Finished: 6,
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
          (async () => {
            // @ts-ignore
            window[LAST_LAUNCH_REPORT_KEY] = await startBoot(
              (st) => {
                setStatus(st);
                setActiveStep(REV_LAUNCH_STEPS[st]);
                setChangePageWarn(st !== LaunchingStatus.PENDING);
              },
              props.profile,
              profileHash.current,
              props.container,
              a,
              props.server
            );
          })();
        }}
        allAccounts={allAccounts}
      />
      {warning ? (
        <YNDialog
          onClose={() => {
            setWarning(false);
          }}
          onAccept={() => {
            triggerSetPage(Pages.CrashReportDisplay);
            jumpTo("/CrashReportDisplay");
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
            <Step key={objectHash(s)}>
              <StepLabel>
                <Typography className={classes.textSP}>
                  {tr("ReadyToLaunch.Status.Short." + s)}
                </Typography>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
      {status === LaunchingStatus.PENDING ||
      status === LaunchingStatus.FINISHED ? (
        ""
      ) : (
        <LinearProgress color={"secondary"} />
      )}
      {/* Insert Here */}
      {status === LaunchingStatus.PENDING ||
      status === LaunchingStatus.FINISHED ? (
        ""
      ) : (
        <Box>
          <Typography className={classes.text} gutterBottom>
            {tr(
              "ReadyToLaunch.Progress",
              `Current=${getWrapperStatus().inStack}`,
              `BufferMax=${getNumber("download.concurrent.max-tasks")}`,
              `Pending=${getWrapperStatus().pending}`
            )}
          </Typography>
          <Typography className={classes.text} gutterBottom>
            {getWrapperStatus().doing}
          </Typography>
        </Box>
      )}

      <MiniJavaSelector
        hash={profileHash.current}
        gameId={props.profile.id}
        disabled={
          status !== LaunchingStatus.PENDING &&
          status !== LaunchingStatus.FINISHED
        }
      />

      <Typography className={classes.text} gutterBottom>
        {hint}
      </Typography>
      <Tooltip
        title={
          status === LaunchingStatus.FINISHED
            ? tr("ReadyToLaunch.Restart")
            : tr("ReadyToLaunch.Start")
        }
      >
        <Fab
          color={"primary"}
          disabled={
            status !== LaunchingStatus.PENDING &&
            status !== LaunchingStatus.FINISHED
          }
          onClick={async () => {
            if (selectedAccount !== undefined) {
              // @ts-ignore
              window[LAST_LAUNCH_REPORT_KEY] = await startBoot(
                (st) => {
                  setStatus(st);
                  setActiveStep(REV_LAUNCH_STEPS[st]);
                  setChangePageWarn(st !== LaunchingStatus.PENDING);
                },
                props.profile,
                profileHash.current,
                props.container,
                selectedAccount,
                props.server
              );
            } else {
              setSelecting(true);
            }
          }}
        >
          <FlightTakeoff />
        </Fab>
      </Tooltip>
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
// When Minecraft quit, this function will post an event 'mcFailure'
// In its detail contains crash report (if found)
async function startBoot(
  setStatus: (status: LaunchingStatus) => void,
  profile: GameProfile,
  profileHash: string,
  container: MinecraftContainer,
  account: Account,
  server?: string
): Promise<LaunchTracker> {
  // @ts-ignore
  window[LAST_FAILURE_INFO_KEY] = undefined;
  // @ts-ignore
  window[LAST_LAUNCH_REPORT_KEY] = undefined;
  // @ts-ignore
  window[LAST_LOGS_KEY] = [];

  const GLOBAL_LAUNCH_TRACKER = new LaunchTracker();
  const jRunnable = await getJavaRunnable(
    getJavaAndCheckAvailable(profileHash)
  );
  const FAILURE_INFO: MCFailureInfo = {
    container: container,
    tracker: GLOBAL_LAUNCH_TRACKER,
    profile: profile,
  };
  setStatus(LaunchingStatus.ACCOUNT_AUTHING);
  if (account.type === AccountType.MICROSOFT) {
    if (!(await account.isAccessTokenValid())) {
      // Check if the access token is valid
      await account.performAuth("");
    }
  } else if (account.type !== AccountType.ALICORN) {
    if (!(await account.isAccessTokenValid())) {
      await account.flushToken(); // Don't know whether this will work or not
    }
  }
  const acData = await fillAccessData(await account.buildAccessData());
  let useAj = false;
  let ajHost = "";
  let prefetch = "";
  let useNd = false;
  let ndServerId = "";
  if (account.type === AccountType.AUTHLIB_INJECTOR) {
    useAj = true;
    ajHost = (account as AuthlibAccount).authServer;
    prefetch = await prefetchData((account as AuthlibAccount).authServer);
  } else if (account.type === AccountType.NIDE8) {
    useNd = true;
    ndServerId = (account as Nide8Account).serverId;
  }
  let useServer = false;
  let serverHost = "";
  if (typeof server === "string" && server.length > 0) {
    useServer = true;
    serverHost = server.trim();
  }

  setStatus(LaunchingStatus.LIBRARIES_FILLING);

  await ensureClient(profile);
  await ensureLog4jFile(profile, container);
  await ensureLibraries(profile, container, GLOBAL_LAUNCH_TRACKER);
  await ensureNatives(profile, container);
  setStatus(LaunchingStatus.ASSETS_FILLING);
  await ensureAssetsIndex(profile, container);
  await ensureAllAssets(profile, container, GLOBAL_LAUNCH_TRACKER);
  setStatus(LaunchingStatus.MODS_PREPARING);
  if (profile.type === ReleaseType.MODIFIED) {
    await prepareModsCheckFor(profile, container, GLOBAL_LAUNCH_TRACKER);
  }
  setStatus(LaunchingStatus.ARGS_GENERATING);
  const originCrashLogs = await scanReports(container);
  const jInfo = parseJavaInfo(
    parseJavaInfoRaw(await getJavaInfoRaw(getLastUsedJavaHome()))
  );
  GLOBAL_LAUNCH_TRACKER.java({
    runtime: jInfo.runtime,
    version: jInfo.rootVersion,
  });
  const em = new EventEmitter();
  em.on(PROCESS_LOG_GATE, (d) => {
    // @ts-ignore
    window[LAST_LOGS_KEY].push(d);
    console.log(d);
  });
  em.on(PROCESS_END_GATE, async (c) => {
    console.log(`Minecraft(${runID}) exited with exit code ${c}.`);
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
    } else {
      window.localStorage.setItem(
        LAST_SUCCESSFUL_GAME_KEY,
        window.location.hash
      );
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
  });

  setStatus(LaunchingStatus.FINISHED);
  console.log(`A new Minecraft instance (${runID}) has been launched.`);
  return GLOBAL_LAUNCH_TRACKER;
}

enum LaunchingStatus {
  PENDING = "Pending",
  ACCOUNT_AUTHING = "PerformingAuth",
  LIBRARIES_FILLING = "CheckingLibs",
  ASSETS_FILLING = "CheckingAssets",
  MODS_PREPARING = "PreparingMods",
  ARGS_GENERATING = "GeneratingArgs",
  FINISHED = "Finished",
}

function AccountChoose(props: {
  open: boolean;
  closeFunc: () => void;
  onChose: (a: Account) => unknown;
  allAccounts: Set<Account>;
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
  console.log("Re-renderering account choose!");
  const [choice, setChoice] = useState<"MZ" | "AL" | "YG">("MZ");
  const [pName, setName] = useState<string>(
    window.localStorage.getItem(LAST_USED_USER_NAME_KEY) || "Demo"
  );
  const mounted = useRef<boolean>(false);
  const [sAccount, setAccount] = useState<string>("");
  const accountMap: Record<string, Account> = {};
  const [msLogout, setMSLogout] = useState<
    | "ReadyToLaunch.MSLogout"
    | "ReadyToLaunch.MSLogoutRunning"
    | "ReadyToLaunch.MSLogoutDone"
  >("ReadyToLaunch.MSLogout");
  for (const a of props.allAccounts) {
    accountMap[objectHash(a)] = a;
  }
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
        setChoice("MZ");
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
                (async () => {
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
                window.localStorage.setItem(LAST_USED_USER_NAME_KEY, pName);
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
    (async () => {
      const ji = parseJavaInfo(
        parseJavaInfoRaw(
          await getJavaInfoRaw(
            currentJava === DEF
              ? getJavaAndCheckAvailable(props.hash)
              : currentJava
          )
        )
      );
      loaded.current = true;
      if (mounted.current) {
        setCurrentJavaVersion(ji.rootVersion);
      }
    })();
  }, [currentJava]);
  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <Box className={classes.root}>
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
          const c = checkJMCompatibility(props.gameId, currentJavaVersion);
          if (c === "OK") {
            return "";
          }
          return (
            <Typography
              style={{ fontSize: "small", color: "#ff8400" }}
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
      return getLastUsedJavaHome();
    }
    if (getAllJava().includes(t)) {
      return t;
    }
  }
  if (allowDefault) {
    return DEF;
  }
  return getLastUsedJavaHome();
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
