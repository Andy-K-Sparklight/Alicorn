import React, { useState } from "react";
import {
  Box,
  createStyles,
  makeStyles,
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
      <InputItem type={ConfigType.BOOL} bindConfig={"updator.use-update"} />
      <InputItem type={ConfigType.BOOL} bindConfig={"updator.dev"} />
    </Box>
  );
}

function InputItem(props: {
  type: ConfigType;
  bindConfig: string;
}): JSX.Element {
  const [refreshBit, forceRefresh] = useState<boolean>(true);
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
    })
  )();
  return (
    <Box>
      <Typography color={"primary"} variant={"h6"} gutterBottom>
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
