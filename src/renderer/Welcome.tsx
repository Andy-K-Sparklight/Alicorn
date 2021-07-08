import React from "react";
import { Box, Typography } from "@material-ui/core";
import { randsl } from "./Translator";
import { useFormStyles } from "./Stylex";

export function Welcome(): JSX.Element {
  const classes = useFormStyles();
  return (
    <Box className={classes.root}>
      <Typography gutterBottom>{randsl("Welcome.Suggest.Part1")}</Typography>
      <Typography gutterBottom>{randsl("Welcome.Suggest.Part2")}</Typography>
      {/*TODO*/}
    </Box>
  );
}
