import {
  Box,
  Button,
  createStyles,
  FormControlLabel,
  makeStyles,
  MuiThemeProvider,
  Radio,
  RadioGroup,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@material-ui/core";
import os from "os";
import React, { useEffect, useState } from "react";
import { DOH_CONFIGURE } from "../modules/commons/Constants";
import {
  getBoolean,
  getNumber,
  getString,
  parseNum,
  saveConfig,
  set,
} from "../modules/config/ConfigSupport";
import { loadMirror } from "../modules/download/Mirror";
import { remoteSelectDir } from "./ContainerManager";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { useInputStyles } from "./Stylex";
import { ALL_ASSISTANTS, tr } from "./Translator";

export enum ConfigType {
  BOOL,
  NUM,
  STR,
  DIR,
  RADIO,
}

export function OptionsPage(): JSX.Element {
  const [tabValue, setTabValue] = useState(0);
  const classes = makeStyles((theme) =>
    createStyles({
      root: {},
      head: {
        fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
        color: theme.palette.secondary.main,
      },
    })
  )();

  return (
    <Box className={classes.root}>
      <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
        <Typography className={classes.head}>
          {tr("Options.AutoSave")}
        </Typography>
        <Typography className={classes.head}>{tr("Options.Hint")}</Typography>
        {/* Tabs */}
        <Tabs
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
          <InputItem
            type={ConfigType.RADIO}
            bindConfig={"assistant"}
            choices={ALL_ASSISTANTS}
          />
          <InputItem type={ConfigType.STR} bindConfig={"theme.primary.main"} />
          <InputItem type={ConfigType.STR} bindConfig={"theme.primary.light"} />
          <InputItem
            type={ConfigType.STR}
            bindConfig={"theme.secondary.main"}
          />
          <InputItem
            type={ConfigType.STR}
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
          <InputItem type={ConfigType.BOOL} bindConfig={"features.miniwiki"} />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"features.detect-lan"}
          />
        </TabPanel>
        <TabPanel index={2} value={tabValue}>
          {/* AL Features */}
          <InputItem
            type={ConfigType.STR}
            experimental
            bindConfig={"hoofoff.central"}
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
            type={ConfigType.BOOL}
            bindConfig={"action.close-on-exit"}
          />
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
            experimental
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
          <InputItem type={ConfigType.BOOL} bindConfig={"hardware-acc"} />
          <InputItem type={ConfigType.BOOL} bindConfig={"dev"} />
          <InputItem type={ConfigType.BOOL} bindConfig={"dev.f12"} />
          <InputItem
            type={ConfigType.BOOL}
            bindConfig={"dev.explicit-error-throw"}
          />
          <InputItem type={ConfigType.BOOL} bindConfig={"reset"} />
          <InputItem type={ConfigType.BOOL} bindConfig={"clean-storage"} />
        </TabPanel>
      </MuiThemeProvider>
    </Box>
  );
}

export function hasEdited(conf: string): boolean {
  return window.localStorage.getItem("Edited." + conf) === "1";
}

export function markEdited(conf: string): void {
  window.localStorage.setItem("Edited." + conf, "1");
}

export function InputItem(props: {
  type: ConfigType;
  bindConfig: string;
  choices?: string[];
  onlyOn?: NodeJS.Platform;
  notOn?: NodeJS.Platform;
  onChange?: () => unknown;
  experimental?: boolean;
}): JSX.Element {
  const callChange = props.onChange ? props.onChange : () => {};
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
  const classes = makeStyles((theme) =>
    createStyles({
      desc: {
        fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
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
        marginTop: theme.spacing(1),
        color: theme.palette.primary.main,
        fontSize: "large",
      },
    })
  )();
  if (props.experimental) {
    if (!getBoolean("dev.experimental")) {
      return <></>;
    }
  }
  return (
    <Box>
      <Typography color={"primary"} className={classes.title} gutterBottom>
        {tr(`Options.${props.bindConfig}.title`)}
      </Typography>
      <Typography color={"primary"} className={classes.desc} gutterBottom>
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
            return (
              <Box>
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
                  variant={"outlined"}
                  style={{
                    marginTop: "4px",
                  }}
                  onClick={async () => {
                    const d = await remoteSelectDir();
                    if (d.trim().length === 0) {
                      return;
                    }
                    set(props.bindConfig, d);
                    markEdited(props.bindConfig);
                    forceRefresh(!refreshBit);
                    callChange();
                  }}
                >
                  {tr("Options.Select")}
                </Button>
              </Box>
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
                        <Typography
                          style={{
                            fontSize:
                              window.sessionStorage.getItem("smallFontSize") ||
                              "16px",
                            color:
                              ALICORN_DEFAULT_THEME_LIGHT.palette.secondary
                                .main,
                          }}
                        >
                          {tr(`Options.${props.bindConfig}.${c}`)}
                        </Typography>
                      }
                    />
                  );
                })}
              </RadioGroup>
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
    </Box>
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
