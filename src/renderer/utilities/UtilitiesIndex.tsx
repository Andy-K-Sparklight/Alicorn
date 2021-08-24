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

export interface UtilityMeta {
  version: string;
  name: string;
  description: string;
}
export function UtilitiesIndex(): JSX.Element {
  const classes = useTextStyles();

  return (
    <Box>
      <Typography className={classes.secondText} gutterBottom>
        {tr("UtilitiesIndex.Description")}
      </Typography>
      <SimpleUtil
        meta={{ name: "NetCheck", version: "Test", description: "test" }}
      />
    </Box>
  );
}

function SimpleUtil(props: { meta: UtilityMeta }): JSX.Element {
  const classes = useTextStylesLight();
  const accClasses = useAccStyles();
  return (
    <Card className={accClasses.acc1}>
      <CardContent>
        <Typography className={classes.firstText}>
          {tr(`Utilities.${props.meta.name}.Title`)}
        </Typography>
        <Typography className={classes.secondText}>
          {tr(`Utilities.${props.meta.name}.Description`)}
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
            jumpTo(`/Utilities/${props.meta.name}`);
            triggerSetPage(tr(`Utilities.${props.meta.name}.Title`));
          }}
        >
          {tr("UtilitiesIndex.Open")}
        </Button>
      </CardActions>
    </Card>
  );
}
