import React from "react";
import { Box, createStyles, makeStyles, Typography } from "@material-ui/core";
import { randsl } from "./Translator";

export function Welcome(): JSX.Element {
  const classes = makeStyles((theme) =>
    createStyles({
      root: {
        marginLeft: theme.spacing(4),
      },
      firstText: {
        color: theme.palette.primary.main,
        fontSize: "medium",
      },
      secondText: {
        color: theme.palette.secondary.main,
        fontSize: "small",
      },
    })
  )();
  return (
    <Box className={classes.root}>
      <Typography color={"primary"} className={classes.firstText} gutterBottom>
        {randsl("Welcome.Suggest.Part1")}
      </Typography>
      <Typography
        color={"secondary"}
        className={classes.secondText}
        gutterBottom
      >
        {randsl("Welcome.Suggest.Part2")}
      </Typography>
      {/*TODO*/}
    </Box>
  );
}
