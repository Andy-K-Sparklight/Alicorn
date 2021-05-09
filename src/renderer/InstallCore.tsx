import React, { useEffect, useRef, useState } from "react";
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
  Select,
  Snackbar,
  Typography,
} from "@material-ui/core";
import { tr } from "./Translator";
import { ReleaseType } from "../modules/commons/Constants";
import {
  getAllMojangCores,
  getProfile,
  getProfileURLById,
} from "../modules/pff/get/MojangCore";
import objectHash from "object-hash";
import { isNull } from "../modules/commons/Null";
import {
  getAllMounted,
  getContainer,
} from "../modules/container/ContainerUtil";
import { FailedHint, OperatingHint } from "./OperatingHint";
import { installProfile } from "../modules/pff/install/MojangInstall";
import { useFormStyles } from "./Stylex";
import {
  generateForgeInstallerName,
  getForgeInstaller,
  getForgeVersionByMojang,
} from "../modules/pff/get/ForgeGet";
import { performForgeInstall } from "../modules/pff/install/ForgeInstall";
import { getJavaRunnable, getLastUsedJavaHome } from "../modules/java/JInfo";

export function InstallCore(): JSX.Element {
  const classes = useFormStyles();
  const [foundCores, setCores] = useState<string[]>([]);
  const isLoaded = useRef<boolean>(false);
  const mounted = useRef<boolean>();
  const [selectedMojangVersion, setSelectedMojangVersion] = useState<string>(
    ""
  );
  const [mojangFilter, setMojangFilter] = useState<ReleaseType>(
    ReleaseType.RELEASE
  );
  const [baseMojangVersionForge, setBaseMojangVersionForge] = useState<string>(
    ""
  );
  const [allMojangRelease, setAllMojangRelease] = useState<string[]>([]);
  const [detectedForgeVersion, setDetectedForgeVersion] = useState<string>("");
  const [selectedMojangContainer, setMojangContainer] = useState<string>("");
  const [selectedForgeContainer, setForgeContainer] = useState<string>("");
  const [mojangConfirmOpenBit, setMojangConfirmOpen] = useState<boolean>(false);
  const [forgeConfirmOpenBit, setForgeConfirmOpen] = useState<boolean>(false);
  const [operating, setOperating] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  const [openNotice, setOpenNotice] = useState<boolean>(false);
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
      console.log("Regenerating Forge Version For " + baseMojangVersionForge);
      const lForge = await getForgeVersionByMojang(baseMojangVersionForge);
      console.log(lForge);
      if (mounted.current) {
        setDetectedForgeVersion(lForge);
      }
    })();
  }, [baseMojangVersionForge]);
  useEffect(() => {
    (async () => {
      const allMj = await getAllMojangCores(ReleaseType.RELEASE);
      if (mounted.current) {
        setAllMojangRelease(allMj);
      }
    })();
  }, []);
  return (
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
      />
      <OperatingHint open={operating} />
      <ConfirmInstall
        version={`${baseMojangVersionForge}-forge-${detectedForgeVersion}`}
        open={forgeConfirmOpenBit}
        closeFunc={() => {
          setForgeConfirmOpen(false);
        }}
        className={classes.input}
        confirmFunc={async () => {
          const mcv = baseMojangVersionForge;
          const fgv = detectedForgeVersion;
          setForgeConfirmOpen(false);
          setOperating(true);
          setFailed(false);
          const ct = getContainer(selectedForgeContainer);
          console.log(`Using mcv ${mcv} fgv ${fgv}`);
          const stat = await getForgeInstaller(ct, mcv, fgv);
          if (!stat) {
            if (mounted.current) {
              setOperating(false);
              setFailed(true);
            }
            return;
          }
          console.log("Forge Installer Downloaded.");
          const istat = await performForgeInstall(
            await getJavaRunnable(getLastUsedJavaHome()),
            generateForgeInstallerName(mcv, fgv),
            ct
          );
          if (!istat) {
            console.log("Failed to execute installer!");
            if (mounted.current) {
              setOperating(false);
              setFailed(true);
            }
            return;
          } else {
            if (mounted.current) {
              setOperating(false);
              setFailed(false);
              setOpenNotice(true);
            }
          }
        }}
      />
      <ConfirmInstall
        version={selectedMojangVersion}
        className={classes.input}
        open={mojangConfirmOpenBit}
        closeFunc={() => {
          setMojangConfirmOpen(false);
        }}
        confirmFunc={async () => {
          setMojangConfirmOpen(false);
          setOperating(true);
          setFailed(false);
          const u = await getProfileURLById(selectedMojangVersion);
          if (u.length === 0) {
            if (mounted.current) {
              setOperating(false);
              setFailed(true);
            }
          }
          const d = await getProfile(u);
          if (isNull(d) || Object.keys(d).length === 0) {
            if (mounted.current) {
              setOperating(false);
              setFailed(true);
            }
          }
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
            }
          }
        }}
      />
      {/* Mojang */}
      <Box>
        <Typography variant={"h5"} className={classes.title} gutterBottom>
          {tr("InstallCore.InstallMinecraft")}
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
      </Box>
      {/* Forge */}
      <Box>
        <Typography variant={"h5"} className={classes.title} gutterBottom>
          {tr("InstallCore.InstallForge")}
        </Typography>
        <Typography className={classes.text} color={"secondary"} gutterBottom>
          {tr("InstallCore.ForgeVersion") +
            " " +
            (detectedForgeVersion || "Unknown")}
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
      </Box>
    </Box>
  );
}

function ConfirmInstall(props: {
  version: string;
  open: boolean;
  closeFunc: () => unknown;
  className: string;
  confirmFunc: () => unknown;
}): JSX.Element {
  return (
    <Dialog open={props.open} onClose={props.closeFunc}>
      <DialogTitle>{tr("InstallCore.Confirm.Ready")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {tr("InstallCore.Confirm.Hint") + " " + props.version}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          className={props.className}
          variant={"outlined"}
          onClick={props.confirmFunc}
        >
          {tr("InstallCore.Confirm.OK")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
