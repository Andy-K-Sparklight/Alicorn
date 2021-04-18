import {
  Box,
  createStyles,
  LinearProgress,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { GameProfile } from "../modules/profile/GameProfile";
import { MinecraftContainer } from "../modules/container/MinecraftContainer";
import React, { useEffect, useState } from "react";
import { Account } from "../modules/auth/Account";
import { randsl, tr } from "./Translator";
import { useParams } from "react-router";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { getContainer } from "../modules/container/ContainerUtil";
import { MicrosoftAccount } from "../modules/auth/MicrosoftAccount";

// UNCHECKED

const useStyles = makeStyles((theme) =>
  createStyles({
    text: {
      fontSize: "medium",
      flexGrow: 1,
      color: theme.palette.secondary.main,
    },
    root: {
      marginLeft: theme.spacing(4),
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
  // 0: Not loaded 1: OK 2: Error
  const { id, container } = useParams<{ id: string; container: string }>();
  useEffect(() => {
    if (!profileLoadedBit) {
      (async () => {
        try {
          setProfile(await loadProfile(id, getContainer(container)));
          setLoaded(1);
        } catch {
          setLoaded(2);
        }
      })();
    }
  });
  // TODO add java executable and account choosing
  return profileLoadedBit === 1 ? (
    <Launching
      profile={coreProfile}
      container={getContainer(container)}
      jExecutable={""}
      account={new MicrosoftAccount("")}
    />
  ) : (
    <LinearProgress color={"secondary"} style={{ width: "80%" }} />
  );
}

function Launching(props: {
  profile: GameProfile;
  container: MinecraftContainer;
  jExecutable: string;
  account: Account;
}): JSX.Element {
  const classes = useStyles();
  const [status, setStatus] = useState(LaunchingStatus.PENDING);
  const [hint, setHint] = useState(randsl("ReadyToLaunch.WaitingText"));
  useEffect(() => {
    const timer = setInterval(() => {
      setHint(randsl("ReadyToLaunch.WaitingText"));
    }, 5000);
    return () => {
      clearInterval(timer);
    };
  });
  return (
    <Box className={classes.root}>
      <Typography className={classes.text} gutterBottom>
        {tr("ReadyToLaunch.Hint") + " " + props.profile.id}
      </Typography>
      <Typography variant={"h6"} className={classes.primaryText} gutterBottom>
        {tr("ReadyToLaunch.Status." + status)}
      </Typography>
      <Typography className={classes.text} gutterBottom>
        {hint}
      </Typography>
    </Box>
  );
}

enum LaunchingStatus {
  PENDING = "Pending",
  LIBRARIES_FILLING = "CheckingLibs",
  ASSETS_FILLING = "CheckingAssets",
  ACCOUNT_AUTHING = "PerformingAuth",
  ARGS_GENERATING = "GeneratingArgs",
  DONE = "Finished",
}
