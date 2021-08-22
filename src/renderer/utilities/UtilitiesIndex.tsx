import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@material-ui/core";
import React from "react";
import { jumpTo, triggerSetPage } from "../GoTo";
import { useTextStyles, useTextStylesLight } from "../Stylex";
import { tr } from "../Translator";

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
    </Box>
  );
}

function SimpleUtil(props: { meta: UtilityMeta }): JSX.Element {
  const classes = useTextStylesLight();
  return (
    <Card>
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
          variant={"contained"}
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
