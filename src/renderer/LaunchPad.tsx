import { DeleteForever, EventBusy, Extension, Sync } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Fade,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import { remove } from "fs-extra";
import objectHash from "object-hash";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { scanCoresInAllMountedContainers } from "../modules/container/ContainerScanner";
import { getContainer } from "../modules/container/ContainerUtil";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { whatProfile } from "../modules/profile/WhatProfile";
import { setDirtyProfile } from "../modules/readyboom/PrepareProfile";
import { jumpTo, triggerSetPage } from "./GoTo";
import { Icons } from "./Icons";
import { YNDialog2 } from "./OperatingHint";
import { isBgDark } from "./Renderer";
import { addStatistics } from "./Statistics";
import { useCardStyles, usePadStyles } from "./Stylex";
import { tr } from "./Translator";

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
  let { server } = useParams<{ server?: string }>();
  server = server ? decodeURIComponent(server) : undefined;
  return (
    <Box className={classes.para}>
      <CoresDisplay server={server} />
    </Box>
  );
}

function CoresDisplay(props: { server?: string }): JSX.Element {
  const mountedBit = useRef<boolean>(false);
  const [cores, setCores] = useState<SimplifiedCoreInfo[]>([]);
  const [isLoading, setLoading] = useState(false);
  useEffect(() => {
    mountedBit.current = true;
    return () => {
      mountedBit.current = false;
    };
  });
  useEffect(() => {
    const fun = () => {
      if (mountedBit.current) {
        setLoading(true);
      }
      setCores([]);
      const cachedAllCores = [];

      void (async () => {
        let counter = 0;
        const rMap = await scanCoresInAllMountedContainers(true);
        for (const [c, ids] of rMap.entries()) {
          for (const id of ids) {
            try {
              const p = await loadProfile(id, c, true); // Faster
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
              counter++;
              if (counter >= 5) {
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
      })();
    };
    fun();
    window.addEventListener("ReloadCores", fun);
    return () => {
      window.removeEventListener("ReloadCores", fun);
    };
  }, []);

  return (
    <>
      <Box sx={{ textAlign: "right" }}>
        <Tooltip
          title={
            <Typography className={"smtxt"}>{tr("CoreInfo.Reload")}</Typography>
          }
        >
          <IconButton
            color={"inherit"}
            onClick={() => {
              if (mountedBit.current) {
                window.dispatchEvent(new CustomEvent("ReloadCores"));
              }
            }}
          >
            <Sync />
          </IconButton>
        </Tooltip>
      </Box>
      {isLoading ? (
        <>
          <LinearProgress color={"secondary"} />
          <Typography
            sx={{ fontSize: "medium", color: "#ff8400" }}
            gutterBottom
          >
            {tr("CoreInfo.StillLoading")}
          </Typography>
        </>
      ) : (
        ""
      )}
      <br />
      {cores.map((c) => {
        return (
          <SingleCoreDisplay
            key={c.location}
            server={props.server}
            refresh={() => {
              window.dispatchEvent(new CustomEvent("ReloadCores"));
            }}
            loading={isLoading}
            profile={c}
          />
        );
      })}
    </>
  );
}

function SingleCoreDisplay(props: {
  profile: SimplifiedCoreInfo;
  server?: string;
  loading: boolean;
  refresh: () => unknown;
}): JSX.Element {
  const classes = useCardStyles();
  const hash = objectHash(props.profile);
  const used = getUsed(hash);
  const [warningOpen, setWarningOpen] = useState(false);
  const [toDestroy, setDestroy] = useState<string>();
  const [showBtn, setShowBtn] = useState(false);
  return (
    <>
      <Card
        sx={{ backgroundColor: "primary.main" }}
        color={"primary"}
        raised={true}
        onMouseOver={() => {
          setShowBtn(true);
        }}
        onMouseLeave={() => {
          setShowBtn(false);
        }}
        className={classes.card}
        onClick={() => {
          if (props.profile.corrupted) {
            return;
          }
          markUsed(hash);
          jumpTo(
            "/ReadyToLaunch/" +
              encodeURIComponent(props.profile.container) +
              "/" +
              encodeURIComponent(props.profile.id) +
              (props.server ? "/" + encodeURIComponent(props.server) : "")
          );
          triggerSetPage("ReadyToLaunch");
        }}
      >
        <CardContent>
          {props.profile.corrupted ? (
            ""
          ) : (
            <Box sx={{ float: "right", display: "flex", flexDirection: "row" }}>
              <Fade in={showBtn}>
                <Box>
                  <Tooltip
                    title={
                      <Typography className={"smtxt"}>
                        {tr("CoreInfo.Destroy")}
                      </Typography>
                    }
                  >
                    <IconButton
                      color={"inherit"}
                      className={classes.operateButton}
                      onClick={(e) => {
                        setDestroy(props.profile.id);
                        setWarningOpen(true);
                        addStatistics("Click");
                        e.stopPropagation();
                      }}
                    >
                      <DeleteForever />
                    </IconButton>
                  </Tooltip>
                  <Tooltip
                    title={
                      <Typography className={"smtxt"}>
                        {tr("CoreInfo.ClearUse")}
                      </Typography>
                    }
                  >
                    <IconButton
                      color={"inherit"}
                      className={classes.operateButton}
                      onClick={(e) => {
                        markUsed(hash, 0);
                        props.refresh();
                        addStatistics("Click");
                        e.stopPropagation();
                      }}
                    >
                      <EventBusy />
                    </IconButton>
                  </Tooltip>
                  {props.profile.versionType !== "Mojang" &&
                  props.profile.versionType !== "Installer" ? (
                    <Tooltip
                      title={
                        <Typography className={"smtxt"}>
                          {tr("CoreInfo.Pff")}
                        </Typography>
                      }
                    >
                      <IconButton
                        color={"inherit"}
                        className={classes.operateButton}
                        onClick={
                          props.profile.versionType !== "Mojang" &&
                          props.profile.versionType !== "Installer"
                            ? (e) => {
                                jumpTo(
                                  `/PffFront/${encodeURIComponent(
                                    props.profile.container
                                  )}/${encodeURIComponent(
                                    props.profile.baseVersion
                                  )}/${encodeURIComponent(
                                    props.profile.versionType
                                  )}`
                                );
                                triggerSetPage("PffFront");
                                addStatistics("Click");
                                e.stopPropagation();
                              }
                            : undefined
                        }
                      >
                        <Extension />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    ""
                  )}
                </Box>
              </Fade>
              <Tooltip
                title={
                  props.profile.versionType !== "Mojang" &&
                  props.profile.versionType !== "Installer" ? (
                    <Typography className={"smtxt"}>
                      {tr("CoreInfo.Pff")}
                    </Typography>
                  ) : (
                    ""
                  )
                }
              >
                <img
                  src={getIconForProfile(props.profile)}
                  width={64}
                  height={64}
                  style={{
                    float: "right",
                    cursor:
                      props.profile.versionType !== "Mojang" &&
                      props.profile.versionType !== "Installer"
                        ? "pointer"
                        : undefined,
                  }}
                  onClick={
                    props.profile.versionType !== "Mojang" &&
                    props.profile.versionType !== "Installer"
                      ? (e) => {
                          jumpTo(
                            `/PffFront/${encodeURIComponent(
                              props.profile.container
                            )}/${encodeURIComponent(
                              props.profile.baseVersion
                            )}/${encodeURIComponent(props.profile.versionType)}`
                          );
                          triggerSetPage("PffFront");
                          addStatistics("Click");
                          e.stopPropagation();
                        }
                      : undefined
                  }
                />
              </Tooltip>
            </Box>
          )}
          <Typography
            className={classes.text}
            sx={{ color: isBgDark() ? "secondary.light" : undefined }}
            gutterBottom
          >
            {props.profile.versionType}
          </Typography>
          <Typography
            variant={"h6"}
            sx={{ color: isBgDark() ? "secondary.light" : undefined }}
            gutterBottom
          >
            {props.profile.baseVersion}
          </Typography>
          <Typography
            className={classes.text}
            sx={{ color: isBgDark() ? "secondary.light" : undefined }}
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
              sx={{ color: isBgDark() ? "secondary.light" : undefined }}
              gutterBottom
            >
              {tr("CoreInfo.Used", `Count=${used}`)}
            </Typography>
          ) : (
            ""
          )}
          {props.profile.corrupted ? (
            <CorruptedCoreWarning />
          ) : (
            <Typography
              className={classes.desc}
              sx={{ color: isBgDark() ? "secondary.light" : undefined }}
            >
              {getDescriptionFor(props.profile.versionType)}
            </Typography>
          )}
        </CardContent>
        <YNDialog2
          noProp
          open={warningOpen}
          onAccept={async () => {
            if (toDestroy) {
              try {
                setDirtyProfile(props.profile.container, props.profile.id);
                await remove(
                  getContainer(props.profile.container).getVersionRoot(
                    toDestroy
                  )
                );
              } finally {
                markUsed(hash, 0);
                props.refresh();
              }
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
    </>
  );
}

const PIN_NUMBER_KEY = "PinIndex.";

function getUsed(hash: string): number {
  return parseInt(localStorage.getItem(PIN_NUMBER_KEY + hash) || "0") || 0;
}

function markUsed(hash: string, set?: number): void {
  if (set !== undefined) {
    localStorage.setItem(PIN_NUMBER_KEY + hash, set.toString());
    return;
  }
  let origin =
    parseInt(localStorage.getItem(PIN_NUMBER_KEY + hash) || "0") || 0;
  origin++;
  localStorage.setItem(PIN_NUMBER_KEY + hash, origin.toString());
}

function getDescriptionFor(type: string): string {
  switch (type.toUpperCase()) {
    case "FORGE":
      return tr("CoreInfo.Introduction.Forge");
    case "INSTALLER":
      return tr("CoreInfo.Introduction.Installer");
    case "FABRIC":
      return tr("CoreInfo.Introduction.Fabric");
    default:
      return "";
  }
}

function CorruptedCoreWarning(): JSX.Element {
  return (
    <>
      <Typography
        sx={{
          color: "#ff8400",
        }}
        className={"smtxt"}
        gutterBottom
      >
        {tr("CoreInfo.CorruptedWarning")}
      </Typography>
    </>
  );
}

function getIconForProfile(p: SimplifiedCoreInfo): string {
  switch (p.versionType) {
    case "Mojang":
      return Icons.PROFILE_MOJANG;
    case "Forge":
      return Icons.PROFILE_FORGE;
    case "Fabric":
      return Icons.PROFILE_FABRIC;
    case "Installer":
      return Icons.PROFILE_INSTALLER;
    case "Universal":
    default:
      return Icons.PROFILE_UNKNOWN;
  }
}
