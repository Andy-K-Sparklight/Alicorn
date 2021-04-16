import React from "react";
import { createStyles, makeStyles, Typography } from "@material-ui/core";
import { tr } from "./Translator";

const useStyles = makeStyles(() => {
  createStyles({
    para: {
      flexGrow: 1,
    },
  });
});

export function LaunchPad(): JSX.Element {
  console.log("Rendering LaunchPad!");
  return (
    <div>
      <Typography variant={"h6"}>
        {tr("LaunchPad.BootableCores.Title")}
      </Typography>
      <Typography>{tr("LaunchPad.BootableCores.Description")}</Typography>
    </div>
  );
}
