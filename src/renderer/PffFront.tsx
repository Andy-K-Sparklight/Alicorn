import {
  Box,
  FormControl,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MuiThemeProvider,
  TextField,
  Typography,
} from "@material-ui/core";
import {
  ArrowForward,
  AssignmentLate,
  AssignmentTurnedIn,
} from "@material-ui/icons";
import { shell } from "electron";
import EventEmitter from "events";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { getString } from "../modules/config/ConfigSupport";
import { getContainer } from "../modules/container/ContainerUtil";
import { MinecraftContainer } from "../modules/container/MinecraftContainer";
import { setProxy } from "../modules/download/DownloadWrapper";
import { PFF_MSG_GATE } from "../modules/pff/curseforge/Values";
import { loadLockfile, Lockfile2 } from "../modules/pff/virtual/Lockfile";
import { fetchModByName, setPffFlag } from "../modules/pff/virtual/PffWrapper";
import { modLoaderOf } from "../modules/pff/virtual/Resolver";
import { setChangePageWarn } from "./GoTo";
import { hasEdited } from "./Options";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { fullWidth } from "./Stylex";
import { tr } from "./Translator";

export function PffFront(): JSX.Element {
  const emitter = useRef(new EventEmitter());
  let { container, version, name, loader, autostart } = useParams<{
    container: string;
    version: string;
    name?: string;
    autostart?: string;
    loader: string;
  }>();
  container = decodeURIComponent(container);
  version = decodeURIComponent(version);
  name = name ? decodeURIComponent(name) : undefined;
  loader = decodeURIComponent(loader);
  autostart = autostart ? decodeURIComponent(autostart) : undefined;

  const [isRunning, setRunning] = useState(autostart === "1");
  const [info, setInfo] = useState("");
  const [packageName, setPackageName] = useState(name || "");
  const [lockfile, setLockfile] = useState<Lockfile2>();
  const mounted = useRef(false);
  const logs = useRef<string[]>([]);
  const fullWidthClasses = fullWidth();
  useEffect(() => {
    const fun = () => {
      void (async () => {
        const lock = await loadLockfile(getContainer(container));
        if (mounted.current) {
          setLockfile(lock);
        }
      })();
    };
    window.addEventListener("blur", fun);
    window.addEventListener("focus", fun);
    return () => {
      window.removeEventListener("focus", fun);
      window.removeEventListener("blur", fun);
    };
  }, []);
  useEffect(() => {
    void (async () => {
      const lock = await loadLockfile(getContainer(container));
      if (mounted.current) {
        setLockfile(lock);
      }
    })();
  }, [isRunning]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const fun = (msg: string) => {
      if (mounted.current) {
        logs.current.push(msg);
        while (logs.current.length > 5) {
          logs.current.shift();
        }
        setInfo(logs.current.join("\n"));
      }
    };
    emitter.current.on(PFF_MSG_GATE, fun);
    return () => {
      emitter.current.removeListener(PFF_MSG_GATE, fun);
    };
  }, []);
  useEffect(() => {
    if (autostart === "1") {
      // setRunning(true);
      void (async () => {
        const packages = packageName.split(" ");
        await Promise.allSettled(
          packages.map(async (p, i) => {
            if (p.trim().length) {
              await pffInstall(
                p.trim(),
                getContainer(container),
                version,
                emitter.current,
                loader === "Forge" ? 1 : 4,
                `${i + 1}`
              );
            }
          })
        );
        if (mounted.current) {
          setRunning(false);
        }
      })();
    }
  }, []);
  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <Box className={fullWidthClasses.root}>
        <FormControl>
          <TextField
            spellCheck={false}
            className={fullWidthClasses.form}
            color={"primary"}
            value={packageName}
            disabled={isRunning}
            placeholder={tr("PffFront.Slug")}
            onChange={(e) => {
              setPackageName(e.target.value);
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position={"end"}>
                  <IconButton
                    disabled={isRunning || packageName.trim().length === 0}
                    color={"primary"}
                    onClick={() => {
                      setRunning(true);
                      void (async () => {
                        const packages = packageName.split(" ");
                        await Promise.allSettled(
                          packages.map(async (p, i) => {
                            if (p.trim().length) {
                              await pffInstall(
                                p.trim(),
                                getContainer(container),
                                version,
                                emitter.current,
                                loader === "Forge" ? 1 : 4,
                                `${i + 1}`
                              );
                            }
                          })
                        );
                        if (mounted.current) {
                          setRunning(false);
                        }
                      })();
                    }}
                  >
                    <ArrowForward />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </FormControl>
        {isRunning ? (
          <LinearProgress
            color={"secondary"}
            style={{ width: "80%" }}
            className={fullWidthClasses.progress}
          />
        ) : (
          ""
        )}
        <Typography
          style={{
            userSelect: "all",
            textAlign: "center",
            fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
          }}
          color={"primary"}
        >
          {info}
        </Typography>
        {hasEdited("pff.cache-root") ? (
          ""
        ) : (
          <Typography
            style={{
              textAlign: "center",
              fontSize:
                window.sessionStorage.getItem("smallFontSize") || "16px",
              color: "#ff8400",
            }}
          >
            {tr("PffFront.WarnNoCache")}
          </Typography>
        )}
      </Box>
      <>
        <Typography className={fullWidthClasses.text} color={"primary"}>
          {tr("PffFront.QuickWatch")}
        </Typography>

        <Typography
          className={fullWidthClasses.text}
          color={"secondary"}
          style={{
            fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
          }}
        >
          {tr("PffFront.Hint")}
        </Typography>
        <List>
          {lockfile
            ? Object.keys(lockfile).map((name) => {
                const f = lockfile[name];
                return (
                  <ListItem key={name}>
                    <ListItemIcon>
                      {f.selectedArtifact.gameVersion.includes(version) &&
                      loader === f.selectedArtifact.modLoader ? (
                        <AssignmentTurnedIn color={"primary"} />
                      ) : (
                        <AssignmentLate />
                      )}
                    </ListItemIcon>
                    {lockfile[name].thumbNail.length > 0 ? (
                      <img
                        style={{
                          marginLeft: "-2.5%",
                        }}
                        src={lockfile[name].thumbNail}
                        alt={"LOGO"}
                        height={32}
                        width={32}
                      />
                    ) : (
                      ""
                    )}
                    <ListItemText
                      onClick={() => {
                        shell.showItemInFolder(
                          getContainer(container).getModJar(
                            f.selectedArtifact.fileName
                          )
                        );
                      }}
                    >
                      <Typography
                        style={Object.assign(
                          {
                            fontSize:
                              window.sessionStorage.getItem("smallFontSize") ||
                              "16px",
                            marginLeft: "1%",
                          },
                          f.selectedArtifact.gameVersion.includes(version) &&
                            loader === f.selectedArtifact.modLoader
                            ? {}
                            : { color: "gray", textDecoration: "line-through" }
                        )}
                        color={"secondary"}
                      >{`${f.displayName} [${f.id}] / ${
                        f.selectedArtifact.fileName
                      } [${f.selectedArtifact.id}] # ${new Date(
                        f.insallDate
                      ).toLocaleString()}`}</Typography>
                    </ListItemText>
                  </ListItem>
                );
              })
            : []}
        </List>
      </>
    </MuiThemeProvider>
  );
}

