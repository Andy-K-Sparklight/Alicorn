import React from "react";
import { Box, Typography } from "@material-ui/core";
import { randsl } from "./Translator";

export function Welcome(): JSX.Element {
  return (
    <Box
      style={{
        textAlign: "center",
      }}
    >
      <Typography gutterBottom>{randsl("Welcome.Suggest.Part1")}</Typography>
      <Typography gutterBottom>{randsl("Welcome.Suggest.Part2")}</Typography>
      {/*TODO*/}
    </Box>
  );
}
