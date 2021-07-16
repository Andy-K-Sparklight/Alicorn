import React from "react";
import {
  Box,
  createStyles,
  Link,
  List,
  ListItem,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { randsl, tr } from "./Translator";
import { jumpTo, Pages, triggerSetPage } from "./GoTo";
import { LAST_SUCCESSFUL_GAME_KEY } from "./ReadyToLaunch";
import { History } from "@material-ui/icons";

export function Welcome(): JSX.Element {
  const classes = makeStyles((theme) =>
    createStyles({
      root: {
        marginLeft: theme.spacing(4),
      },
      firstText: {
        color: theme.palette.primary.main,
        fontSize: "large",
      },
      secondText: {
        color: theme.palette.secondary.main,
        fontSize: "small",
      },
      link: {
        color: theme.palette.primary.main,
        fontSize: "small",
      },
      thirdText: {
        color: theme.palette.primary.main,
        fontSize: "medium",
        marginTop: theme.spacing(-2),
      },
      list: {
        marginTop: theme.spacing(-2),
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
      <br />
      <Typography
        color={"secondary"}
        className={classes.thirdText}
        gutterBottom
      >
        {randsl("Welcome.Suggest.Others")}
      </Typography>
      <List className={classes.list}>
        {
          // @ts-ignore
          window.localStorage.getItem(LAST_SUCCESSFUL_GAME_KEY) ===
          undefined ? (
            ""
          ) : (
            <ListItem>
              <History color={"primary"} />
              <Link
                className={classes.link}
                onClick={() => {
                  jumpTo(
                    window.localStorage.getItem(LAST_SUCCESSFUL_GAME_KEY) ||
                      "/ReadyToLaunch/undefined/undefined"
                  );
                  triggerSetPage(Pages.ReadyToLaunch);
                }}
              >
                {tr("Welcome.Suggest.LastSuccessfulLaunch")}
              </Link>
            </ListItem>
          )
        }
      </List>
      {/*TODO*/}
    </Box>
  );
}
