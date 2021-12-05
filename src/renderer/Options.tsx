import {
  Box,
  Button,
  Container,
  FormControlLabel,
  Radio,
  RadioGroup,
  Slider,
  Switch,
  Tab,
  Tabs,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { ipcRenderer, webFrame } from "electron";
import { copy } from "fs-extra";
import os from "os";
import React, { useEffect, useRef, useState } from "react";
import { DOH_CONFIGURE } from "../modules/commons/Constants";
import {
  get,
  getBoolean,
  getNumber,
  getString,
  parseNum,
  saveConfig,
  set,
} from "../modules/config/ConfigSupport";
import { getActualDataPath } from "../modules/config/DataSupport";
import { loadMirror } from "../modules/download/Mirror";
import { remoteSelectDir } from "./ContainerManager";
import {
  ALICORN_DEFAULT_THEME_DARK,
  ALICORN_DEFAULT_THEME_LIGHT,
  isBgDark,
} from "./Renderer";
import { AlicornTheme, useInputStyles } from "./Stylex";
import { AL_THEMES } from "./ThemeColors";
import { ALL_ASSISTANTS, tr } from "./Translator";

export enum ConfigType {
  BOOL,
  NUM,
  STR,
  DIR,
  RADIO,
  FILE,
  SLIDE,
}

export function OptionsPage(): JSX.Element {
  const [tabValue, setTabValue] = useState(0);
  const classes = makeStyles((theme: AlicornTheme) => ({
    head: {
      fontSize: sessionStorage.getItem("smallFontSize") || "1em",
      color: theme.palette.secondary.main,
    },
  }))();

  return (
    <Container>
      <ThemeProvider
        theme={
          isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
        }
      >
        <Typography className={classes.head}>
          {tr("Options.AutoSave")}
        </Typography>
        <Typography className={classes.head}>{tr("Options.Hint")}</Typography>
        {/* Tabs */}
        <Tabs
          variant={"fullWidth"}
          value={tabValue}
          onChange={(_e, v) => {
            setTabValue(v);
          }}
        >
          <Tab
            label={
              <Typography color={"primary"}>
                {tr("Options.Page.IAndAL")}
              </Typography>
            }
          />
          <Tab
            label={
              <Typography color={"primary"}>
                {tr("Options.Page.FeaturesConfigure")}
              </Typography>
            }
          />
          <Tab
            label={
              <Typography color={"primary"}>
                {tr("Options.Page.Features")}
              </Typography>
            }
          />
          <Tab
            label={
              <Typography color={"primary"}>
                {tr("Options.Page.Game")}
              </Typography>
            }
          />
          <Tab
            label={
              <Typography color={"primary"}>
                {tr("Options.Page.Network")}
              </Typography>
            }
          />
          <Tab
            label={
              <Typography color={"primary"}>
                {tr("Options.Page.Advanced")}
              </Typography>
            }
          />
        </Tabs>
        <TabPanel index={0} value={tabValue}>
          <InputItem type={ConfigType.STR} bindConfig={"user.name"} />
          <InputItem type={ConfigType.BOOL} bindConfig={"auto-launch"} />
          <InputItem
            type={ConfigType.SLIDE}
            bindConfig={"theme.zoom-factor"}
            sliderMax={5.0}
            sliderMin={0.1}
            sliderStep={0.1}
            onChange={() => {
              webFrame.setZoomFactor(getNumber("theme.zoom-factor"));
            }}
          />
          <InputItem
            reload
            type={ConfigType.RADIO}
            bindConfig={"theme"}
            choices={["Default"].concat(Object.keys(AL_THEMES))}
          />
          <InputItem
            type={ConfigType.RADIO}
            bindConfig={"theme.background"}
            choices={["ACG", "Bing", "Disabled"]}
          />
          <InputItem
            type={ConfigType.RADIO}
            bindConfig={"assistant"}
            reload
            choices={ALL_ASSISTANTS}
          />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"interactive.assistant?"}
            reload
          />
          <InputItem type={ConfigType.BOOL} bindConfig={"alicorn-ping"} />
          <InputItem
            type={ConfigType.FILE}
            save
            bindConfig={"theme.background.custom"}
          />
          <InputItem
            type={ConfigType.NUM}
            bindConfig={"theme.background.opacity"}
          />
          <InputItem
            reload
            type={ConfigType.STR}
            bindConfig={"theme.primary.main"}
          />
          <InputItem
            reload
            type={ConfigType.STR}
            bindConfig={"theme.primary.light"}
          />
          <InputItem
            type={ConfigType.STR}
            reload
            bindConfig={"theme.secondary.main"}
          />
          <InputItem
            type={ConfigType.STR}
            reload
            bindConfig={"theme.secondary.light"}
          />
          <InputItem type={ConfigType.BOOL} bindConfig={"goto.animate"} />
          <InputItem type={ConfigType.STR} bindConfig={"startup-page.name"} />
          <InputItem type={ConfigType.STR} bindConfig={"startup-page.url"} />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"interactive.i-have-a-crush-on-al"}
          />
        </TabPanel>
        <TabPanel index={1} value={tabValue}>
          <InputItem type={ConfigType.BOOL} bindConfig={"features.saying"} />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"features.skin-view-3d"}
          />
          <InputItem type={ConfigType.BOOL} bindConfig={"features.miniwiki"} />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"features.detect-lan"}
          />
        </TabPanel>
        <TabPanel index={2} value={tabValue}>
          {/* AL Features */}
          <InputItem type={ConfigType.BOOL} bindConfig={"readyboom"} />
          <InputItem type={ConfigType.NUM} bindConfig={"readyboom.cores"} />
          <InputItem type={ConfigType.STR} bindConfig={"hoofoff.central"} />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"system.ws-operation"}
          />
          <InputItem type={ConfigType.BOOL} bindConfig={"command"} />
          <InputItem type={ConfigType.DIR} bindConfig={"cx.shared-root"} />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"modx.global-dynamic-load-mods"}
          />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"modx.ignore-non-standard-mods"}
          />
          <InputItem type={ConfigType.BOOL} bindConfig={"launch.fast-reboot"} />
          <InputItem
            experimental
            type={ConfigType.BOOL}
            bindConfig={"cmc.disable-log4j-config"}
          />

          <InputItem
            type={ConfigType.BOOL}
            experimental
            bindConfig={"hot-key"}
          />
          <InputItem type={ConfigType.BOOL} bindConfig={"java.simple-search"} />
          <InputItem type={ConfigType.NUM} bindConfig={"java.search-depth"} />
        </TabPanel>
        <TabPanel index={3} value={tabValue}>
          <InputItem type={ConfigType.NUM} bindConfig={"memory"} />
          <InputItem
            type={ConfigType.RADIO}
            bindConfig={"gc1"}
            choices={["pure", "cms", "g1", "z"]}
          />
          <InputItem
            type={ConfigType.RADIO}
            bindConfig={"gc2"}
            choices={["pure", "cms", "g1", "z"]}
          />
          <InputItem type={ConfigType.STR} bindConfig={"gw-size"} />
        </TabPanel>
        <TabPanel index={4} value={tabValue}>
          <InputItem
            type={ConfigType.RADIO}
            choices={[
              "none",
              "alicorn",
              "alicorn-mcbbs-nonfree",
              "alicorn-bmclapi-nonfree",
            ]}
            bindConfig={"download.mirror"}
            onChange={() => {
              void loadMirror();
            }}
          />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"show-downloading-item"}
          />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"download.skip-validate"}
          />
          <InputItem
            type={ConfigType.RADIO}
            bindConfig={"download.primary-downloader"}
            choices={["Concurrent", "Serial"]}
          />
          <InputItem
            type={ConfigType.RADIO}
            bindConfig={"download.lib"}
            choices={["Undici", "Fetch"]}
          />
          <InputItem
            type={ConfigType.NUM}
            bindConfig={"download.concurrent.timeout"}
          />
          <InputItem
            type={ConfigType.NUM}
            bindConfig={"download.pff.timeout"}
          />
          <InputItem
            type={ConfigType.NUM}
            bindConfig={"download.concurrent.tries-per-chunk"}
          />
          <InputItem
            type={ConfigType.NUM}
            bindConfig={"download.concurrent.max-tasks"}
          />
          <InputItem
            type={ConfigType.NUM}
            bindConfig={"download.concurrent.chunk-size"}
          />
          <InputItem
            type={ConfigType.NUM}
            bindConfig={"download.tls.keep-alive"}
          />
          <InputItem
            type={ConfigType.NUM}
            bindConfig={"download.tls.pipeline"}
          />
          <InputItem
            type={ConfigType.NUM}
            bindConfig={"download.pff.chunk-size"}
          />
          <InputItem
            type={ConfigType.RADIO}
            bindConfig={"pff.first-source"}
            choices={["Curseforge", "Modrinth"]}
          />
          <InputItem type={ConfigType.DIR} bindConfig={"pff.cache-root"} />
          <InputItem type={ConfigType.NUM} bindConfig={"pff.page-size"} />
          <InputItem
            type={ConfigType.STR}
            bindConfig={"download.global-proxy"}
          />
          <InputItem type={ConfigType.STR} bindConfig={"web.global-proxy"} />
          <InputItem
            type={ConfigType.RADIO}
            bindConfig={"doh-server"}
            choices={Object.keys(DOH_CONFIGURE).concat(["Native"])}
          />
          <InputItem
            type={ConfigType.STR}
            bindConfig={"download.proxy-bypass"}
          />
          <InputItem
            type={ConfigType.NUM}
            bindConfig={"starlight.join-server.timeout"}
          />
        </TabPanel>
        <TabPanel index={5} value={tabValue}>
          <InputItem
            type={ConfigType.BOOL}
            notOn={"darwin"}
            bindConfig={"updator.use-update"}
          />
          <InputItem type={ConfigType.BOOL} bindConfig={"dev.experimental"} />
          <InputItem
            type={ConfigType.STR}
            experimental
            bindConfig={"updator.url"}
          />
          <InputItem
            type={ConfigType.RADIO}
            bindConfig={"frame.drag-impl"}
            choices={["Webkit", "Delta", "TitleBar"]}
          />
          <InputItem type={ConfigType.BOOL} bindConfig={"hardware-acc"} />
          <InputItem type={ConfigType.BOOL} bindConfig={"dev"} />
          <InputItem type={ConfigType.BOOL} bindConfig={"dev.f12"} />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"dev.explicit-error-throw"}
          />
          <InputItem type={ConfigType.BOOL} bindConfig={"first-run?"} />
          <InputItem type={ConfigType.BOOL} bindConfig={"reset"} />
          <InputItem type={ConfigType.BOOL} bindConfig={"clean-storage"} />
        </TabPanel>
      </ThemeProvider>
    </Container>
  );
}

