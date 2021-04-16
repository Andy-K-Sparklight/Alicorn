import React from "react";
import { Box, createStyles, makeStyles, Typography } from "@material-ui/core";
import { tr } from "./Translator";

const useStyles = makeStyles((theme) =>
  createStyles({
    para: {
      flexGrow: 1,
      marginLeft: theme.spacing(2),
    },
  })
);

export function LaunchPad(): JSX.Element {
  const classes = useStyles();
  return (
    <Box className={classes.para}>
      <Typography variant={"h6"}>
        {tr("LaunchPad.BootableCores.Title")}
      </Typography>
      <Typography>{tr("LaunchPad.BootableCores.Description")}</Typography>
    </Box>
  );
}