async function pffInstall(
  name: string,
  container: MinecraftContainer,
  version: string,
  emitter: EventEmitter,
  modLoader: number,
  tskIndex: string
): Promise<void> {
  setChangePageWarn(true);
  const ml = modLoaderOf(modLoader);
  const idx = `[${tskIndex}/${name}] `;
  if (!ml) {
    emitter.emit(
      PFF_MSG_GATE,
      `[${tskIndex}/${name}] ` + tr("PffFront.UnsupportedLoader")
    );
    return;
  }
  setPffFlag("1");
  const proxy = getString("pff.proxy");
  try {
    const u = new URL(proxy);
    setProxy(u.host, parseInt(u.port));
  } catch {}
  emitter.emit(PFF_MSG_GATE, idx + tr("PffFront.Loading"));
  try {
    if (await fetchModByName(name, version, ml, container)) {
      emitter.emit(PFF_MSG_GATE, idx + tr("PffFront.Done"));
    } else {
      emitter.emit(PFF_MSG_GATE, idx + tr("PffFront.Failed"));
    }
  } catch (e) {
    console.log(e);
    emitter.emit(PFF_MSG_GATE, idx + tr("PffFront.Failed"));
  }
  setPffFlag("0");
  setProxy("", 0);
  setChangePageWarn(false);
}
