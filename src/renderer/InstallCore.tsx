import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
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

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      marginLeft: theme.spacing(4),
      textAlign: "center",
    },
    input: {
      color: theme.palette.secondary.light,
    },
    title: {
      color: theme.palette.primary.main,
    },
    text: {
      fontSize: "medium",
    },
    selector: {
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
      width: theme.spacing(30),
      marginLeft: theme.spacing(2),
    },
    label: {
      color: theme.palette.primary.main,
    },
  })
);

export function InstallCore(): JSX.Element {
  const classes = useStyles();
  const [foundCores, setCores] = useState<string[]>([]);
  const isLoaded = useRef<boolean>(false);
  const mounted = useRef<boolean>();
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [filter, setFilter] = useState<ReleaseType>(ReleaseType.RELEASE);
  const [selectedContainer, setContainer] = useState<string>("");
  const [mojangOpen, setMojangOpen] = useState<boolean>(false);
  const [operating, setOperating] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  useEffect(() => {
    (async () => {
      if (!isLoaded.current) {
        const r = await getAllMojangCores(filter);
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
  return (
    <Box className={classes.root}>
      <FailedHint
        open={failed}
        closeFunc={() => {
          setFailed(false);
        }}
      />
      <OperatingHint open={operating} />
      <ConfirmInstallMojang
        version={selectedVersion}
        className={classes.input}
        open={mojangOpen}
        closeFunc={() => {
          setMojangOpen(false);
        }}
        confirmFunc={async () => {
          setMojangOpen(false);
          setOperating(true);
          const u = await getProfileURLById(selectedVersion);
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
              selectedVersion,
              d,
              getContainer(selectedContainer)
            );
            if (mounted.current) {
              setOperating(false);
            }
          } catch {
            if (mounted.current) {
              setOperating(false);
              setFailed(true);
            }
          }
        }}
      />
      <Box>
        <Typography variant={"h5"} className={classes.title} gutterBottom>
          {tr("InstallCore.InstallMinecraft")}
        </Typography>
        <FormControl>
          <InputLabel
            id={"CoreInstall-Mojang-SelectArch"}
            className={classes.label}
          >
            {tr("InstallCore.MinecraftArch")}
          </InputLabel>
          <Select
            variant={"outlined"}
            labelId={"CoreInstall-Mojang-SelectArch"}
            color={"primary"}
            className={classes.selector}
            onChange={(e) => {
              isLoaded.current = false;
              setSelectedVersion("");
              setFilter(e.target.value as ReleaseType);
            }}
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
        <FormControl>
          <InputLabel
            id={"CoreInstall-Mojang-SelectVersion"}
            className={classes.label}
          >
            {tr("InstallCore.MinecraftVersion")}
          </InputLabel>
          <Select
            variant={"outlined"}
            labelId={"CoreInstall-Mojang-SelectVersion"}
            color={"primary"}
            className={classes.selector}
            onChange={(e) => {
              setSelectedVersion(String(e.target.value || ""));
            }}
            value={selectedVersion || ""}
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
        <FormControl>
          <InputLabel
            id={"CoreInstall-Mojang-TargetContainer"}
            className={classes.label}
          >
            {tr("InstallCore.TargetContainer")}
          </InputLabel>
          <Select
            labelId={"CoreInstall-Mojang-TargetContainer"}
            color={"primary"}
            variant={"outlined"}
            className={classes.selector}
            onChange={(e) => {
              setContainer(String(e.target.value || ""));
            }}
            value={selectedContainer || ""}
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
        <br />
        <br />
        <Button
          variant={"outlined"}
          color={"primary"}
          disabled={isNull(selectedVersion) || isNull(selectedContainer)}
          onClick={() => {
            setMojangOpen(true);
          }}
        >
          {tr("InstallCore.Start")}
        </Button>
      </Box>
    </Box>
  );
}

function ConfirmInstallMojang(props: {
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