export function hasEdited(conf: string): boolean {
  return localStorage.getItem("Edited." + conf) === "1";
}

export function markEdited(conf: string): void {
  localStorage.setItem("Edited." + conf, "1");
}

export function InputItem(props: {
  type: ConfigType;
  bindConfig: string;
  choices?: string[];
  onlyOn?: NodeJS.Platform;
  notOn?: NodeJS.Platform;
  onChange?: () => unknown;
  experimental?: boolean;
  reload?: boolean;
  save?: boolean; // Path selector
  sliderMax?: number;
  sliderMin?: number;
  sliderStep?: number;
}): JSX.Element {
  const originVal = useRef(get(props.bindConfig, undefined));
  const callChange = () => {
    if (
      get(props.bindConfig, undefined) !== originVal.current &&
      props.reload
    ) {
      sessionStorage.setItem("Options.Reload", "1");
    }
    if (props.onChange) {
      props.onChange();
    }
  };
  const [refreshBit, forceRefresh] = useState<boolean>(true);
  const classex = useInputStyles();
  const [cSelect, setSelect] = useState<string>(
    getString(props.bindConfig, (props.choices || [""])[0] || "")
  );
  useEffect(() => {
    saveConfig()
      .then(() => {})
      .catch(() => {});
  });
  let disabled = false;
  if (props.onlyOn) {
    if (os.platform() !== props.onlyOn) {
      disabled = true;
    }
  }
  if (props.notOn) {
    if (os.platform() === props.notOn) {
      disabled = true;
    }
  }
  const classes = makeStyles((theme: AlicornTheme) => ({
    desc: {
      // fontSize: sessionStorage.getItem("smallFontSize") || "1em",
      color: theme.palette.secondary.main,
    },
    switch: {
      color: theme.palette.primary.main,
      marginLeft: theme.spacing(0.5),
    },

    textField: {
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
    },
    title: {
      color: theme.palette.primary.main,
      fontSize: "large",
    },
  }))();
  if (props.experimental) {
    if (!getBoolean("dev.experimental")) {
      return <></>;
    }
  }
  return (
    <Container>
      <Typography
        color={"primary"}
        variant={"h6"}
        className={classes.title}
        gutterBottom
      >
        {tr(`Options.${props.bindConfig}.title`)}
      </Typography>
      <Typography color={"secondary"} className={classes.desc} gutterBottom>
        {disabled
          ? tr("Options.NotOn")
          : tr(`Options.${props.bindConfig}.desc`)}
      </Typography>
      {(() => {
        switch (props.type) {
          case ConfigType.BOOL:
            return (
              <FormControlLabel
                label={
                  <Typography color={"primary"}>
                    {getBoolean(props.bindConfig)
                      ? tr("Options.Enabled")
                      : tr("Options.Disabled")}
                  </Typography>
                }
                control={
                  <Switch
                    size={"small"}
                    disabled={disabled}
                    checked={getBoolean(props.bindConfig)}
                    className={classes.switch}
                    onChange={(e) => {
                      markEdited(props.bindConfig);
                      set(props.bindConfig, e.target.checked);
                      forceRefresh(!refreshBit);
                      callChange();
                    }}
                    name={
                      getBoolean(props.bindConfig)
                        ? tr("Options.Enabled")
                        : tr("Options.Disabled")
                    }
                  />
                }
              />
            );
          case ConfigType.NUM:
            return (
              <TextField
                disabled={disabled}
                spellCheck={false}
                fullWidth
                variant={"outlined"}
                type={"number"}
                color={"primary"}
                value={getNumber(props.bindConfig)}
                onChange={(e) => {
                  markEdited(props.bindConfig);
                  set(props.bindConfig, parseNum(e.target.value, 0));
                  forceRefresh(!refreshBit);
                  callChange();
                }}
              />
            );

          case ConfigType.DIR:
          case ConfigType.FILE:
            return (
              <>
                <TextField
                  disabled={disabled}
                  fullWidth
                  variant={"outlined"}
                  spellCheck={false}
                  color={"primary"}
                  value={getString(props.bindConfig)}
                  onChange={(e) => {
                    markEdited(props.bindConfig);
                    set(props.bindConfig, String(e.target.value || ""));
                    forceRefresh(!refreshBit);
                    callChange();
                  }}
                />
                <Button
                  className={classex.inputDark}
                  type={"button"}
                  variant={"contained"}
                  sx={{
                    marginTop: "0.25em",
                  }}
                  onClick={async () => {
                    let d =
                      props.type === ConfigType.DIR
                        ? await remoteSelectDir()
                        : await remoteSelectFile();
                    if (d.trim().length === 0) {
                      return;
                    }

                    try {
                      const target = getActualDataPath(
                        props.bindConfig.replaceAll("?", "") + ".ald"
                      );
                      await copy(d, target);
                      d = target;
                    } catch {}
                    set(props.bindConfig, d);
                    markEdited(props.bindConfig);
                    forceRefresh(!refreshBit);
                    callChange();
                  }}
                >
                  {tr("Options.Select")}
                </Button>
              </>
            );
          case ConfigType.RADIO:
            return (
              <RadioGroup
                row
                onChange={(e) => {
                  markEdited(props.bindConfig);
                  set(props.bindConfig, String(e.target.value));
                  setSelect(String(e.target.value));
                  callChange();
                }}
              >
                {(props.choices || []).map((c) => {
                  return (
                    <FormControlLabel
                      key={c}
                      value={c}
                      control={
                        <Radio disabled={disabled} checked={cSelect === c} />
                      }
                      label={
                        <Typography color={"secondary"} className={"smtxt"}>
                          {tr(`Options.${props.bindConfig}.${c}`)}
                        </Typography>
                      }
                    />
                  );
                })}
              </RadioGroup>
            );
          case ConfigType.SLIDE:
            return (
              <Slider
                size={"small"}
                min={props.sliderMin}
                max={props.sliderMax}
                defaultValue={getNumber(props.bindConfig)}
                valueLabelDisplay={"auto"}
                step={props.sliderStep}
                onChange={(_e, v) => {
                  markEdited(props.bindConfig);
                  set(props.bindConfig, v);
                  forceRefresh(!refreshBit);
                  callChange();
                }}
              />
            );
          case ConfigType.STR:
          default:
            return (
              <TextField
                disabled={disabled}
                fullWidth
                variant={"outlined"}
                spellCheck={false}
                color={"primary"}
                value={getString(props.bindConfig)}
                onChange={(e) => {
                  markEdited(props.bindConfig);
                  set(props.bindConfig, String(e.target.value || ""));
                  forceRefresh(!refreshBit);
                  callChange();
                }}
              />
            );
        }
      })()}
      <br />
      <br />
    </Container>
  );
}
export async function remoteSelectFile(): Promise<string> {
  return String((await ipcRenderer.invoke("selectFile")) || "");
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
