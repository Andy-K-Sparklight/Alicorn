import { createStyles, makeStyles } from "@material-ui/core";

export const useCardStyles = makeStyles((theme) =>
  createStyles({
    text: {
      fontSize: "medium",
    },
    desc: {
      fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
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
      marginLeft: "10%",
    },
    smallText: {
      marginLeft: "-10%",
      fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
    },
  })
);
export const useInputStyles = makeStyles((theme) =>
  createStyles({
    input: {
      color: theme.palette.secondary.light,
    },
    inputDark: {
      color: theme.palette.primary.main,
    },
    border: {
      color: theme.palette.secondary.light,
    },
  })
);
export const useFormStyles = makeStyles((theme) =>
  createStyles({
    root: {},
    formControl: {},
    input: {
      color: theme.palette.secondary.light,
    },
    title: {
      color: theme.palette.primary.main,
      fontSize: "larger",
    },
    text: {
      marginLeft: theme.spacing(0.5),
      fontSize: "medium",
    },
    selector: {
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
      width: theme.spacing(25),
    },
    selectorLight: {
      borderColor: theme.palette.primary.light,
      color: theme.palette.primary.light,
    },
    label: {
      marginLeft: theme.spacing(0.5),
      color: theme.palette.primary.main,
    },
    labelLight: {
      marginLeft: theme.spacing(0.5),
      color: theme.palette.primary.light,
    },
    btn: {
      marginLeft: theme.spacing(1),
      marginTop: theme.spacing(1),
    },
    instr: {
      fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
      color: theme.palette.secondary.main,
    },
  })
);
export const fullWidth = makeStyles((theme) =>
  createStyles({
    form: {
      width: theme.spacing(80),
    },
    largerForm: {
      width: theme.spacing(90),
    },
    right: {
      float: "right",
      marginRight: theme.spacing(4),
    },
    label: {
      width: theme.spacing(30),
      paddingLeft: theme.spacing(-10),
      flexGrow: 1,
    },
    progress: {
      marginLeft: theme.spacing(9.8),
    },
    root: {
      textAlign: "center",
    },
    text: {
      fontSize: "large",
      marginTop: theme.spacing(1),
      marginLeft: theme.spacing(4),
    },
  })
);

export const useTextStyles = makeStyles((theme) =>
  createStyles({
    root: {},
    firstText: {
      color: theme.palette.primary.main,
      fontSize: "large",
    },
    secondText: {
      color: theme.palette.secondary.main,
      fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
    },
    mediumText: {
      color: theme.palette.secondary.main,
      fontSize: "medium",
    },
    link: {
      color: theme.palette.primary.main,
      fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
    },
    thirdTextRaw: {
      color: theme.palette.primary.main,
      fontSize: "medium",
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
);

export const useTextStylesLight = makeStyles((theme) =>
  createStyles({
    root: {},
    firstText: {
      color: theme.palette.secondary.light,
      fontSize: "large",
    },
    secondText: {
      color: theme.palette.secondary.light,
      fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
    },
    mediumText: {
      color: theme.palette.secondary.light,
      fontSize: "medium",
    },
    link: {
      color: theme.palette.primary.light,
      fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
    },
    thirdText: {
      color: theme.palette.primary.light,
      fontSize: "medium",
    },
  })
);
