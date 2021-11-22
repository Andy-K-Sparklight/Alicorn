import {
  Avatar,
  Box,
  Button,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  ThemeProvider,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { throttle } from "throttle-debounce";
import { ALICORN_SEPARATOR, ReleaseType } from "../modules/commons/Constants";
import { isNull } from "../modules/commons/Null";
import { scanCoresInAllMountedContainers } from "../modules/container/ContainerScanner";
import {
  getAllMounted,
  getContainer,
} from "../modules/container/ContainerUtil";
import {
  clearDoing,
  getDoing,
  subscribeDoing,
  unsubscribeDoing,
} from "../modules/download/DownloadWrapper";
import { getDefaultJavaHome, getJavaRunnable } from "../modules/java/JInfo";
import {
  canSupportGame,
  getFabricInstaller,
  getLatestFabricInstallerAndLoader,
  removeFabricInstaller,
} from "../modules/pff/get/FabricGet";
import {
  generateForgeInstallerName,
  getForgeInstaller,
  getForgeVersionByMojang,
  removeForgeInstaller,
} from "../modules/pff/get/ForgeGet";
import {
  downloadProfile,
  getAllMojangCores,
  getProfileURLById,
} from "../modules/pff/get/MojangCore";
import { performFabricInstall } from "../modules/pff/install/FabricInstall";
import { performForgeInstall } from "../modules/pff/install/ForgeInstall";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { ProfileType, whatProfile } from "../modules/profile/WhatProfile";
import { jumpTo, setChangePageWarn, triggerSetPage } from "./GoTo";
import { Icons } from "./Icons";
import { ShiftEle } from "./Instruction";
import { submitSucc, submitWarn } from "./Message";
import { FailedHint, OperatingHintCustom } from "./OperatingHint";
import {
  ALICORN_DEFAULT_THEME_DARK,
  ALICORN_DEFAULT_THEME_LIGHT,
  isBgDark,
} from "./Renderer";
import { fullWidth, useFormStyles } from "./Stylex";
import { tr } from "./Translator";

export function InstallCore(): JSX.Element {
  const classes = useFormStyles();
  const fullWidthClasses = fullWidth();
  const [foundCores, setCores] = useState<string[]>([]);
  const isLoaded = useRef<boolean>(false);
  const mounted = useRef<boolean>();
  const [doing, setDoing] = useState(getDoing());
  const [selectedMojangVersion, setSelectedMojangVersion] =
    useState<string>("");
  const [mojangFilter, setMojangFilter] = useState<ReleaseType>(
    ReleaseType.RELEASE
  );
  const [patchableCores, setPatchableCores] = useState<PatchableCore[]>([]);
  const [fabricCores, setFabricCores] = useState<PatchableCore[]>([]);
  const [baseMojangVersionForge, setBaseMojangVersionForge] =
    useState<string>("");
  const [failedMsg, setFailedMsg] = useState<string>("Untracked Error");
  const [baseMojangVersionFabric, setBaseMojangVersionFabric] =
    useState<string>("");
  const [detectedForgeVersion, setDetectedForgeVersion] = useState("");
  const [detectedFabricVersion, setDetectedFabricVersion] =
    useState<string>("");
  const [selectedMojangContainer, setMojangContainer] = useState("");
  const [selectedForgeContainer, setForgeContainer] = useState("");
  const [selectedFabricContainer, setFabricContainer] = useState("");
  const [operating, setOperating] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progressMsg, _setProgressMsg] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [updatePatchableCoresBit, updatePatchableCores] = useState(false);
  const [updateFabricCoresBit, updateFabricCores] = useState(false);
  const [selectedIrisBase, setSelectedIrisBase] = useState("");
  const [selectedIrisContainer, setSelectedIrisContainer] = useState("");
  function setProgressMsg(msg: string): void {
    // Binding
    if (mounted.current) {
      _setProgressMsg(msg);
    }
  }
  useEffect(() => {
    subscribeDoing(
      "InstallCore",
      throttle(250, (d) => {
        setDoing(d);
      })
    );
    return () => {
      unsubscribeDoing("InstallCore");
    };
  });
  useEffect(() => {
    void (async () => {
      if (!isLoaded.current) {
        const r = await getAllMojangCores(mojangFilter);
        if (mounted.current) {
          setCores(r);
        }
        isLoaded.current = true;
      }
    })();

    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  useEffect(() => {
    void (async () => {
      const lForge = await getForgeVersionByMojang(baseMojangVersionForge);
      if (mounted.current) {
        setDetectedForgeVersion(lForge);
      }
    })();
  }, [baseMojangVersionForge]);
  useEffect(() => {
    void (async () => {
      if (!(await canSupportGame(baseMojangVersionFabric))) {
        if (mounted.current) {
          setDetectedFabricVersion("");
        }
        return;
      }
      const d = (await getLatestFabricInstallerAndLoader()).getSecondValue();
      if (mounted.current) {
        setDetectedFabricVersion(d);
      }
    })();
  }, [baseMojangVersionFabric]);

  useEffect(() => {
    void (async () => {
      const aCores = await filterFabricCores();
      if (mounted.current) {
        setFabricCores(aCores);
      }
    })();
  }, [updateFabricCoresBit]);

  useEffect(() => {
    void (async () => {
      const aCores = await filterMojangCores();
      if (mounted.current) {
        setPatchableCores(aCores);
      }
    })();
  }, [updatePatchableCoresBit]);
  return (
    <ThemeProvider
      theme={
        isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
      }
    >
      <Container>
        <Box className={classes.root}>
          <FailedHint
            open={failed}
            closeFunc={() => {
              setFailed(false);
            }}
            reason={failedMsg}
          />
          <OperatingHintCustom
            open={operating}
            msg={progressMsg + "\n" + doing}
          />
          <Tabs
            value={tabValue}
            onChange={(_e, v) => {
              setTabValue(v);
            }}
            centered
          >
            <Tab
              label={
                <Grid container direction="row" alignItems="center">
                  <Grid item>
                    <Avatar
                      variant={"square"}
                      sx={{ width: "2rem", height: "2rem" }}
                      src={Icons.PROFILE_MOJANG}
                    />
                  </Grid>
                  <Grid item>
                    <Typography color={"primary"} sx={{ marginLeft: "0.25em" }}>
                      {tr("InstallCore.InstallMinecraft")}
                    </Typography>
                  </Grid>
                </Grid>
              }
            />
            <Tab
              label={
                <Grid container direction="row" alignItems="center">
                  <Grid item>
                    <Avatar
                      variant={"square"}
                      sx={{ width: "2rem", height: "2rem" }}
                      src={Icons.PROFILE_FORGE}
                    />
                  </Grid>
                  <Grid item>
                    <Typography color={"primary"} sx={{ marginLeft: "0.25em" }}>
                      {tr("InstallCore.InstallForge")}
                    </Typography>
                  </Grid>
                </Grid>
              }
            />

            <Tab
              label={
                <Grid container direction="row" alignItems="center">
                  <Grid item>
                    <Avatar
                      variant={"square"}
                      sx={{ width: "2rem", height: "2rem" }}
                      src={Icons.PROFILE_FABRIC}
                    />
                  </Grid>
                  <Grid item>
                    <Typography color={"primary"} sx={{ marginLeft: "0.25em" }}>
                      {tr("InstallCore.InstallFabric")}
                    </Typography>
                  </Grid>
                </Grid>
              }
            />
            <Tab
              label={
                <Grid container direction="row" alignItems="center">
                  <Grid item>
                    <Avatar
                      variant={"square"}
                      sx={{ width: "2rem", height: "2rem" }}
                      src={Icons.PROFILE_IRIS}
                    />
                  </Grid>
                  <Grid item>
                    <Typography color={"primary"} sx={{ marginLeft: "0.25em" }}>
                      {tr("InstallCore.InstallIris")}
                    </Typography>
                  </Grid>
                </Grid>
              }
            />
          </Tabs>
          {/* Mojang */}
          <TabPanel value={tabValue} index={0}>
            <FormControl fullWidth>
              <Typography className={classes.instr}>
                {tr("InstallCore.InstallMinecraftInstr")}
              </Typography>
              <br />
              <FormControl variant={"outlined"} className={classes.formControl}>
                <InputLabel
                  id={"CoreInstall-Mojang-SelectArch"}
                  className={classes.label}
                >
                  {tr("InstallCore.MinecraftArch")}
                </InputLabel>
                <ShiftEle name={"InstallCoreMinecraft"} bgfill>
                  <Select
                    sx={{ color: "primary.main" }}
                    variant={"outlined"}
                    labelId={"CoreInstall-Mojang-SelectArch"}
                    color={"primary"}
                    onChange={(e) => {
                      isLoaded.current = false;
                      setSelectedMojangVersion("");
                      setMojangFilter(e.target.value as ReleaseType);
                    }}
                    value={mojangFilter || ReleaseType.RELEASE}
                    label={tr("InstallCore.MinecraftArch")}
                  >
                    <MenuItem value={ReleaseType.RELEASE}>
                      {tr("InstallCore.Release")}
                    </MenuItem>
                    <MenuItem value={ReleaseType.SNAPSHOT}>
                      {tr("InstallCore.Snapshot")}
                    </MenuItem>
                    <MenuItem value={ReleaseType.OLD_ALPHA}>
                      {tr("InstallCore.OldAlpha")}
                    </MenuItem>
                    <MenuItem value={ReleaseType.OLD_BETA}>
                      {tr("InstallCore.OldBeta")}
                    </MenuItem>
                  </Select>
                </ShiftEle>
              </FormControl>
              <br />
              <FormControl variant={"outlined"} className={classes.formControl}>
                <InputLabel
                  id={"CoreInstall-Mojang-SelectVersion"}
                  className={classes.label}
                >
                  {tr("InstallCore.MinecraftVersion")}
                </InputLabel>
                <ShiftEle name={"InstallCoreMinecraft"} bgfill>
                  <Select
                    sx={{ color: "primary.main" }}
                    variant={"outlined"}
                    labelId={"CoreInstall-Mojang-SelectVersion"}
                    color={"primary"}
                    label={tr("InstallCore.MinecraftVersion")}
                    onChange={(e) => {
                      setSelectedMojangVersion(String(e.target.value || ""));
                    }}
                    value={selectedMojangVersion || ""}
                  >
                    {foundCores.map((c) => {
                      return (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </ShiftEle>
              </FormControl>
              <br />
              <FormControl variant={"outlined"} className={classes.formControl}>
                <InputLabel
                  id={"CoreInstall-Mojang-TargetContainer"}
                  className={classes.label}
                >
                  {tr("InstallCore.TargetContainer")}
                </InputLabel>
                <ShiftEle name={"InstallCoreMinecraft"} bgfill>
                  <Select
                    sx={{ color: "primary.main" }}
                    label={tr("InstallCore.TargetContainer")}
                    variant={"outlined"}
                    labelId={"CoreInstall-Mojang-TargetContainer"}
                    color={"primary"}
                    onChange={(e) => {
                      setMojangContainer(String(e.target.value || ""));
                    }}
                    value={selectedMojangContainer || ""}
                  >
                    {getAllMounted().map((c) => {
                      return (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </ShiftEle>
              </FormControl>
              <br />
              <Button
                size={"large"}
                className={classes.btn}
                variant={"contained"}
                color={"primary"}
                disabled={
                  isNull(selectedMojangVersion) ||
                  isNull(selectedMojangContainer)
                }
                onClick={async () => {
                  clearDoing();
                  setChangePageWarn(true);
                  setOperating(true);
                  setFailed(false);
                  setProgressMsg(tr("InstallCore.Progress.FetchingProfile"));
                  const u = await getProfileURLById(selectedMojangVersion);
                  if (u.length === 0) {
                    if (mounted.current) {
                      setOperating(false);
                      setChangePageWarn(false);
                      setFailed(true);
                      setFailedMsg(
                        tr("InstallCore.Progress.FailedToFetchProfile")
                      );
                    }
                  }
                  setProgressMsg(tr("InstallCore.Progress.DownloadingProfile"));

                  try {
                    await downloadProfile(
                      u,
                      getContainer(selectedMojangContainer),
                      selectedMojangVersion
                    );
                    updatePatchableCores(!updatePatchableCoresBit);
                    if (mounted.current) {
                      setOperating(false);
                      setChangePageWarn(false);
                      setFailed(false);
                      submitSucc(tr("InstallCore.Success"));
                    }
                  } catch {
                    if (mounted.current) {
                      setOperating(false);
                      setChangePageWarn(false);
                      setFailed(true);
                      setFailedMsg(
                        tr("InstallCore.Progress.FailedToInstallProfile")
                      );
                    }
                  }
                }}
              >
                {tr("InstallCore.Start")}
              </Button>
            </FormControl>
          </TabPanel>
          {/* Forge */}
          <TabPanel value={tabValue} index={1}>
            <FormControl fullWidth>
              <Typography className={classes.instr}>
                {tr("InstallCore.InstallForgeInstr")}
              </Typography>
              <Typography className={classes.text} color={"secondary"}>
                {tr("InstallCore.ForgeVersion") +
                  " " +
                  (detectedForgeVersion || tr("InstallCore.Unknown"))}
              </Typography>
              <br />
              <FormControl variant={"outlined"} className={classes.formControl}>
                <InputLabel
                  id={"CoreInstall-Forge-SelectBase"}
                  className={classes.label}
                >
                  {tr("InstallCore.ForgeBaseVersion")}
                </InputLabel>
                <Select
                  label={tr("InstallCore.ForgeBaseVersion")}
                  variant={"outlined"}
                  labelId={"CoreInstall-Forge-SelectBase"}
                  color={"primary"}
                  onChange={(e) => {
                    const s = String(e.target.value).split(ALICORN_SEPARATOR);
                    if (s.length >= 2) {
                      const c = String(s.shift());
                      const i = String(s.shift());
                      setBaseMojangVersionForge(i);
                      setForgeContainer(c);
                    }
                  }}
                  value={
                    selectedForgeContainer && baseMojangVersionForge
                      ? selectedForgeContainer +
                        ALICORN_SEPARATOR +
                        baseMojangVersionForge
                      : ""
                  }
                >
                  {patchableCores.map((r) => {
                    return (
                      <MenuItem
                        key={r.container + "/" + r.id}
                        value={r.container + ALICORN_SEPARATOR + r.id}
                      >
                        {`${r.container}/${r.id}`}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <br />
              <Button
                size={"large"}
                className={classes.btn}
                variant={"contained"}
                color={"primary"}
                disabled={
                  isNull(selectedForgeContainer) || isNull(detectedForgeVersion)
                }
                onClick={async () => {
                  clearDoing();
                  setChangePageWarn(true);
                  const mcv = baseMojangVersionForge;
                  const fgv = detectedForgeVersion;
                  setOperating(true);
                  setFailed(false);
                  const ct = getContainer(selectedForgeContainer);
                  setProgressMsg(
                    tr(
                      "InstallCore.Progress.Fetching",
                      `Loader=Forge`,
                      `MCV=${mcv}`
                    )
                  );
                  const stat = await getForgeInstaller(ct, mcv, fgv);
                  if (!stat) {
                    if (mounted.current) {
                      setOperating(false);
                      setChangePageWarn(false);
                      setFailed(true);
                      setFailedMsg(
                        tr(
                          "InstallCore.Progress.FailedToDownload",
                          `Loader=Forge`
                        )
                      );
                    }
                    return;
                  }
                  setProgressMsg(tr("InstallCore.Progress.ExecutingForge"));
                  const istat = await performForgeInstall(
                    await getJavaRunnable(getDefaultJavaHome()),
                    generateForgeInstallerName(mcv, fgv),
                    ct
                  );
                  await removeForgeInstaller(ct, mcv, fgv);
                  if (!istat) {
                    if (mounted.current) {
                      setOperating(false);
                      setChangePageWarn(false);
                      setFailed(true);
                      setFailedMsg(tr("InstallCore.Progress.CouldNotExecute"));
                    }
                    return;
                  } else {
                    if (mounted.current) {
                      setOperating(false);
                      setChangePageWarn(false);
                      setFailed(false);
                      submitSucc(tr("InstallCore.Success"));
                    }
                  }
                }}
              >
                {tr("InstallCore.Start")}
              </Button>
            </FormControl>
          </TabPanel>
          {/* Fabric */}
          <TabPanel value={tabValue} index={2}>
            <FormControl fullWidth>
              <Typography className={classes.instr}>
                {tr("InstallCore.InstallFabricInstr")}
              </Typography>
              <Typography className={classes.text} color={"secondary"}>
                {tr("InstallCore.FabricVersion") +
                  " " +
                  (detectedFabricVersion || tr("InstallCore.Unknown"))}
              </Typography>
              <br />
              <FormControl variant={"outlined"} className={classes.formControl}>
                <InputLabel
                  id={"CoreInstall-Fabric-SelectBase"}
                  className={classes.label}
                >
                  {tr("InstallCore.FabricBaseVersion")}
                </InputLabel>
                <Select
                  label={tr("InstallCore.FabricBaseVersion")}
                  variant={"outlined"}
                  labelId={"CoreInstall-Fabric-SelectBase"}
                  color={"primary"}
                  onChange={(e) => {
                    const s = String(e.target.value).split(ALICORN_SEPARATOR);
                    if (s.length >= 2) {
                      const c = String(s.shift());
                      const i = String(s.shift());
                      setBaseMojangVersionFabric(i);
                      setFabricContainer(c);
                    }
                  }}
                  value={
                    selectedFabricContainer && baseMojangVersionFabric
                      ? selectedFabricContainer +
                        ALICORN_SEPARATOR +
                        baseMojangVersionFabric
                      : ""
                  }
                >
                  {patchableCores.map((r) => {
                    return (
                      <MenuItem
                        key={r.container + "/" + r.id}
                        value={r.container + ALICORN_SEPARATOR + r.id}
                      >
                        {`${r.container}/${r.id}`}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <br />
              <Button
                size={"large"}
                className={classes.btn}
                variant={"contained"}
                color={"primary"}
                disabled={
                  isNull(selectedFabricContainer) ||
                  isNull(detectedFabricVersion)
                }
                onClick={async () => {
                  clearDoing();
                  setChangePageWarn(true);
                  setOperating(true);
                  setFailed(false);
                  setProgressMsg(
                    "Resloving Fabric installer and loader info..."
                  );
                  const u = (
                    await getLatestFabricInstallerAndLoader()
                  ).getFirstValue();
                  const fbv = detectedFabricVersion;
                  const mcv = baseMojangVersionFabric;
                  const ct = getContainer(selectedFabricContainer);
                  if (isNull(u)) {
                    if (mounted.current) {
                      setFailedMsg("Invalid Fabric info received.");
                      setOperating(false);
                      setChangePageWarn(false);
                      setFailed(true);
                    }
                    return;
                  }
                  setProgressMsg(
                    tr(
                      "InstallCore.Progress.Fetching",
                      `Loader=Fabric`,
                      `MCV=${mcv}`
                    )
                  );
                  const stat = await getFabricInstaller(u, ct);
                  if (!stat) {
                    if (mounted.current) {
                      setOperating(false);
                      setChangePageWarn(false);
                      setFailed(true);
                      setFailedMsg(
                        tr(
                          "InstallCore.Progress.FailedToDownload",
                          `Loader=Fabric`
                        )
                      );
                    }
                    return;
                  }
                  setProgressMsg(tr("InstallCore.Progress.ExecutingFabric"));

                  const stat2 = await performFabricInstall(
                    await getJavaRunnable(getDefaultJavaHome()),
                    u,
                    fbv,
                    mcv,
                    ct
                  );
                  await removeFabricInstaller(u, ct);
                  if (!stat2) {
                    if (mounted.current) {
                      setOperating(false);
                      setChangePageWarn(false);
                      setFailed(true);
                      setFailedMsg(tr("InstallCore.Progress.CouldNotExecute"));
                    }
                    return;
                  }
                  updateFabricCores(!updateFabricCoresBit);
                  setProgressMsg("Done! Cleaning up files...");
                  if (mounted.current) {
                    setOperating(false);
                    setChangePageWarn(false);
                    setFailed(false);
                    submitSucc(tr("InstallCore.Success"));
                  }
                }}
              >
                {tr("InstallCore.Start")}
              </Button>
            </FormControl>
          </TabPanel>
          {/* Iris */}
          <TabPanel value={tabValue} index={3}>
            <FormControl fullWidth>
              <Typography className={classes.instr}>
                {tr("InstallCore.InstallIrisInstr")}
              </Typography>
              <br />
              <FormControl variant={"outlined"} className={classes.formControl}>
                <InputLabel
                  id={"CoreInstall-Iris-SelectBase"}
                  className={classes.label}
                >
                  {tr("InstallCore.IrisBaseVersion")}
                </InputLabel>
                <Select
                  label={tr("InstallCore.IrisBaseVersion")}
                  variant={"outlined"}
                  labelId={"CoreInstall-Iris-SelectBase"}
                  color={"primary"}
                  onChange={(e) => {
                    const s = String(e.target.value).split(ALICORN_SEPARATOR);
                    if (s.length >= 2) {
                      const c = String(s.shift());
                      const i = String(s.shift());
                      setSelectedIrisBase(i);
                      setSelectedIrisContainer(c);
                    }
                  }}
                  value={
                    selectedIrisContainer && selectedIrisBase
                      ? selectedIrisContainer +
                        ALICORN_SEPARATOR +
                        selectedIrisBase
                      : ""
                  }
                >
                  {fabricCores.map((r) => {
                    return (
                      <MenuItem
                        key={r.container + "/" + r.id}
                        value={r.container + ALICORN_SEPARATOR + r.id}
                      >
                        {`${r.container}/${r.id}`}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <br />
              <Button
                size={"large"}
                className={classes.btn}
                variant={"contained"}
                color={"primary"}
                disabled={isNull(selectedIrisContainer)}
                onClick={async () => {
                  try {
                    const prof = await loadProfile(
                      selectedIrisBase,
                      getContainer(selectedIrisContainer),
                      true
                    );
                    if (!isNull(prof.baseVersion)) {
                      jumpTo(
                        `/PffFront/${encodeURIComponent(
                          selectedIrisContainer
                        )}/${encodeURIComponent(
                          prof.baseVersion
                        )}/Fabric/iris-shaders/1`
                      );
                      triggerSetPage("PffFront");
                    }
                  } catch (e) {
                    submitWarn(String(e));
                  }
                }}
              >
                {tr("InstallCore.Start")}
              </Button>
            </FormControl>
          </TabPanel>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

function TabPanel(props: {
  children?: React.ReactNode;
  index: string | number;
  value: string | number;
}): JSX.Element {
  const { children, value, index } = props;
  return (
    <Container hidden={value !== index}>
      {value === index ? <Box p={3}>{children}</Box> : ""}
    </Container>
  );
}
interface PatchableCore {
  id: string;
  container: string;
}
async function filterMojangCores(): Promise<PatchableCore[]> {
  const cores = await scanCoresInAllMountedContainers();
  const b: PatchableCore[] = [];
  for (const [c, ids] of cores) {
    for (const i of ids) {
      if (whatProfile(i) === ProfileType.MOJANG) {
        b.push({ id: i, container: c.id });
      }
    }
  }
  return b;
}
async function filterFabricCores(): Promise<PatchableCore[]> {
  const cores = await scanCoresInAllMountedContainers();
  const b: PatchableCore[] = [];
  for (const [c, ids] of cores) {
    for (const i of ids) {
      if (whatProfile(i) === ProfileType.FABRIC) {
        b.push({ id: i, container: c.id });
      }
    }
  }
  return b;
}
