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
        fontSize: "larger",
        color: theme.palette.primary.main,
      },
      text: {
        fontSize: "small",
      },
    })
  )();
  return (
    <Box className={classes.root}>
      <Typography className={classes.title} gutterBottom>
        {tr("VersionView.Name") + " " + pkg.appVersion}
      </Typography>
      <Typography className={classes.text} color={"secondary"} gutterBottom>
        {tr("VersionView.Description")}
      </Typography>
      <Typography className={classes.text} color={"secondary"} gutterBottom>
        {tr("VersionView.AuthorName") + " " + tr("VersionView.Authors")}
      </Typography>
      <br />
      <Typography className={classes.text} color={"secondary"} gutterBottom>
        {tr("VersionView.FreeSoftwareClaim")}
      </Typography>
      <Typography className={classes.text} color={"secondary"} gutterBottom>
        {tr("VersionView.Copyright1")}
      </Typography>
      <Typography className={classes.text} color={"secondary"} gutterBottom>
        {tr("VersionView.Copyright2")}
      </Typography>

      <Typography
        className={classes.text}
        color={"primary"}
        style={{
          float: "right",
          marginRight: "2%",
        }}
      >
        {tr("VersionView.SuperCowPower")}
      </Typography>
    </Box>
  );
}
