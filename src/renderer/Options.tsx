import {
  Box,
  createStyles,
  makeStyles,
  MuiThemeProvider,
  Switch,
  TextField,
  Typography,
} from "@material-ui/core";
import os from "os";
import React, { useState } from "react";
import {
  getBoolean,
  getNumber,
  getString,
  parseNum,
  set,
} from "../modules/config/ConfigSupport";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { tr } from "./Translator";

enum ConfigType {
  BOOL,
  NUM,
  STR,
}

export function OptionsPage(): JSX.Element {
  const classes = makeStyles((theme) =>
    createStyles({
      root: {
        marginLeft: theme.spacing(4),
      },
      head: {
        fontSize: "small",
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
        <InputItem
          type={ConfigType.BOOL}
          notOn={"darwin"}
          bindConfig={"updator.use-update"}
        />
        <InputItem type={ConfigType.STR} bindConfig={"user.name"} />
        <InputItem type={ConfigType.BOOL} bindConfig={"java.simple-search"} />
        <InputItem type={ConfigType.STR} bindConfig={"cx.shared-root"} />
        <InputItem
          type={ConfigType.BOOL}
          bindConfig={"modx.global-dynamic-load-mods"}
        />
        <InputItem
          type={ConfigType.BOOL}
          bindConfig={"modx.ignore-non-standard-mods"}
        />
        <InputItem type={ConfigType.STR} bindConfig={"download.mirror"} />
        <InputItem
          type={ConfigType.NUM}
          bindConfig={"download.concurrent.timeout"}
        />
        <InputItem type={ConfigType.NUM} bindConfig={"download.pff.timeout"} />
        <InputItem type={ConfigType.BOOL} bindConfig={"web.allow-natives"} />

        <InputItem type={ConfigType.BOOL} bindConfig={"download.no-validate"} />
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
          bindConfig={"download.pff.max-tasks"}
        />
        <InputItem
          type={ConfigType.NUM}
          bindConfig={"download.concurrent.chunk-size"}
        />
        <InputItem
          type={ConfigType.NUM}
          bindConfig={"download.pff.chunk-size"}
        />
        <InputItem type={ConfigType.NUM} bindConfig={"java.search-depth"} />
        <InputItem type={ConfigType.STR} bindConfig={"pff.api-base"} />
        <InputItem type={ConfigType.NUM} bindConfig={"pff.page-size"} />
        <InputItem type={ConfigType.STR} bindConfig={"pff.cache-root"} />
        <InputItem
          type={ConfigType.BOOL}
          bindConfig={"cmc.disable-log4j-config"}
        />
        <InputItem type={ConfigType.STR} bindConfig={"web.global-proxy"} />
        <InputItem type={ConfigType.STR} bindConfig={"theme.primary.main"} />
        <InputItem type={ConfigType.STR} bindConfig={"theme.primary.light"} />
        <InputItem type={ConfigType.STR} bindConfig={"theme.secondary.main"} />
        <InputItem type={ConfigType.STR} bindConfig={"theme.secondary.light"} />
        <InputItem type={ConfigType.STR} bindConfig={"startup-page.name"} />
        <InputItem type={ConfigType.STR} bindConfig={"startup-page.url"} />
        <InputItem type={ConfigType.BOOL} bindConfig={"hot-key"} />
        <InputItem
          type={ConfigType.BOOL}
          bindConfig={"interactive.i-have-a-crush-on-al"}
        />
        <InputItem type={ConfigType.BOOL} bindConfig={"dev"} />
        <InputItem type={ConfigType.BOOL} bindConfig={"dev.f12"} />
        <InputItem
          type={ConfigType.BOOL}
          bindConfig={"dev.explicit-error-throw"}
        />
        <InputItem type={ConfigType.BOOL} bindConfig={"dev.quick-reload"} />
        <InputItem
          type={ConfigType.BOOL}
          bindConfig={"launch.jim"}
          onlyOn={"win32"}
        />
        <InputItem type={ConfigType.BOOL} bindConfig={"reset"} />
      </MuiThemeProvider>
    </Box>
  );
}

function InputItem(props: {
  type: ConfigType;
  bindConfig: string;
  onlyOn?: NodeJS.Platform;
  notOn?: NodeJS.Platform;
}): JSX.Element {
  const [refreshBit, forceRefresh] = useState<boolean>(true);
  if (props.onlyOn) {
    if (os.platform() !== props.onlyOn) {
      return <></>;
    }
  }
  if (props.notOn) {
    if (os.platform() === props.notOn) {
      return <></>;
    }
  }
  const classes = makeStyles((theme) =>
    createStyles({
      desc: {
        fontSize: "small",
        color: theme.palette.secondary.main,
      },
      switch: {
        color: theme.palette.primary.main,
        marginLeft: theme.spacing(-0.5),
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
  return (
    <Box>
      <Typography color={"primary"} className={classes.title} gutterBottom>
        {tr(`Options.${props.bindConfig}.title`)}
      </Typography>
      <Typography color={"primary"} className={classes.desc} gutterBottom>
        {tr(`Options.${props.bindConfig}.desc`)}
      </Typography>
      {(() => {
        switch (props.type) {
          case ConfigType.BOOL:
            return (
              <Switch
                checked={getBoolean(props.bindConfig)}
                className={classes.switch}
                onChange={(e) => {
                  set(props.bindConfig, e.target.checked);
                  forceRefresh(!refreshBit);
                }}
                name={
                  getBoolean(props.bindConfig)
                    ? tr("Options.Enabled")
                    : tr("Options.Disabled")
                }
              />
            );
          case ConfigType.NUM:
            return (
              <TextField
                spellCheck={false}
                fullWidth
                type={"number"}
                color={"primary"}
                value={getNumber(props.bindConfig)}
                onChange={(e) => {
                  set(props.bindConfig, parseNum(e.target.value, 0));
                  forceRefresh(!refreshBit);
                }}
              />
            );
          case ConfigType.STR:
          default:
            return (
              <TextField
                fullWidth
                spellCheck={false}
                color={"primary"}
                value={getString(props.bindConfig)}
                onChange={(e) => {
                  set(props.bindConfig, String(e.target.value || ""));
                  forceRefresh(!refreshBit);
                }}
              />
            );
        }
      })()}
    </Box>
  );
}
