import { Check, CloudOff } from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
import { ipcRenderer } from "electron";
import React, { useEffect, useRef, useState } from "react";
import { useTextStyles } from "../Stylex";
import { tr } from "../Translator";
export function NetCheck(): JSX.Element {
  return (
    <>
      <TestReachable
        site={
          "https://cdn.jsdelivr.net/gh/Andy-K-Sparklight/Alicorn@main/package.json"
        }
        name={"AlicornUpdate"}
      />
      <TestReachable
        site={"https://bmclapi2.bangbang93.com/mc/game/version_manifest.json"}
        name={"BMCLAPI"}
      />
      <TestReachable
        site={"https://api.modrinth.com/api/v1/mod?query=foobar"}
        name={"Modrinth"}
      />
      <TestReachable
        site={"https://login.live.com/oauth20_desktop.srf"}
        name={"MSAuth"}
      />
      <TestReachable site={"authserver.mojang.com"} name={"MojangAuth"} />
    </>
  );
}
const ICON_SIZE = "1.375rem";
function TestReachable(props: { site: string; name: string }): JSX.Element {
  const classes = useTextStyles();
  const [reachable, setReachable] = useState<boolean>();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  useEffect(() => {
    tryConnect(props.site, 10)
      .then(() => {
        if (mounted.current) {
          setReachable(true);
        }
      })
      .catch(() => {
        if (mounted.current) {
          setReachable(false);
        }
      });
  }, [mounted.current]);
  return (
    <Box sx={{ display: "flex" }}>
      <Box sx={{ display: "inline" }}>
        {reachable === undefined ? (
          <CircularProgress size={ICON_SIZE} color={"primary"} />
        ) : reachable ? (
          <Check
            sx={{ width: ICON_SIZE, height: ICON_SIZE }}
            color={"primary"}
          />
        ) : (
          <CloudOff
            sx={{ width: ICON_SIZE, height: ICON_SIZE }}
            color={"primary"}
          />
        )}
      </Box>
      <Box sx={{ display: "inline", marginLeft: "0.25rem" }}>
        <Typography className={classes.thirdTextRaw}>
          {tr(`Utilities.NetCheck.SiteName.${props.name}`)}
        </Typography>

        <Typography className={classes.secondText}>
          {tr(`Utilities.NetCheck.SiteDesc.${props.name}`)}
        </Typography>
      </Box>
    </Box>
  );
}

async function tryConnect(site: string, t: number): Promise<void> {
  let ta = 1;
  while (ta <= t) {
    const s = await ipcRenderer.invoke("isReachable", site, 5000);
    if (s) {
      return;
    }
    ta++;
  }
  throw "Could not connect to " + site;
}
