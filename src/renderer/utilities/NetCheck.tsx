import { Box, CircularProgress, Typography } from "@material-ui/core";
import { Check, CloudOff } from "@material-ui/icons";
import { ipcRenderer } from "electron";
import React, { useEffect, useRef, useState } from "react";
import pkg from "../../../package.json";
import { getString } from "../../modules/config/ConfigSupport";
import { useTextStyles } from "../Stylex";
import { tr } from "../Translator";
export function NetCheck(): JSX.Element {
  const uurl = getString(
    "updator.url",
    `https://cdn.jsdelivr.net/gh/Andy-K-Sparklight/Alicorn@${
      pkg.updatorVersion - 1 // + 1, -1 because we need to "check"
    }/`,
    true
  ).replace("${version}", (pkg.updatorVersion + 1).toString());
  const turl = uurl + "release/MainBuild.json";
  return (
    <Box>
      <TestReachable site={turl} name={"AlicornUpdate"} />
      <TestReachable site={"www.mcbbs.net"} name={"MCBBS"} />
      <TestReachable
        site={"https://versions.al.xuogroup.top/"}
        name={"AlicornAccess"}
      />
      <TestReachable site={"download.mcbbs.net"} name={"MCBBSDownload"} />
      <TestReachable site={"bmclapi2.bangbang93.com"} name={"BMCLAPI"} />
      <TestReachable
        site={
          "https://addons-ecs.forgesvc.net/api/v2/addon/search?categoryId=0&gameId=432&searchFilter=foobar"
        }
        name={"CurseAPI"}
      />
      <TestReachable site={"live.com"} name={"MSAuth"} />
      <TestReachable site={"authserver.mojang.com"} name={"MojangAuth"} />
    </Box>
  );
}
const ICON_SIZE = "22px";
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
      <Box style={{ display: "inline", marginLeft: "4px" }}>
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
