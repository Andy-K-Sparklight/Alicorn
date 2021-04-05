import React, { useState } from "react";
import {
  AppBar,
  createStyles,
  makeStyles,
  Theme,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { tr } from "./Translator";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  })
);

export function App(): JSX.Element {
  const classes = useStyles();
  const [page, setPage] = useState(Pages.Today);
  return (
    <div className={classes.root}>
      <AppBar position={"static"}>
        <Toolbar>
          <Typography variant={"h6"} className={classes.title}>
            {tr(page)}
          </Typography>
        </Toolbar>
      </AppBar>
    </div>
  );
}

enum Pages {
  Settings = "Settings",
  Today = "Today",
  Containers = "Containers",
  LaunchPad = "LaunchPad",
  CrashAnalyze = "CrashAnalyze",
  CoreDetail = "CoreDetail",
  ModDetail = "ModDetail",
  Installer = "Installer",
  Accounts = "Accounts",
  AccountDetail = "AccountDetail",
  InstallConfiguration = "InstallConfiguration",
}
