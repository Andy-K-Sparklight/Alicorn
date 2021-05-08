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
export const usePadStyles = makeStyles((theme) =>
  createStyles({
    para: {
      flexGrow: 1,
      marginTop: theme.spacing(4),
      color: theme.palette.primary.main,
      marginLeft: "16%",
    },
  })
);
export const useInputStyles = makeStyles((theme) =>
  createStyles({
    input: {
      color: theme.palette.secondary.light,
    },
    border: {
      color: theme.palette.secondary.light,
    },
  })
);
export const useFormStyles = makeStyles((theme) =>
  createStyles({
    root: {
      marginLeft: theme.spacing(4),
    },
    formControl: {},
    input: {
      color: theme.palette.secondary.light,
    },
    title: {
      color: theme.palette.primary.main,
    },
    text: {
      fontSize: "medium",
    },
    selector: {
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
      width: theme.spacing(25),
    },
    label: {
      marginLeft: theme.spacing(0.5),
      color: theme.palette.primary.main,
    },
    btn: {
      marginLeft: theme.spacing(1),
      marginTop: theme.spacing(1),
    },
  })
);
