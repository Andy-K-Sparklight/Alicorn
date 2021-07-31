import {
  Box,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from "@material-ui/core";
import {
  Archive,
  DeleteForever,
  EventBusy,
  FlightTakeoff,
  Sync,
} from "@material-ui/icons";
import { remove } from "fs-extra";
import objectHash from "object-hash";
import React, { useEffect, useRef, useState } from "react";
import { scanCoresInAllMountedContainers } from "../modules/container/ContainerScanner";
import { getContainer } from "../modules/container/ContainerUtil";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { whatProfile } from "../modules/profile/WhatProfile";
import { jumpTo, Pages, triggerSetPage } from "./GoTo";
import { YNDialog2 } from "./OperatingHint";
import { useCardStyles, usePadStyles } from "./Stylex";
import { tr } from "./Translator";

let cachedAllCores: SimplifiedCoreInfo[] = [];
let coresCacheBit = false;

interface SimplifiedCoreInfo {
  location: string;
  container: string;
  id: string;
  corrupted: boolean;
  versionType: string;
  baseVersion: string;
}

export function LaunchPad(): JSX.Element {
  const classes = usePadStyles();

  return (
    <Box className={classes.para}>
      <CoresDisplay />
    </Box>
  );
}

function CoresDisplay(): JSX.Element {
  const mountedBit = useRef<boolean>(false);
  const [cores, setCores] = useState<SimplifiedCoreInfo[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [refreshBit, setRefresh] = useState(true);
  useEffect(() => {
    mountedBit.current = true;
    return () => {
      mountedBit.current = false;
    };
  });
  useEffect(() => {
    if (!coresCacheBit && !isLoading) {
      if (mountedBit.current) {
        setLoading(true);
      }
      cachedAllCores = [];

      (async () => {
        let counter = 0;
        const rMap = await scanCoresInAllMountedContainers(true);
        for (const [c, ids] of rMap.entries()) {
          for (const id of ids) {
            try {
              const p = await loadProfile(id, c);
              cachedAllCores.push({
                id: p.id,
                baseVersion: p.baseVersion,
                location: c.id + "/" + id,
                versionType: whatProfile(id),
                corrupted: false,
                container: c.id,
              });
            } catch {
              cachedAllCores.push({
                id: id,
                corrupted: true,
                location: c.id + "/" + id,
                versionType: "???????",
                baseVersion: "???????",
                container: c.id,
              });
            } finally {
              if (++counter >= 5) {
                counter = 0;
                if (mountedBit.current) {
                  setCores(cachedAllCores);
                }
              }
            }
          }
        }
        if (mountedBit.current) {
          cachedAllCores.sort((a, b) => {
            const hashA = objectHash(a);
            const hashB = objectHash(b);
            const pinA = getUsed(hashA);
            const pinB = getUsed(hashB);
            return pinB - pinA;
          });
          setCores(cachedAllCores);
          setLoading(false);
        }
        coresCacheBit = true;
      })();
    }
  });

  return (
    <Box>
      <Box style={{ textAlign: "right", marginRight: "18%" }}>
        <Tooltip title={tr("CoreInfo.Reload")}>
          <IconButton
            color={"inherit"}
            onClick={() => {
              setDirty();
              if (mountedBit.current) {
                setRefresh(!refreshBit);
              }
            }}
          >
            <Sync />
          </IconButton>
        </Tooltip>
      </Box>
      {isLoading ? (
        <Box>
          <LinearProgress color={"secondary"} style={{ width: "80%" }} />
          <Typography
            style={{ fontSize: "medium", color: "#ff8400" }}
            gutterBottom
          >
            {tr("CoreInfo.StillLoading")}
          </Typography>
        </Box>
      ) : (
        ""
      )}
      <br />
      {cores.map((c) => {
        return (
          <SingleCoreDisplay
            key={c.location}
            refresh={() => {
              setDirty();
              setRefresh(!refreshBit);
            }}
            profile={c}
          />
        );
      })}
    </Box>
  );
}

function SingleCoreDisplay(props: {
  profile: SimplifiedCoreInfo;
  refresh: () => unknown;
}): JSX.Element {
  const classes = useCardStyles();
  const hash = objectHash(props.profile);
  const used = getUsed(hash);
  const [warningOpen, setWarningOpen] = useState(false);
  const [toDestroy, setDestroy] = useState<string>();
  return (
    <Box>
      <Card className={classes.card}>
        <CardContent>
          {props.profile.corrupted ? (
            ""
          ) : (
            <Box>
              <Tooltip title={tr("CoreInfo.Pff")}>
                <IconButton
                  color={"inherit"}
                  className={classes.operateButton}
                  onClick={() => {
                    jumpTo(
                      `/PffFront/${props.profile.container}/${props.profile.baseVersion}`
                    );
                    triggerSetPage(Pages.PffFront);
                  }}
                >
                  <Archive />
                </IconButton>
              </Tooltip>
              <Tooltip title={tr("CoreInfo.Launch")}>
                <IconButton
                  color={"inherit"}
                  className={classes.operateButton}
                  onClick={() => {
                    markUsed(hash);
                    jumpTo(
                      "/ReadyToLaunch/" +
                        props.profile.container +
                        "/" +
                        props.profile.id
                    );
                    triggerSetPage(Pages.ReadyToLaunch);
                  }}
                >
                  <FlightTakeoff />
                </IconButton>
              </Tooltip>
              <Tooltip title={tr("CoreInfo.Destroy")}>
                <IconButton
                  color={"inherit"}
                  className={classes.operateButton}
                  onClick={() => {
                    setDestroy(props.profile.id);
                    setWarningOpen(true);
                  }}
                >
                  <DeleteForever />
                </IconButton>
              </Tooltip>
              <Tooltip title={tr("CoreInfo.ClearUse")}>
                <IconButton
                  color={"inherit"}
                  className={classes.operateButton}
                  onClick={() => {
                    markUsed(hash, 0);
                    props.refresh();
                  }}
                >
                  <EventBusy />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          <Typography
            className={classes.text}
            color={"textSecondary"}
            gutterBottom
          >
            {props.profile.versionType}
          </Typography>
          <Typography variant={"h6"} gutterBottom>
            {props.profile.baseVersion}
          </Typography>
          <Typography
            className={classes.text}
            color={"textSecondary"}
            gutterBottom
          >
            {tr(
              "CoreInfo.At",
              `ID=${props.profile.id}`,
              `Container=${props.profile.container}`
            )}
          </Typography>
          {used > 0 ? (
            <Typography
              className={classes.text}
              color={"textSecondary"}
              gutterBottom
            >
              {tr("CoreInfo.Used", `Count=${used}`)}
            </Typography>
          ) : (
            ""
          )}
          {props.profile.corrupted ? (
            <CorruptedCoreWarning />
          ) : props.profile.versionType === "FORGE" ||
            props.profile.versionType === "FABRIC" ? (
            <Typography className={classes.desc} color={"textSecondary"}>
              {getDescriptionFor(props.profile.versionType)}
            </Typography>
          ) : (
            ""
          )}
        </CardContent>
        <YNDialog2
          open={warningOpen}
          onAccept={async () => {
            if (toDestroy) {
              await remove(
                getContainer(props.profile.container).getVersionRoot(toDestroy)
              );
            }
          }}
          onClose={() => {
            setWarningOpen(false);
            props.refresh();
          }}
          yes={tr("CoreInfo.Destroy.Yes")}
          no={tr("CoreInfo.Destroy.No")}
          title={tr("CoreInfo.Destroy.Title", `Name=${toDestroy}`)}
          content={tr("CoreInfo.Destroy.Content", `Name=${toDestroy}`)}
        />
      </Card>
      <br />
    </Box>
  );
}

const PIN_NUMBER_KEY = "PinIndex.";

function getUsed(hash: string): number {
  return (
    parseInt(window.localStorage.getItem(PIN_NUMBER_KEY + hash) || "0") || 0
  );
}

function markUsed(hash: string, set?: number): void {
  if (set !== undefined) {
    window.localStorage.setItem(PIN_NUMBER_KEY + hash, set.toString());
    return;
  }
  let origin =
    parseInt(window.localStorage.getItem(PIN_NUMBER_KEY + hash) || "0") || 0;
  origin++;
  window.localStorage.setItem(PIN_NUMBER_KEY + hash, origin.toString());
}

function getDescriptionFor(type: string): string {
  switch (type.toUpperCase()) {
    case "FORGE":
      return tr("CoreInfo.Introduction.Forge");
    case "FABRIC":
    default:
      return tr("CoreInfo.Introduction.Fabric");
  }
}

function CorruptedCoreWarning(): JSX.Element {
  return (
    <Box>
      <Typography style={{ fontSize: "small", color: "#ff8400" }} gutterBottom>
        {tr("CoreInfo.CorruptedWarning")}
      </Typography>
    </Box>
  );
}

export function setDirty(): void {
  coresCacheBit = false;
}
