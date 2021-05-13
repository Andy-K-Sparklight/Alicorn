import React, { useState } from "react";
import {
  Box,
  createMuiTheme,
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

// UNCHECKED

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
    })
  )();

  return (
    <Box className={classes.root}>
      <MuiThemeProvider
        theme={createMuiTheme({
          palette: {
            type: "light",
          },
        })}
      >
        <InputItem type={ConfigType.BOOL} bindConfig={"updator.use-update"} />
        <InputItem type={ConfigType.BOOL} bindConfig={"updator.dev"} />
        <InputItem
          type={ConfigType.NUM}
          bindConfig={"download.concurrent.chunk-size"}
        />
        <InputItem
          type={ConfigType.NUM}
          bindConfig={"download.concurrent.timeout"}
        />
        <InputItem
          type={ConfigType.NUM}
          bindConfig={"download.concurrent.tries-per-chunk"}
        />{" "}
        <InputItem
          type={ConfigType.NUM}
          bindConfig={"download.concurrent.max-tasks"}
        />
      </MuiThemeProvider>
    </Box>
  );
}

function InputItem(props: {
  type: ConfigType;
  bindConfig: string;
}): JSX.Element {
  const [refreshBit, forceRefresh] = useState<boolean>(true);

  const classes = makeStyles(() =>
    createStyles({
      desc: {
        fontSize: "medium",
        color: "#df307f",
      },
      switch: {
        color: "#5d2391",
      },
      textField: {
        borderColor: "#5d2391",
        color: "#5d2391",
      },
      text: {
        color: "#5d2391",
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
