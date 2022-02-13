import { ArrowForward } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tab,
  Tabs,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { shell } from "electron";
import EventEmitter from "events";
import path from "path";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { getBoolean } from "../modules/config/ConfigSupport";
import { getContainer as _getContainer } from "../modules/container/ContainerUtil";
import { MinecraftContainer } from "../modules/container/MinecraftContainer";
import { configureModDepChain, UnmetDepUnit } from "../modules/modx/ModDeps";
import { loadMetas } from "../modules/modx/ModDynLoad";
import { ModInfo, ModLoader } from "../modules/modx/ModInfo";
import { canModVersionApply } from "../modules/modx/ModVersionUtil";
import {
  loadLockfile,
  Lockfile2,
  LockfileModMeta,
} from "../modules/pff/virtual/Lockfile";
import { fetchModByName, setPffFlag } from "../modules/pff/virtual/PffWrapper";
import { modLoaderOf } from "../modules/pff/virtual/Resolver";
import { setChangePageWarn } from "./GoTo";
import { Icons } from "./Icons";
import { hasEdited } from "./Options";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { fullWidth } from "./Stylex";
import { tr } from "./Translator";

const PFF_MSG_GATE = "message";
export function PffFront(): JSX.Element {
  const emitter = useRef(new EventEmitter());
  let { container, version, name, loader, autostart, root } = useParams<{
    container: string;
    version: string;
    name?: string;
    autostart?: string;
    loader: string;
    root: string;
  }>();
  container = decodeURIComponent(container);
  root = decodeURIComponent(root);
  version = decodeURIComponent(version);
  name = name ? decodeURIComponent(name) : undefined;
  loader = decodeURIComponent(loader);
  autostart = autostart ? decodeURIComponent(autostart) : undefined;

  const [isRunning, setRunning] = useState(autostart === "1");
  const [val, setVal] = useState(0);
  const [info, setInfo] = useState("");
  const [packageName, setPackageName] = useState(name || "");
  const [lockfile, setLockfile] = useState<Lockfile2>();
  const [allMods, setAllMods] = useState<ModInfo[]>([]);
  const mounted = useRef(false);
  const logs = useRef<string[]>([]);
  const [unmetWarns, setUnmetWarns] = useState<UnmetDepUnit[]>([]);
  const fullWidthClasses = fullWidth();
  const [isDirty, setDirty] = useState(false);

  const getContainer = (c: string) => {
    return chroot(_getContainer(c), root);
  };

  const f = async () => {
    const m = await loadMetas(getContainer(container));
    if (mounted.current) {
      m.sort((a, b) => {
        if ((a.displayName || "") > (b.displayName || "")) {
          return 1;
        }
        return -1;
      });
      setAllMods(m);
    }
  };
  const f1 = async () => {
    const a = await configureModDepChain(
      getContainer(container),
      loader as ModLoader
    );
    if (mounted.current) {
      setUnmetWarns(a);
    }
  };
  useEffect(() => {
    if (!isDirty) {
      void Promise.allSettled([f(), f1()]);
    }
  }, [isDirty]);
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
          packages.map(async (p) => {
            if (p.trim().length) {
              await pffInstall(
                p.trim(),
                getContainer(container),
                version,
                emitter.current,
                loader === "Forge" ? 1 : 4
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
  const start = (packageName: string) => {
    setDirty(true);
    setInfo("");
    logs.current = [];
    setRunning(true);
    void (async () => {
      const packages = packageName.split(" ");
      await Promise.allSettled(
        packages.map(async (p) => {
          if (p.trim().length) {
            await pffInstall(
              p.trim(),
              getContainer(container),
              version,
              emitter.current,
              loader === "Forge" ? 1 : 4
            );
          }
        })
      );
      if (mounted.current) {
        setRunning(false);
      }
    })();
  };
  return (
    <ThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <Container className={fullWidthClasses.root}>
        <FormControl fullWidth>
          <TextField
            spellCheck={false}
            color={"primary"}
            fullWidth
            value={packageName}
            disabled={isRunning}
            placeholder={tr("PffFront.Slug")}
            onChange={(e) => {
              setPackageName(e.target.value);
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position={"end"}>
                  {isRunning ? (
                    <CircularProgress size={"1.5rem"} />
                  ) : (
                    <IconButton
                      disabled={packageName.trim().length === 0}
                      color={"primary"}
                      onClick={() => {
                        start(packageName);
                      }}
                    >
                      <ArrowForward />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
        </FormControl>
        <Typography
          sx={{
            userSelect: "all",
            textAlign: "center",
          }}
          className={"smtxt"}
          color={"primary"}
        >
          {info}
        </Typography>
        {hasEdited("pff.cache-root") ? (
          ""
        ) : (
          <Typography
            sx={{
              textAlign: "center",
              color: "#ff8400",
            }}
            className={"smtxt"}
          >
            {tr("PffFront.WarnNoCache")}
          </Typography>
        )}
      </Container>
      <>
        <Tabs
          variant={"fullWidth"}
          value={val}
          onChange={(_e, v) => {
            setVal(v);
          }}
        >
          <Tab
            label={
              <Badge
                badgeContent={Object.keys(lockfile || {}).length}
                color={"primary"}
              >
                <Typography color={"primary"}>
                  {tr("PffFront.QuickWatch")}
                </Typography>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={allMods.length} color={"primary"}>
                <Typography color={"primary"}>{tr("PffFront.Mods")}</Typography>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={unmetWarns.length} color={"primary"}>
                <Typography color={"primary"}>
                  {tr("PffFront.UnmetDeps")}
                </Typography>
              </Badge>
            }
          />
        </Tabs>
        {isDirty ? (
          <Alert
            severity={"info"}
            onClick={() => {
              setDirty(false);
            }}
          >
            {tr("PffFront.ReloadToRenew")}
          </Alert>
        ) : (
          ""
        )}
        <TabPanel value={val} index={0}>
          <Container>
            <Typography
              className={fullWidthClasses.text + " smtxt"}
              color={"secondary"}
            >
              {tr("PffFront.Hint")}
            </Typography>
            {!lockfile || Object.keys(lockfile).length === 0 ? (
              <Alert severity={"info"}>{tr("PffFront.NoneDetected")}</Alert>
            ) : (
              <Button
                disabled={isRunning}
                onClick={() => {
                  const p = Object.values(lockfile)
                    .filter(
                      (v) =>
                        v.selectedArtifact.gameVersion.includes(version) &&
                        v.selectedArtifact.modLoader === loader
                    )
                    .map((v) => {
                      return (
                        "@" +
                        v.provider +
                        ":" +
                        v.id +
                        "/" +
                        v.selectedArtifact.id
                      );
                    })
                    .join(" ");
                  setPackageName(p);
                  start(p);
                }}
                variant={"contained"}
                color={"primary"}
              >
                {tr("PffFront.UpgradeAll")}
              </Button>
            )}
            <List>
              {lockfile
                ? Object.keys(lockfile).map((name) => {
                    return (
                      <SinglePffModDisplay
                        meta={lockfile[name]}
                        version={version}
                        loader={loader}
                        container={container}
                        key={name}
                        onUpdate={() => {
                          if (!isRunning) {
                            const pName =
                              "@" +
                              lockfile[name].provider +
                              ":" +
                              lockfile[name].id +
                              "/" +
                              lockfile[name].selectedArtifact.id;
                            setPackageName(pName);
                            start(pName);
                          }
                        }}
                        root={root}
                      />
                    );
                  })
                : []}
            </List>
          </Container>
        </TabPanel>
        <TabPanel value={val} index={1}>
          <Container>
            <Typography
              className={fullWidthClasses.text + " smtxt"}
              color={"secondary"}
            >
              {tr("PffFront.ModsHint")}
            </Typography>
            {allMods.length === 0 ? (
              <Alert severity={"info"}>{tr("PffFront.NoneDetected")}</Alert>
            ) : (
              ""
            )}
            <List>
              {allMods.map((m) => {
                if (m.displayName && m.fileName) {
                  return (
                    <SingleModDisplay
                      m={m}
                      key={m.fileName}
                      loader={
                        loader === "Forge"
                          ? ModLoader.FORGE
                          : loader === "Fabric"
                          ? ModLoader.FABRIC
                          : ModLoader.UNKNOWN
                      }
                      mcversion={version}
                    />
                  );
                }
                return "";
              })}
            </List>
          </Container>
        </TabPanel>
        <TabPanel value={val} index={2}>
          <Container>
            <br />
            {unmetWarns.length > 0 ? (
              <Button
                color={"primary"}
                onClick={() => {
                  if (!isRunning) {
                    const t0: Set<string> = new Set();
                    unmetWarns.forEach((v) => {
                      t0.add(v.missing);
                    });
                    const pkgs = Array.from(t0).join(" ");
                    setPackageName(pkgs);
                    start(pkgs);
                  }
                }}
                variant={"contained"}
              >
                {tr("PffFront.InstallAll")}
              </Button>
            ) : (
              ""
            )}
            {unmetWarns.map((u) => {
              return (
                <Alert
                  key={u.origin + u.name + u.missing}
                  severity={"warning"}
                  onClick={() => {
                    if (!isRunning) {
                      setPackageName(u.missing);
                      start(u.missing);
                    }
                  }}
                >
                  {tr(
                    "PffFront.MissingDep",
                    `Origin=${path.basename(u.origin)}`,
                    `Name=${u.name}`,
                    `Missing=${u.missing}`
                  )}
                </Alert>
              );
            })}
            {unmetWarns.length === 0 ? (
              <Alert severity={"info"}>{tr("PffFront.DepOK")}</Alert>
            ) : (
              ""
            )}
          </Container>
        </TabPanel>
      </>
    </ThemeProvider>
  );
}

function SinglePffModDisplay(props: {
  meta: LockfileModMeta;
  container: string;
  loader: string;
  version: string;
  onUpdate: () => void;
  root: string;
}): JSX.Element {
  const [showDesc, setShowDesc] = useState(false);
  const isCompatible =
    props.meta.selectedArtifact.gameVersion.includes(props.version) &&
    props.loader === props.meta.selectedArtifact.modLoader;
  return (
    <ListItem
      alignItems={"flex-start"}
      onMouseOver={() => {
        setShowDesc(true);
      }}
      onMouseLeave={() => {
        setShowDesc(false);
      }}
    >
      <ListItemAvatar>
        <Avatar
          alt={props.meta.displayName}
          variant={"square"}
          src={props.meta.thumbNail}
        />
      </ListItemAvatar>
      <ListItemText
        onContextMenu={(e) => {
          if (isCompatible) {
            props.onUpdate();
            e.preventDefault();
          }
        }}
        onClick={(e) => {
          if (e.button === 2) {
            return;
          }
          shell.showItemInFolder(
            chroot(_getContainer(props.container), props.root).getModJar(
              props.meta.selectedArtifact.fileName
            )
          );
        }}
        primary={
          <Typography
            sx={{
              color: isCompatible ? "primary.main" : "gray",
              textDecoration: isCompatible ? undefined : "line-through",
              fontWeight: showDesc ? "bold" : undefined,
            }}
            color={"primary"}
          >
            {props.meta.displayName}
          </Typography>
        }
        secondary={
          <Typography
            className={"smtxt"}
            sx={{
              color: isCompatible ? "secondary.main" : "gray",
              textDecoration: isCompatible ? undefined : "line-through",
              fontWeight: showDesc ? "bold" : undefined,
            }}
            color={"secondary"}
          >{`[${props.meta.id} / ${props.meta.selectedArtifact.id}] ${
            props.meta.selectedArtifact.fileName
          } ${new Date(props.meta.insallDate).toLocaleString()}`}</Typography>
        }
      />
    </ListItem>
  );
}

function SingleModDisplay(props: {
  m: ModInfo;
  loader: ModLoader;
  mcversion: string;
}): JSX.Element {
  const modmcv = props.m.mcversion || "*";
  const compatible =
    (props.m.loader === props.loader ||
      (props.m.loader === ModLoader.UNKNOWN &&
        getBoolean("modx.ignore-non-standard-mods"))) &&
    canModVersionApply(
      modmcv,
      props.mcversion,
      props.m.loader === ModLoader.FABRIC
    );
  const [showDesc, setShowDesc] = useState(false);
  return (
    <ListItem
      alignItems={"flex-start"}
      onMouseOver={() => {
        if (props.m.description) {
          setShowDesc(true);
        }
      }}
      onMouseLeave={() => {
        if (props.m.description) {
          setShowDesc(false);
        }
      }}
      onClick={() => {
        if (props.m.fileName) {
          void shell.showItemInFolder(props.m.fileName);
        }
      }}
    >
      <ListItemAvatar>
        <Avatar
          alt={props.m.displayName}
          variant={"square"}
          src={
            props.m.loader === ModLoader.FORGE
              ? Icons.PROFILE_FORGE
              : props.m.loader === ModLoader.FABRIC
              ? Icons.PROFILE_FABRIC
              : Icons.PROFILE_UNKNOWN
          }
        />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography
            sx={{
              textDecoration: !compatible ? "line-through" : undefined,
              fontWeight: showDesc ? "bold" : undefined,
              color: compatible ? "primary.main" : "gray",
            }}
            color={"primary"}
          >
            {props.m.displayName}
          </Typography>
        }
        secondary={
          <Typography
            color={"secondary"}
            sx={{
              textDecoration:
                !compatible && !showDesc ? "line-through" : undefined,
              fontWeight: showDesc ? "bold" : undefined,
              color: compatible ? "secondary.main" : "gray",
            }}
          >
            {showDesc
              ? props.m.description
              : `[${props.m.id}] ` + path.basename(props.m.fileName || "")}
          </Typography>
        }
      />
    </ListItem>
  );
}

function chroot(c: MinecraftContainer, id: string): MinecraftContainer {
  if (id === "0") {
    return c;
  }
  return new MinecraftContainer(c.getVersionRoot(id), c.id + "/" + id);
}

export async function pffInstall(
  name: string,
  container: MinecraftContainer,
  version: string,
  emitter: EventEmitter,
  modLoader: number
): Promise<boolean> {
  setChangePageWarn(true);
  let ok = false;
  const optional = name.endsWith("?");
  if (optional) {
    name = name.slice(0, -1);
  }
  const ml = modLoaderOf(modLoader);
  const idx = `[${name}] `;
  if (!ml) {
    if (!optional) {
      emitter.emit(
        PFF_MSG_GATE,
        `[${name}] ` + tr("PffFront.UnsupportedLoader")
      );
    }
  }
  setPffFlag("1");
  emitter.emit(PFF_MSG_GATE, idx + tr("PffFront.Loading"));
  try {
    if (await fetchModByName(name, version, ml, container)) {
      emitter.emit(PFF_MSG_GATE, idx + tr("PffFront.Done"));
      ok = true;
    } else {
      if (!optional) {
        emitter.emit(PFF_MSG_GATE, idx + tr("PffFront.Failed"));
      }
    }
  } catch (e) {
    console.log(e);
    if (!optional) {
      emitter.emit(PFF_MSG_GATE, idx + tr("PffFront.Failed"));
    }
  }
  setPffFlag("0");
  setChangePageWarn(false);
  return ok;
}

function TabPanel(props: {
  children?: React.ReactNode;
  index: string | number;
  value: string | number;
}): JSX.Element {
  const { children, value, index } = props;
  return (
    <Box hidden={value !== index}>{value === index ? <>{children}</> : ""}</Box>
  );
}
