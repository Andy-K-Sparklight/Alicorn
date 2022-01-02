import {
  Archive,
  NetworkCell,
  NextWeek,
  SettingsEthernet,
  ShoppingCart,
} from "@mui/icons-material";
import { Box, Card, CardContent, Fade, Grid, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { getBoolean } from "../../modules/config/ConfigSupport";
import { jumpTo, triggerSetPage } from "../GoTo";
import { isBgDark } from "../Renderer";
import { AlicornTheme, useCardStyles, useTextStyles } from "../Stylex";
import { tr } from "../Translator";

const useAccStyles = makeStyles((theme: AlicornTheme) => ({
  acc1: {
    backgroundColor: theme.palette.primary.main,
  },
  acc2: {
    backgroundColor: theme.palette.primary.dark,
  },
  table: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
  },
  btn: {
    color: theme.palette.primary.light,
    borderColor: theme.palette.primary.light,
  },
}));

export function UtilitiesIndex(): JSX.Element {
  const classes = useTextStyles();
  const sx = { color: isBgDark() ? "secondary.light" : undefined };
  return (
    <>
      <Typography className={classes.secondText} gutterBottom>
        {tr("UtilitiesIndex.Description")}
      </Typography>
      <SimpleUtil icon={<Archive sx={sx} />} name={"PffVisual"} />
      <SimpleUtil icon={<ShoppingCart sx={sx} />} name={"CarouselBoutique"} />
      <SimpleUtil icon={<SettingsEthernet sx={sx} />} name={"CutieConnect"} />
      <SimpleUtil icon={<NetworkCell sx={sx} />} name={"NetCheck"} />
      <SimpleUtil icon={<NextWeek sx={sx} />} name={"BuildUp"} />
    </>
  );
}

function SimpleUtil(props: {
  name: string;
  experimental?: boolean;
  icon: JSX.Element;
}): JSX.Element {
  const classes = useCardStyles();
  const accClasses = useAccStyles();
  const [isHover, setHover] = useState(false);
  if (props.experimental) {
    if (!getBoolean("dev.experimental")) {
      return <></>;
    }
  }
  return (
    <Box
      onMouseEnter={() => {
        setHover(true);
      }}
      onMouseLeave={() => {
        setHover(false);
      }}
      onClick={() => {
        jumpTo(`/Utilities/${props.name}`);
        triggerSetPage(tr(`Utilities.${props.name}.Title`));
      }}
    >
      <Card
        color={"primary"}
        className={accClasses.acc1}
        raised={true}
        sx={{ backgroundColor: "primary.main" }}
      >
        <CardContent>
          <Grid container direction="row" alignItems="center">
            <Grid item>{props.icon}</Grid>
            <Grid item>
              <Typography
                variant={"h6"}
                sx={{
                  marginLeft: "0.25rem",
                  color: isBgDark() ? "secondary.light" : undefined,
                }}
              >
                {tr(`Utilities.${props.name}.Title`)}
              </Typography>
            </Grid>
          </Grid>
          <Fade in={isHover}>
            <Typography
              className={classes.text2}
              sx={{ display: isHover ? undefined : "none" }}
            >
              {tr(`Utilities.${props.name}.Description`)}
            </Typography>
          </Fade>
        </CardContent>
      </Card>
      <br />
    </Box>
  );
}
