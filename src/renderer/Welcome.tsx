import { Box, Fab, Typography } from "@material-ui/core";
import { FlightTakeoff, GetApp, History } from "@material-ui/icons";
import React, { useEffect, useState } from "react";
import { getContainer } from "../modules/container/ContainerUtil";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { jumpTo, triggerSetPage } from "./GoTo";
import { LAST_SUCCESSFUL_GAME_KEY } from "./ReadyToLaunch";
import { ALICORN_DEFAULT_THEME_DARK } from "./Renderer";
import { useTextStyles } from "./Stylex";
import { randsl, tr } from "./Translator";
export function Welcome(): JSX.Element {
  const classes = useTextStyles();
  const [refreshBit, setRefresh] = useState(false);
  const [lastGameAvailable, setLastGameAvailable] = useState(false);
  useEffect(() => {
    const i = setInterval(() => {
      setRefresh(!refreshBit);
    }, 5000);
    return () => {
      clearInterval(i);
    };
  });
  useEffect(() => {
    void (async () => {
      const l = window.localStorage.getItem(LAST_SUCCESSFUL_GAME_KEY);
      if (l) {
        const h = l.split("/");
        while (h.shift()?.toLowerCase() !== "readytolaunch") {}
        const c = h.shift();
        const i = h.shift();
        if (c) {
          if (i) {
            try {
              await loadProfile(i, getContainer(c), true);
              setLastGameAvailable(true);
            } catch {}
          }
        }
      }
    })();
  }, []);

  return (
    <Box
      style={{
        textAlign: "center",
        marginTop: "10%",
      }}
      className={classes.root}
    >
      <br />
      <Typography color={"primary"} className={classes.firstText} gutterBottom>
        {randsl("Welcome.Suggest.Part1")}
      </Typography>
      <br />
      <Box
        onClick={() => {
          setRefresh(!refreshBit);
        }}
      >
        <Typography
          color={"secondary"}
          className={classes.secondText}
          gutterBottom
        >
          <b
            style={{
              color: ALICORN_DEFAULT_THEME_DARK.palette.primary.main,
              fontSize: "larger",
            }}
          >
            {"> "}
          </b>
          {randsl("Welcome.TipName")}
          {randsl("Welcome.Tips")}
          <b
            style={{
              color: ALICORN_DEFAULT_THEME_DARK.palette.primary.main,
              fontSize: "larger",
            }}
          >
            {" <"}
          </b>
        </Typography>
      </Box>
      <br />
      <Box
        style={{
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <RoundBtn
          disabled={false}
          onClick={() => {
            jumpTo("/InstallCore");
            triggerSetPage("InstallCore");
          }}
          icon={<GetApp />}
          short={tr("Welcome.Short.Install")}
        />
        <RoundBtn
          disabled={!lastGameAvailable}
          onClick={() => {
            jumpTo(
              window.localStorage.getItem(LAST_SUCCESSFUL_GAME_KEY) ||
                "/ReadyToLaunch/undefined/undefined"
            );
            triggerSetPage("ReadyToLaunch");
          }}
          icon={<History />}
          short={tr("Welcome.Short.LastLaunch")}
        />
        <RoundBtn
          disabled={false}
          onClick={() => {
            jumpTo("/LaunchPad");
            triggerSetPage("LaunchPad");
          }}
          icon={<FlightTakeoff />}
          short={tr("Welcome.Short.LaunchPad")}
        />
      </Box>
    </Box>
  );
}

function RoundBtn(props: {
  disabled: boolean;
  onClick: () => unknown;
  icon: JSX.Element;
  short: string;
}): JSX.Element {
  return (
    <Box style={{ display: "inline", marginLeft: "8px" }}>
      <Fab
        variant={"extended"}
        size={"medium"}
        disabled={props.disabled}
        color={"primary"}
        onClick={props.onClick}
      >
        {props.icon}
        {<span style={{ marginLeft: "5px" }}>{props.short}</span>}
      </Fab>
    </Box>
  );
}
