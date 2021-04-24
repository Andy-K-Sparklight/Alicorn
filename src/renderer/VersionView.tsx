import { Box, createStyles, makeStyles, Typography } from "@material-ui/core";
import React from "react";
import pkg from "../../package.json";
import { tr } from "./Translator";

export function VersionView(): JSX.Element {
  const classes = makeStyles((theme) =>
    createStyles({
      root: {
        marginLeft: theme.spacing(2),
      },
      title: {
        color: theme.palette.primary.main,
      },
      text: {
        fontSize: "medium",
        color: theme.palette.secondary.main,
      },
    })
  )();
  return (
    <Box className={classes.root}>
      <Typography variant={"h5"} className={classes.title} gutterBottom>
        {tr("VersionView.Name")}
      </Typography>
      <Typography className={classes.text} gutterBottom>
        {tr("VersionView.Version") + " " + pkg.version}
      </Typography>
      <Typography className={classes.text} gutterBottom>
        {tr("VersionView.Description")}
      </Typography>
      <Typography className={classes.text} gutterBottom>
        {tr("VersionView.AuthorName") + " " + tr("VersionView.Authors")}
      </Typography>
      <br />
      <Typography className={classes.text} gutterBottom>
        {tr("VersionView.Copyright1")}
      </Typography>
      <Typography className={classes.text} gutterBottom>
        {tr("VersionView.Copyright2")}
      </Typography>
    </Box>
  );
}
