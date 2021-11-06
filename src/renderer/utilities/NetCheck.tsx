import { Box, CircularProgress, Typography } from "@material-ui/core";
import { Check, CloudOff } from "@material-ui/icons";
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
      <TestReachable site={"https://www.mcbbs.net/portal.php"} name={"MCBBS"} />
      <TestReachable
        site={"https://versions.al.xuogroup.top/"}
        name={"AlicornAccess"}
      />
      <TestReachable
        site={"https://download.mcbbs.net/mc/game/version_manifest.json"}
        name={"MCBBSDownload"}
      />
      <TestReachable
        site={"https://bmclapi2.bangbang93.com/mc/game/version_manifest.json"}
        name={"BMCLAPI"}
      />
      <TestReachable
        site={
          "https://addons-ecs.forgesvc.net/api/v2/addon/search?categoryId=0&gameId=432&searchFilter=foobar"
        }
        name={"CurseAPI"}
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
const ICON_SIZE = "1.375em";
export function TestReachable(props: {
  site: string;
  name: string;
}): JSX.Element {
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
    <Box style={{ display: "flex" }}>
      <Box style={{ display: "inline" }}>
        {reachable === undefined ? (
          <CircularProgress size={ICON_SIZE} color={"primary"} />
        ) : reachable ? (
          <Check
            style={{ width: ICON_SIZE, height: ICON_SIZE }}
            color={"primary"}
          />
        ) : (
          <CloudOff
            style={{ width: ICON_SIZE, height: ICON_SIZE }}
            color={"primary"}
          />
        )}
      </Box>
      <Box style={{ display: "inline", marginLeft: "0.25em" }}>
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
