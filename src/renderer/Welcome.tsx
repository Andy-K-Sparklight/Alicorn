import { FlightTakeoff, GetApp, History } from "@mui/icons-material";
import { Box, Fab, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { getBoolean } from "../modules/config/ConfigSupport";
import { getContainer } from "../modules/container/ContainerUtil";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { jumpTo, triggerSetPage } from "./GoTo";
import { ShiftEle } from "./Instruction";
import { LAST_SUCCESSFUL_GAME_KEY } from "./ReadyToLaunch";
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
      const l = localStorage.getItem(LAST_SUCCESSFUL_GAME_KEY);
      if (l) {
        const h = l.split("/");
        while (h.length > 0 && h.shift()?.toLowerCase() !== "readytolaunch") {}
        const c = decodeURIComponent(h.shift() || "undefined");
        const i = decodeURIComponent(h.shift() || "undefined");
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
      sx={{
        textAlign: "center",
        marginTop: "8%",
      }}
      className={classes.root}
    >
      <br />
      <Typography
        color={"primary"}
        variant={"h6"}
        className={classes.firstText}
        gutterBottom
      >
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
              color: "primary.main",
              fontSize: "larger",
            }}
          >
            {"> "}
          </b>
          {randsl("Welcome.TipName")}
          {randsl("Welcome.Tips")}
          <b
            style={{
              color: "primary.main",
              fontSize: "larger",
            }}
          >
            {" <"}
          </b>
        </Typography>
      </Box>
      <br />
      <Box
        sx={{
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ShiftEle name={"MainMenuQuickAccess"}>
          <>
            <ShiftEle name={"MainMenuInstallCore"}>
              <RoundBtn
                disabled={false}
                onClick={() => {
                  jumpTo("/InstallCore");
                  triggerSetPage("InstallCore");
                }}
                icon={<GetApp />}
                short={tr("Welcome.Short.Install")}
              />
            </ShiftEle>
            <RoundBtn
              disabled={!lastGameAvailable}
              onClick={() => {
                jumpTo(
                  localStorage.getItem(LAST_SUCCESSFUL_GAME_KEY) ||
                    "/ReadyToLaunch/undefined/undefined"
                );
                triggerSetPage("ReadyToLaunch");
              }}
              highlight
              icon={<History />}
              short={tr("Welcome.Short.LastLaunch")}
            />
            <ShiftEle name={"MainMenuLaunchPad"}>
              <RoundBtn
                disabled={false}
                onClick={() => {
                  jumpTo("/LaunchPad");
                  triggerSetPage("LaunchPad");
                }}
                icon={<FlightTakeoff />}
                short={tr("Welcome.Short.LaunchPad")}
              />
            </ShiftEle>
          </>
        </ShiftEle>
      </Box>
      <Box sx={{ marginTop: "10%" }}>
        <SpecialKnowledge />
      </Box>
    </Box>
  );
}

function RoundBtn(props: {
  disabled: boolean;
  onClick: () => unknown;
  icon: JSX.Element;
  short: string;
  highlight?: boolean;
}): JSX.Element {
  return (
    <Box
      sx={{
        display: "inline",
        marginLeft: "0.5em",
      }}
    >
      <Fab
        variant={"extended"}
        size={"medium"}
        disabled={props.disabled}
        color={props.highlight ? "secondary" : "primary"}
        onClick={props.onClick}
      >
        {props.icon}
        {<span style={{ marginLeft: "0.3125em" }}>{props.short}</span>}
      </Fab>
    </Box>
  );
}

export function SpecialKnowledge(): JSX.Element {
  const [currentItem, setCurrentItem] = useState<string>(
    randsl("Welcome.Knowledges")
  );
  const timer = useRef<NodeJS.Timeout>();
  useEffect(() => {
    timer.current = setInterval(() => {
      setCurrentItem(randsl("Welcome.Knowledges"));
    }, 10000);
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, []);
  if (!getBoolean("features.miniwiki")) {
    return <></>;
  }
  const [a, b] = currentItem.split("|");
  return (
    <Box
      sx={{
        color: "primary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineBreak: "auto",
        overflow: "hidden",
        maxWidth: "90%",
        marginLeft: "5%",
      }}
      onClick={() => {
        setCurrentItem(randsl("Welcome.Knowledges"));
        if (timer.current) {
          clearInterval(timer.current);
        }
        timer.current = setInterval(() => {
          setCurrentItem(randsl("Welcome.Knowledges"));
        }, 10000);
      }}
    >
      <span
        style={{ fontSize: "x-large", marginRight: "0.75em" }}
        dangerouslySetInnerHTML={{ __html: a }}
      />
      <span style={{ fontSize: "xxx-large" }}>|</span>
      <span
        style={{
          fontSize: "small",
          maxWidth: "80%",
          marginLeft: "0.75em",
          textAlign: "left",
        }}
        dangerouslySetInnerHTML={{ __html: b }}
      />
    </Box>
  );
}
