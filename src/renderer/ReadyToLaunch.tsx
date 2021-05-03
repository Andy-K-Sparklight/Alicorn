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
import { getJavaRunnable, getLastUsedJavaHome } from "../modules/java/JInfo";
import { FlightTakeoff } from "@material-ui/icons";
import objectHash from "object-hash";
import {
  ensureAllAssets,
  ensureAssetsIndex,
  ensureClient,
  ensureLibraries,
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
import { Account } from "../modules/auth/Account";
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
import { toReadableType } from "./AccountManager";

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

export function ReadyToLaunch(): JSX.Element {
  const [coreProfile, setProfile] = useState(new GameProfile({}));
  const [profileLoadedBit, setLoaded] = useState(0);
  const { id, container } = useParams<{ id: string; container: string }>();
  const mounted = useRef<boolean>();

  useEffect(() => {
    mounted.current = true;
    if (!profileLoadedBit) {
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
    }
    return () => {
      mounted.current = false;
    };
  });
  // TODO add java executable and account choosing
  return profileLoadedBit === 1 ? (
    <Launching profile={coreProfile} container={getContainer(container)} />
  ) : (
    <LinearProgress color={"secondary"} style={{ width: "80%" }} />
  );
}

function Launching(props: {
  profile: GameProfile;
  container: MinecraftContainer;
}): JSX.Element {
  const classes = useStyles();
  const mountedBit = useRef<boolean>(true);
  const [runID, setID] = useState("");
  const [status, setStatus] = useState(LaunchingStatus.PENDING);
  const [hint, setHint] = useState(randsl("ReadyToLaunch.WaitingText"));
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [selecting, setSelecting] = useState<boolean>(false);
  const [allAccounts, setAccounts] = useState<Set<Account>>(new Set<Account>());
  useEffect(() => {
    const timer = setInterval(() => {
      setHint(randsl("ReadyToLaunch.WaitingText"));
    }, 5000);
    return () => {
      clearInterval(timer);
    };
  });
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
            await startBoot(
              (st) => {
                setStatus(st);
                setActiveStep(REV_LAUNCH_STEPS[st]);
              },
              props.profile,
              props.container,
              setID,
              a
            );
          })();
        }}
        allAccounts={allAccounts}
      />
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
              await startBoot(
                (st) => {
                  setStatus(st);
                  setActiveStep(REV_LAUNCH_STEPS[st]);
                },
                props.profile,
                props.container,
                setID,
                selectedAccount
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

// TODO support java select
async function startBoot(
  setStatus: (status: LaunchingStatus) => void,
  profile: GameProfile,
  container: MinecraftContainer,
  setID: (id: string) => unknown,
  account: Account
): Promise<void> {
  const jRunnable = getJavaRunnable(getLastUsedJavaHome());
  setStatus(LaunchingStatus.ACCOUNT_AUTHING);
  const acData = await fillAccessData(await account.buildAccessData());
  let useAj = false;
  let ajHost = "";
  let prefetch = "";
  if (account.type === AccountType.AUTHLIB_INJECTOR) {
    useAj = true;
    ajHost = (account as AuthlibAccount).authServer;
    prefetch = await prefetchData((account as AuthlibAccount).authServer);
  }

  setStatus(LaunchingStatus.LIBRARIES_FILLING);

  await ensureClient(profile);
  await ensureLibraries(profile, container);
  await ensureNatives(profile, container);
  setStatus(LaunchingStatus.ASSETS_FILLING);
  await ensureAssetsIndex(profile, container);
  await ensureAllAssets(profile, container);
  setStatus(LaunchingStatus.MODS_PREPARING);
  if (profile.type === ReleaseType.MODIFIED) {
    await prepareModsCheckFor(profile, container);
  }
  setStatus(LaunchingStatus.ARGS_GENERATING);
  const em = new EventEmitter();

  const runID = launchProfile(profile, container, jRunnable, acData, em, {
    useAj: useAj,
    ajHost: ajHost,
    ajPrefetch: prefetch,
    useServer: false,
  });
  setID(runID);
  setStatus(LaunchingStatus.FINISHED);
  console.log(`A new Minecraft instance (${runID}) has been launched.`);
  em.on(PROCESS_LOG_GATE, (d) => {
    console.log(d);
  });
  em.on(PROCESS_END_GATE, async (c) => {
    console.log(`Minecraft(${runID}) exited with exit code ${c}.`);
    setStatus(LaunchingStatus.PENDING);
    console.log("Restoring mods...");
    await restoreMods(container);
    console.log("Done!");
  });
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

// FIXME what's the matter with aj?
// Just crashed because java cannot load it!
function AccountChoose(props: {
  open: boolean;
  closeFunc: () => void;
  onChose: (a: Account) => unknown;
  allAccounts: Set<Account>;
}): JSX.Element {
  const classes = useInputStyles();
  const [choice, setChoice] = useState<"MZ" | "AL" | "YG">("MZ");
  const [pName, setName] = useState<string>("Demo");
  const [sAccount, setAccount] = useState<string>("");
  const accountMap: Record<string, Account> = {};
  for (const a of props.allAccounts) {
    accountMap[objectHash(a)] = a;
  }
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
            control={<Radio />}
            label={tr("ReadyToLaunch.UseMZ")}
          />
          <FormControlLabel
            value={"YG"}
            control={<Radio />}
            label={tr("ReadyToLaunch.UseYG")}
          />
          <FormControlLabel
            value={"AL"}
            control={<Radio />}
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
