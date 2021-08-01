import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  MuiThemeProvider,
  Select,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from "@material-ui/core";
import objectHash from "object-hash";
import React, { useEffect, useRef, useState } from "react";
import { ReleaseType } from "../modules/commons/Constants";
import { isNull } from "../modules/commons/Null";
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
import { getJavaRunnable, getLastUsedJavaHome } from "../modules/java/JInfo";
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
  getAllMojangCores,
  getProfile,
  getProfileURLById,
} from "../modules/pff/get/MojangCore";
import { performFabricInstall } from "../modules/pff/install/FabricInstall";
import { performForgeInstall } from "../modules/pff/install/ForgeInstall";
import { installProfile } from "../modules/pff/install/MojangInstall";
import { FailedHint, OperatingHintCustom } from "./OperatingHint";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { useFormStyles } from "./Stylex";
import { tr } from "./Translator";

export function InstallCore(): JSX.Element {
  const classes = useFormStyles();
  const [foundCores, setCores] = useState<string[]>([]);
  const isLoaded = useRef<boolean>(false);
  const mounted = useRef<boolean>();
  const [doing, setDoing] = useState(getDoing());
  const [selectedMojangVersion, setSelectedMojangVersion] =
    useState<string>("");
  const [mojangFilter, setMojangFilter] = useState<ReleaseType>(
    ReleaseType.RELEASE
  );
  const [baseMojangVersionForge, setBaseMojangVersionForge] =
    useState<string>("");
  const [failedMsg, setFailedMsg] = useState<string>();
  const [baseMojangVersionFabric, setBaseMojangVersionFabric] =
    useState<string>("");
  const [allMojangRelease, setAllMojangRelease] = useState<string[]>([]);
  const [detectedForgeVersion, setDetectedForgeVersion] = useState("");
  const [detectedFabricVersion, setDetectedFabricVersion] =
    useState<string>("");
  const [selectedMojangContainer, setMojangContainer] = useState("");
  const [selectedForgeContainer, setForgeContainer] = useState("");
  const [selectedFabricContainer, setFabricContainer] = useState("");
  const [mojangConfirmOpenBit, setMojangConfirmOpen] = useState(false);
  const [forgeConfirmOpenBit, setForgeConfirmOpen] = useState(false);
  const [fabricConfirmOpenBit, setFabricConfirmOpen] = useState(false);
  const [operating, setOperating] = useState(false);
  const [failed, setFailed] = useState(false);
  const [openNotice, setOpenNotice] = useState(false);
  const [progressMsg, _setProgressMsg] = useState("");
  const [tabValue, setTabValue] = useState(0);
  function setProgressMsg(msg: string): void {
    // Binding
    if (mounted.current) {
      _setProgressMsg(msg);
    }
  }
  useEffect(() => {
    subscribeDoing("InstallCore", (d) => {
      setDoing(d);
    });
    return () => {
      unsubscribeDoing("InstallCore");
    };
  });
  useEffect(() => {
    (async () => {
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
    (async () => {
      const lForge = await getForgeVersionByMojang(baseMojangVersionForge);
      if (mounted.current) {
        setDetectedForgeVersion(lForge);
      }
    })();
  }, [baseMojangVersionForge]);
  useEffect(() => {
    (async () => {
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
    (async () => {
      const allMj = await getAllMojangCores(ReleaseType.RELEASE);
      if (mounted.current) {
        setAllMojangRelease(allMj);
      }
    })();
  }, []);
  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <Box className={classes.root}>
        <Snackbar
          open={openNotice}
          message={tr("InstallCore.Success")}
          autoHideDuration={3000}
          onClose={() => {
            setOpenNotice(false);
          }}
        />
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
        <ConfirmInstall
          container={selectedForgeContainer}
          version={`${baseMojangVersionForge}-forge-${detectedForgeVersion}`}
          open={forgeConfirmOpenBit}
          closeFunc={() => {
            setForgeConfirmOpen(false);
          }}
          confirmFunc={async () => {
            clearDoing();
            const mcv = baseMojangVersionForge;
            const fgv = detectedForgeVersion;
            setForgeConfirmOpen(false);
            setOperating(true);
            setFailed(false);
            const ct = getContainer(selectedForgeContainer);
            setProgressMsg(
              `Fetching Forge installer for Minecraft ${mcv} and Forge ${fgv}...`
            );
            const stat = await getForgeInstaller(ct, mcv, fgv);
            if (!stat) {
              if (mounted.current) {
                setOperating(false);
                setFailed(true);
                setFailedMsg(
                  `Could not download the installer for Forge ${fgv} with Minecraft ${mcv}`
                );
              }
              return;
            }
            setProgressMsg("Executing Forge installer...");
            const istat = await performForgeInstall(
              await getJavaRunnable(getLastUsedJavaHome()),
              generateForgeInstallerName(mcv, fgv),
              ct
            );
            if (!istat) {
              if (mounted.current) {
                setOperating(false);
                setFailed(true);
                setFailedMsg(
                  `Could not execute the installer or the installer reported an error for Forge ${fgv} with Minecraft ${mcv}`
                );
              }
              return;
            } else {
              setProgressMsg("Done! Cleaning up files...");
              await removeForgeInstaller(ct, mcv, fgv);
              if (mounted.current) {
                setOperating(false);
                setFailed(false);
                setOpenNotice(true);
              }
            }
          }}
        />
        <ConfirmInstall
          container={selectedFabricContainer}
          version={`fabric-loader-${detectedFabricVersion}-${baseMojangVersionFabric}`}
          open={fabricConfirmOpenBit}
          closeFunc={() => {
            setFabricConfirmOpen(false);
          }}
          confirmFunc={async () => {
            clearDoing();
            setFabricConfirmOpen(false);
            setOperating(true);
            setFailed(false);
            setProgressMsg("Resloving Fabric installer and loader info...");
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
                setFailed(true);
              }
              return;
            }
            setProgressMsg(
              `Fetching Fabric installer for Minecraft ${mcv} and Fabric ${fbv}...`
            );
            const stat = await getFabricInstaller(u, ct);
            if (!stat) {
              if (mounted.current) {
                setOperating(false);
                setFailed(true);
                setFailedMsg(
                  `Could not download the installer for Fabric ${fbv} with Minecraft ${mcv}`
                );
              }
              return;
            }
            setProgressMsg("Executing Fabric installer...");

            const stat2 = await performFabricInstall(
              await getJavaRunnable(getLastUsedJavaHome()),
              u,
              fbv,
              mcv,
              ct
            );
            if (!stat2) {
              if (mounted.current) {
                setOperating(false);
                setFailed(true);
                setFailedMsg(
                  `Could not execute the installer or the installer reported an error for Fabric ${fbv} with Minecraft ${mcv}`
                );
              }
              return;
            }
            setProgressMsg("Done! Cleaning up files...");
            await removeFabricInstaller(u, ct);
            if (mounted.current) {
              setOperating(false);
              setFailed(false);
              setOpenNotice(true);
            }
          }}
        />
        <ConfirmInstall
          container={selectedMojangContainer}
          version={selectedMojangVersion}
          open={mojangConfirmOpenBit}
          closeFunc={() => {
            setMojangConfirmOpen(false);
          }}
          confirmFunc={async () => {
            clearDoing();
            setMojangConfirmOpen(false);
            setOperating(true);
            setFailed(false);
            setProgressMsg(
              `Fetching profile url for ${selectedMojangVersion}...`
            );
            const u = await getProfileURLById(selectedMojangVersion);
            if (u.length === 0) {
              if (mounted.current) {
                setOperating(false);
                setFailed(true);
                setFailedMsg(
                  `Could not get the profile for Minecraft ${selectedMojangVersion}`
                );
              }
            }
            setProgressMsg(`Downloading profile...`);
            const d = await getProfile(u);
            if (isNull(d) || Object.keys(d).length === 0) {
              if (mounted.current) {
                setOperating(false);
                setFailed(true);
                setFailedMsg(
                  "Received invalid profile from Minecraft server or its mirror!"
                );
              }
            }
            setProgressMsg(`Installing profile as ${selectedMojangVersion}...`);

            try {
              await installProfile(
                selectedMojangVersion,
                d,
                getContainer(selectedMojangContainer)
              );
              if (mounted.current) {
                setOperating(false);
                setFailed(false);
                setOpenNotice(true);
              }
            } catch {
              if (mounted.current) {
                setOperating(false);
                setFailed(true);
                setFailedMsg("Could not install profile to the container!");
              }
            }
          }}
        />
        <Tabs
          value={tabValue}
          onChange={(_e, v) => {
            setTabValue(v);
          }}
        >
          <Tab
            label={
              <Typography color={"primary"}>
                {tr("InstallCore.InstallMinecraft")}
              </Typography>
            }
          />
          <Tab
            label={
              <Typography color={"primary"}>
                {tr("InstallCore.InstallForge")}
              </Typography>
            }
          />
          <Tab
            label={
              <Typography color={"primary"}>
                {tr("InstallCore.InstallFabric")}
              </Typography>
            }
          />
        </Tabs>
        {/* Mojang */}
        <TabPanel value={tabValue} index={0}>
          <Typography className={classes.instr}>
            {tr("InstallCore.InstallMinecraftInstr")}
          </Typography>
          <FormControl className={classes.formControl}>
            <InputLabel
              id={"CoreInstall-Mojang-SelectArch"}
              className={classes.label}
            >
              {tr("InstallCore.MinecraftArch")}
            </InputLabel>
            <Select
              labelId={"CoreInstall-Mojang-SelectArch"}
              color={"primary"}
              className={classes.selector}
              onChange={(e) => {
                isLoaded.current = false;
                setSelectedMojangVersion("");
                setMojangFilter(e.target.value as ReleaseType);
              }}
              value={mojangFilter || ReleaseType.RELEASE}
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
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel
              id={"CoreInstall-Mojang-SelectVersion"}
              className={classes.label}
            >
              {tr("InstallCore.MinecraftVersion")}
            </InputLabel>
            <Select
              labelId={"CoreInstall-Mojang-SelectVersion"}
              color={"primary"}
              className={classes.selector}
              onChange={(e) => {
                setSelectedMojangVersion(String(e.target.value || ""));
              }}
              value={selectedMojangVersion || ""}
            >
              {foundCores.map((c) => {
                return (
                  <MenuItem key={objectHash(c)} value={c}>
                    {c}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel
              id={"CoreInstall-Mojang-TargetContainer"}
              className={classes.label}
            >
              {tr("InstallCore.TargetContainer")}
            </InputLabel>
            <Select
              labelId={"CoreInstall-Mojang-TargetContainer"}
              color={"primary"}
              className={classes.selector}
              onChange={(e) => {
                setMojangContainer(String(e.target.value || ""));
              }}
              value={selectedMojangContainer || ""}
            >
              {getAllMounted().map((c) => {
                return (
                  <MenuItem key={objectHash(c)} value={c}>
                    {c}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Button
            className={classes.btn}
            variant={"outlined"}
            color={"primary"}
            disabled={
              isNull(selectedMojangVersion) || isNull(selectedMojangContainer)
            }
            onClick={() => {
              setMojangConfirmOpen(true);
            }}
          >
            {tr("InstallCore.Start")}
          </Button>
        </TabPanel>
        {/* Forge */}
        <TabPanel value={tabValue} index={1}>
          <Typography className={classes.instr}>
            {tr("InstallCore.InstallForgeInstr")}
          </Typography>
          <Typography className={classes.text} color={"secondary"}>
            {tr("InstallCore.ForgeVersion") +
              " " +
              (detectedForgeVersion || tr("InstallCore.Unknown"))}
          </Typography>
          <FormControl className={classes.formControl}>
            <InputLabel
              id={"CoreInstall-Forge-SelectBase"}
              className={classes.label}
            >
              {tr("InstallCore.ForgeBaseVersion")}
            </InputLabel>
            <Select
              labelId={"CoreInstall-Forge-SelectBase"}
              color={"primary"}
              className={classes.selector}
              onChange={(e) => {
                setBaseMojangVersionForge(String(e.target.value || ""));
              }}
              value={baseMojangVersionForge || ""}
            >
              {allMojangRelease.map((r) => {
                return (
                  <MenuItem key={objectHash(r)} value={r}>
                    {r}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel
              id={"CoreInstall-Forge-TargetContainer"}
              className={classes.label}
            >
              {tr("InstallCore.TargetContainer")}
            </InputLabel>
            <Select
              labelId={"CoreInstall-Forge-TargetContainer"}
              color={"primary"}
              className={classes.selector}
              onChange={(e) => {
                setForgeContainer(String(e.target.value || ""));
              }}
              value={selectedForgeContainer || ""}
            >
              {getAllMounted().map((c) => {
                return (
                  <MenuItem key={objectHash(c)} value={c}>
                    {c}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Button
            className={classes.btn}
            variant={"outlined"}
            color={"primary"}
            disabled={
              isNull(selectedForgeContainer) || isNull(detectedForgeVersion)
            }
            onClick={() => {
              setForgeConfirmOpen(true);
            }}
          >
            {tr("InstallCore.Start")}
          </Button>
        </TabPanel>

        {/* Fabric */}
        <TabPanel value={tabValue} index={2}>
          <Typography className={classes.instr}>
            {tr("InstallCore.InstallFabricInstr")}
          </Typography>
          <Typography className={classes.text} color={"secondary"}>
            {tr("InstallCore.FabricVersion") +
              " " +
              (detectedFabricVersion || tr("InstallCore.Unknown"))}
          </Typography>
          <FormControl className={classes.formControl}>
            <InputLabel
              id={"CoreInstall-Fabric-SelectBase"}
              className={classes.label}
            >
              {tr("InstallCore.FabricBaseVersion")}
            </InputLabel>
            <Select
              labelId={"CoreInstall-Fabric-SelectBase"}
              color={"primary"}
              className={classes.selector}
              onChange={(e) => {
                setBaseMojangVersionFabric(String(e.target.value || ""));
              }}
              value={baseMojangVersionFabric || ""}
            >
              {allMojangRelease.map((r) => {
                return (
                  <MenuItem key={objectHash(r)} value={r}>
                    {r}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel
              id={"CoreInstall-Fabric-TargetContainer"}
              className={classes.label}
            >
              {tr("InstallCore.TargetContainer")}
            </InputLabel>
            <Select
              labelId={"CoreInstall-Fabric-TargetContainer"}
              color={"primary"}
              className={classes.selector}
              onChange={(e) => {
                setFabricContainer(String(e.target.value || ""));
              }}
              value={selectedFabricContainer || ""}
            >
              {getAllMounted().map((c) => {
                return (
                  <MenuItem key={objectHash(c)} value={c}>
                    {c}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Button
            className={classes.btn}
            variant={"outlined"}
            color={"primary"}
            disabled={
              isNull(selectedFabricContainer) || isNull(detectedFabricVersion)
            }
            onClick={() => {
              setFabricConfirmOpen(true);
            }}
          >
            {tr("InstallCore.Start")}
          </Button>
        </TabPanel>
      </Box>
    </MuiThemeProvider>
  );
}

function ConfirmInstall(props: {
  version: string;
  open: boolean;
  container: string;
  closeFunc: () => unknown;
  confirmFunc: () => unknown;
}): JSX.Element {
  return (
    <Dialog open={props.open} onClose={props.closeFunc}>
      <DialogTitle>{tr("InstallCore.Confirm.Ready")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {tr(
            "InstallCore.Confirm.Hint",
            `Version=${props.version}`,
            `Container=${props.container}`
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant={"outlined"} onClick={props.confirmFunc}>
          {tr("InstallCore.Confirm.OK")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
function TabPanel(props: {
  children?: React.ReactNode;
  index: string | number;
  value: string | number;
}): JSX.Element {
  const { children, value, index } = props;
  return (
    <Box hidden={value !== index}>
      {value === index ? <Box p={3}>{children}</Box> : ""}
    </Box>
  );
}
