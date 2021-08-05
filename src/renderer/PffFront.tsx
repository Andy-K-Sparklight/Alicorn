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
import { loadLockFile, Lockfile } from "../modules/pff/curseforge/Lockfile";
import { PFF_MSG_GATE } from "../modules/pff/curseforge/Values";
import { requireMod, setPffFlag } from "../modules/pff/curseforge/Wrapper";
import { setChangePageWarn } from "./GoTo";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { fullWidth } from "./Stylex";
import { tr } from "./Translator";

export function PffFront(): JSX.Element {
  const emitter = useRef(new EventEmitter());
  const { container, version, name, loader } =
    useParams<{
      container: string;
      version: string;
      name?: string;
      loader: string;
    }>();
  const [isRunning, setRunning] = useState(false);
  const [info, setInfo] = useState("");
  const [packageName, setPackageName] = useState(name || "");
  const [lockfile, setLockfile] = useState<Lockfile>();
  const mounted = useRef(false);
  const fullWidthClasses = fullWidth();
  useEffect(() => {
    const fun = () => {
      (async () => {
        const lock = await loadLockFile(getContainer(container));
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
    (async () => {
      const lock = await loadLockFile(getContainer(container));
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
        setInfo(msg);
      }
    };
    emitter.current.on(PFF_MSG_GATE, fun);
    return () => {
      emitter.current.removeListener(PFF_MSG_GATE, fun);
    };
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
                      (async () => {
                        await pffInstall(
                          packageName,
                          getContainer(container),
                          version,
                          emitter.current,
                          loader === "Forge" ? 1 : 4
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
            textAlign: "center",
            fontSize: "small",
          }}
          color={"primary"}
        >
          {info}
        </Typography>
      </Box>
      <Box>
        <Typography className={fullWidthClasses.text} color={"primary"}>
          {tr("PffFront.QuickWatch")}
        </Typography>

        <Typography
          className={fullWidthClasses.text}
          color={"secondary"}
          style={{
            fontSize: "small",
          }}
        >
          {tr("PffFront.Hint")}
        </Typography>
        <List>
          {lockfile
            ? Object.keys(lockfile.files).map((name) => {
                const f = lockfile.files[name];
                return (
                  <ListItem key={name}>
                    <ListItemIcon>
                      {version === f.gameVersion ? (
                        <AssignmentTurnedIn color={"primary"} />
                      ) : (
                        <AssignmentLate />
                      )}
                    </ListItemIcon>
                    {lockfile.files[name].thumbNail.length > 0 ? (
                      <img
                        style={{
                          marginLeft: "-2.5%",
                        }}
                        src={lockfile.files[name].thumbNail}
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
                          getContainer(container).getModJar(f.fileName)
                        );
                      }}
                    >
                      <Typography
                        style={Object.assign(
                          {
                            fontSize: "small",
                            marginLeft: "1%",
                          },
                          version === f.gameVersion ? {} : { color: "gray" }
                        )}
                        color={"secondary"}
                      >{`${f.addonName} [${f.addonId}] / ${f.fileName} [${
                        f.fileId
                      }] # ${new Date(
                        f.fileDate
                      ).toLocaleString()}`}</Typography>
                    </ListItemText>
                  </ListItem>
                );
              })
            : []}
        </List>
      </Box>
    </MuiThemeProvider>
  );
}

async function pffInstall(
  name: string,
  container: MinecraftContainer,
  version: string,
  emitter: EventEmitter,
  modLoader: number
): Promise<void> {
  setChangePageWarn(true);
  let i: string | number = name;
  const p = parseInt(name);
  if (String(p) == name) {
    i = p;
  }
  setPffFlag("1");
  const proxy = getString("pff.proxy");
  try {
    const u = new URL(proxy);
    setProxy(u.host, parseInt(u.port));
  } catch {}
  await requireMod(i, version, container, emitter, modLoader);
  setPffFlag("0");
  setProxy("", 0);
  setChangePageWarn(false);
}
