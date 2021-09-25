import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  createStyles,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React from "react";
import { getBoolean } from "../../modules/config/ConfigSupport";
import { jumpTo, triggerSetPage } from "../GoTo";
import { ALICORN_DEFAULT_THEME_DARK } from "../Renderer";
import { useTextStyles, useTextStylesLight } from "../Stylex";
import { tr } from "../Translator";

const useAccStyles = makeStyles((theme) =>
  createStyles({
    root: {},
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
  })
);

export function UtilitiesIndex(): JSX.Element {
  const classes = useTextStyles();
  return (
    <Box>
      <Typography className={classes.secondText} gutterBottom>
        {tr("UtilitiesIndex.Description")}
      </Typography>
      <SimpleUtil name={"PffVisual"} />
      <SimpleUtil experimental name={"CarouselBoutique"} />
      <SimpleUtil experimental name={"CutieConnect"} />
      <SimpleUtil name={"NetCheck"} />
      <SimpleUtil name={"BuildUp"} />
    </Box>
  );
}

function SimpleUtil(props: {
  name: string;
  experimental?: boolean;
}): JSX.Element {
  const classes = useTextStylesLight();
  const accClasses = useAccStyles();
  if (props.experimental) {
    if (!getBoolean("dev.experimental")) {
      return <></>;
    }
  }
  return (
    <Box>
      <Card className={accClasses.acc1}>
        <CardContent>
          <Typography className={classes.firstText}>
            {tr(`Utilities.${props.name}.Title`)}
          </Typography>
          <Typography gutterBottom className={classes.secondText}>
            {tr(`Utilities.${props.name}.Description`)}
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            style={{
              color: ALICORN_DEFAULT_THEME_DARK.palette.secondary.light,
              float: "right",
            }}
            variant={"outlined"}
            onClick={() => {
              jumpTo(`/Utilities/${props.name}`);
              triggerSetPage(tr(`Utilities.${props.name}.Title`));
            }}
          >
            {tr("UtilitiesIndex.Open")}
          </Button>
        </CardActions>
      </Card>
      <br />
    </Box>
  );
}
