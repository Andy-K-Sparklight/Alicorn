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
import { GameProfile } from "../modules/profile/GameProfile";
import { MinecraftContainer } from "../modules/container/MinecraftContainer";
import React, { useEffect, useRef, useState } from "react";
import { randsl, tr } from "./Translator";
import { useParams } from "react-router";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { getContainer } from "../modules/container/ContainerUtil";
import { MicrosoftAccount } from "../modules/auth/MicrosoftAccount";
import {
  getJavaInfoRaw,
  getJavaRunnable,
  getLastUsedJavaHome,
  parseJavaInfo,
  parseJavaInfoRaw,
} from "../modules/java/JInfo";
import { FlightTakeoff } from "@material-ui/icons";
import objectHash from "object-hash";
import {
  ensureAllAssets,
  ensureAssetsIndex,
  ensureClient,
  ensureLibraries,
  ensureLog4jFile,
  ensureNatives,
} from "../modules/launch/Ensurance";
import { launchProfile } from "../modules/launch/LaunchPad";
import EventEmitter from "events";
import {
  PROCESS_END_GATE,
  PROCESS_LOG_GATE,
  ReleaseType,
} from "../modules/commons/Constants";
import { prepareModsCheckFor, restoreMods } from "../modules/modx/DynModLoad";
import { LocalAccount } from "../modules/auth/LocalAccount";
import { AbstractGameAccount } from "../modules/auth/Account";
import { useInputStyles } from "./Stylex";
import { isNull } from "../modules/commons/Null";
import {
  AccountType,
  fillAccessData,
  getAllAccounts,
  loadAccount,
} from "../modules/auth/AccountUtil";
import { AuthlibAccount } from "../modules/auth/AuthlibAccount";
import { prefetchData } from "../modules/auth/AJHelper";
import { toReadableType } from "./YggdrasilAccountManager";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { LaunchTracker } from "../modules/launch/Tracker";
import { schedulePromiseTask } from "./Schedule";
import {
  getWrapperStatus,
  WrapperStatus,
} from "../modules/download/DownloadWrapper";
import { getNumber, getString } from "../modules/config/ConfigSupport";
import { scanReports } from "../modules/crhelper/CrashReportFinder";
import { findNotIn } from "../modules/commons/Collections";
import { YNDialog } from "./OperatingHint";
import { jumpTo, Pages, triggerSetPage } from "./GoTo";
import { ipcRenderer } from "electron";

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
        const d = await schedulePromiseTask(() =>
          loadProfile(id, getContainer(container))
        );
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

  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      {profileLoadedBit === 1 ? (
        <Launching
          profile={coreProfile}
          container={getContainer(container)}
          server={server}
        />
      ) : (
        <LinearProgress color={"secondary"} style={{ width: "80%" }} />
      )}
    </MuiThemeProvider>
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
  const [runID, setID] = useState("");
  const [status, setStatus] = useState(LaunchingStatus.PENDING);
  const [hint, setHint] = useState(randsl("ReadyToLaunch.WaitingText"));
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<AbstractGameAccount>();
  const [selecting, setSelecting] = useState<boolean>(false);
  const [allAccounts, setAccounts] = useState<Set<AbstractGameAccount>>(
    new Set<AbstractGameAccount>()
  );
  const [wrapperStatus, setWrapperStatus] = useState<WrapperStatus>();
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
      const builtAccount: Set<AbstractGameAccount> =
        new Set<AbstractGameAccount>();
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
    const tm = setInterval(() => {
      setWrapperStatus(getWrapperStatus);
    }, 1000);
    return () => {
      clearInterval(tm);
    };
  });
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
              },
              props.profile,
              props.container,
              setID,
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
        {tr("ReadyToLaunch.Hint") + " " + props.profile.id}
      </Typography>
      <Typography variant={"h6"} className={classes.primaryText} gutterBottom>
        {tr("ReadyToLaunch.Status." + status)}
        {status === LaunchingStatus.FINISHED ? " " + runID : ""}
        {status !== LaunchingStatus.PENDING &&
        status !== LaunchingStatus.FINISHED
          ? ""
          : ""}
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
        <Typography className={classes.text} gutterBottom>
          {`${tr("ReadyToLaunch.InStack")}${wrapperStatus?.inStack}/${getNumber(
            "download.concurrent.max-tasks"
          )} ${tr("ReadyToLaunch.Pending")}${wrapperStatus?.pending}`}
        </Typography>
      )}

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
                },
                props.profile,
                props.container,
                setID,
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
  container: MinecraftContainer,
  setID: (id: string) => unknown,
  account: AbstractGameAccount,
  server?: string
): Promise<LaunchTracker> {
  // @ts-ignore
  window[LAST_FAILURE_INFO_KEY] = undefined;
  // @ts-ignore
  window[LAST_LAUNCH_REPORT_KEY] = undefined;
  // @ts-ignore
  window[LAST_LOGS_KEY] = [];

  const GLOBAL_LAUNCH_TRACKER = new LaunchTracker();
  const jRunnable = await getJavaRunnable(getLastUsedJavaHome());
  const FAILURE_INFO: MCFailureInfo = {
    container: container,
    tracker: GLOBAL_LAUNCH_TRACKER,
    profile: profile,
  };
  setStatus(LaunchingStatus.ACCOUNT_AUTHING);
  if (account.type === AccountType.MICROSOFT) {
    await account.performAuth("");
  }
  const acData = await fillAccessData(await account.buildAccessData());
  let useAj = false;
  let ajHost = "";
  let prefetch = "";
  if (account.type === AccountType.AUTHLIB_INJECTOR) {
    useAj = true;
    ajHost = (account as AuthlibAccount).authServer;
    prefetch = await prefetchData((account as AuthlibAccount).authServer);
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
  });
  setID(runID);
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
  onChose: (a: AbstractGameAccount) => unknown;
  allAccounts: Set<AbstractGameAccount>;
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
  const [choice, setChoice] = useState<"MZ" | "AL" | "YG">("MZ");
  const [pName, setName] = useState<string>(
    window.localStorage.getItem(LAST_USED_USER_NAME_KEY) || "Demo"
  );
  const mounted = useRef<boolean>(false);
  const [sAccount, setAccount] = useState<string>("");
  const accountMap: Record<string, AbstractGameAccount> = {};
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
        <TextField
          className={classes.input}
          autoFocus
          style={choice === "AL" ? {} : { display: "none" }}
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
