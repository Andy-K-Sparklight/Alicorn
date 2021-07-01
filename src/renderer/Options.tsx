import React, { useState } from "react";
import {
  Box,
  createStyles,
  makeStyles,
  MuiThemeProvider,
  Switch,
  TextField,
  Typography,
} from "@material-ui/core";
import {
  getBoolean,
  getNumber,
  getString,
  parseNum,
  set,
} from "../modules/config/ConfigSupport";
import { tr } from "./Translator";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import os from "os";

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
      text: {
        fontSize: "small",
        color: theme.palette.secondary.main,
      },
    })
  )();

  return (
    <Box className={classes.root}>
      <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
        <Typography className={classes.text}>
          {tr("Options.AutoSave")}
        </Typography>
        <InputItem type={ConfigType.BOOL} bindConfig={"updator.use-update"} />
        <InputItem type={ConfigType.BOOL} bindConfig={"updator.dev"} />
        <InputItem type={ConfigType.STR} bindConfig={"user.name"} />
        <InputItem type={ConfigType.BOOL} bindConfig={"java.simple-search"} />
        <InputItem
          type={ConfigType.BOOL}
          bindConfig={"modx.global-dynamic-load-mods"}
        />
        <InputItem
          type={ConfigType.BOOL}
          bindConfig={"modx.ignore-non-standard-mods"}
        />
        <InputItem
          type={ConfigType.NUM}
          bindConfig={"download.concurrent.timeout"}
        />
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
          bindConfig={"download.concurrent.chunk-size"}
        />
        <InputItem type={ConfigType.NUM} bindConfig={"java.search-depth"} />
        <InputItem type={ConfigType.STR} bindConfig={"pff.api-base"} />
        <InputItem type={ConfigType.NUM} bindConfig={"pff.page-size"} />
        <InputItem type={ConfigType.STR} bindConfig={"pff.cache-root"} />
        <InputItem type={ConfigType.BOOL} bindConfig={"music.enabled"} />
        <InputItem
          type={ConfigType.BOOL}
          bindConfig={"cmc.disable-log4j-config"}
        />
        <InputItem type={ConfigType.STR} bindConfig={"web.global-proxy"} />
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
}): JSX.Element {
  const [refreshBit, forceRefresh] = useState<boolean>(true);
  if (props.onlyOn) {
    if (os.platform() !== props.onlyOn) {
      return <></>;
    }
  }
  const classes = makeStyles((theme) =>
    createStyles({
      desc: {
        fontSize: "medium",
        color: theme.palette.secondary.main,
      },
      switch: {
        color: theme.palette.primary.main,
      },
      textField: {
        borderColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
      },
      text: {
        color: theme.palette.primary.main,
      },
    })
  )();
  return (
    <Box>
      <Typography
        color={"primary"}
        variant={"h6"}
        className={classes.text}
        gutterBottom
      >
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
