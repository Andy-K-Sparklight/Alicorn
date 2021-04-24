import { createStyles, makeStyles } from "@material-ui/core";

export const useCardStyles = makeStyles((theme) =>
  createStyles({
    text: {
      fontSize: "medium",
    },
    desc: {
      fontSize: "small",
    },
    card: {
      backgroundColor: theme.palette.primary.main,
      width: "80%",
    },
    uCard: {
      backgroundColor: theme.palette.primary.light,
      width: "80%",
    },
    operateButton: {
      float: "right",
    },
  })
);
makeStyles((theme) =>
  createStyles({
    window: {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.secondary.main,
    },
  })
);
