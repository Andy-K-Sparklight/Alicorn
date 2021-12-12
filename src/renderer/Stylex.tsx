import { makeStyles } from "@mui/styles";
import { isBgDark } from "./Renderer";

export interface AlicornTheme {
  spacing: (s: number) => string;
  palette: {
    primary: {
      main: string;
      dark: string;
      light: string;
    };
    secondary: {
      main: string;
      dark: string;
      light: string;
    };
  };
}

export const useCardStyles = makeStyles((theme: AlicornTheme) => ({
  text: {
    fontSize: "medium",
    color: theme.palette.secondary.light,
  },
  text2: { fontSize: "medium", color: theme.palette.secondary.light },
  desc: {
    fontSize: sessionStorage.getItem("smallFontSize") || "1em",
    color: isBgDark() ? theme.palette.secondary.light : undefined,
  },
  card: {
    backgroundColor: theme.palette.primary.main,
    // width: "80%",
  },
  card2: {
    backgroundColor: theme.palette.primary.dark,
  },
  uCard: {
    backgroundColor: theme.palette.primary.light,
  },
  operateButton: {
    float: "right",
    color: isBgDark() ? theme.palette.secondary.light : undefined,
  },
  color: {
    color: isBgDark() ? theme.palette.secondary.light : undefined,
  },
}));
export const usePadStyles = makeStyles((theme: AlicornTheme) => ({
  para: {
    flexGrow: 1,
    color: theme.palette.primary.main,
  },
  smallText: {
    fontSize: sessionStorage.getItem("smallFontSize") || "1em",
  },
}));
export const useInputStyles = makeStyles((theme: AlicornTheme) => ({
  input: {
    color: theme.palette.secondary.light,
  },
  inputDark: {
    // color: theme.palette.primary.main,
  },
  border: {
    color: theme.palette.secondary.light,
  },
}));
export const useFormStyles = makeStyles((theme: AlicornTheme) => ({
  root: {},
  formControl: {
    margin: theme.spacing(1),
  },
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
    //  borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    width: theme.spacing(25),
  },
  selectorLight: {
    borderColor: theme.palette.primary.light,
    color: theme.palette.primary.light,
  },
  label: {},
  labelLight: {
    marginLeft: theme.spacing(0.25),
    color: theme.palette.primary.light,
  },
  btn: {
    marginTop: theme.spacing(1),
  },
  instr: {
    fontSize: sessionStorage.getItem("smallFontSize") || "1em",
    color: theme.palette.secondary.main,
  },
}));
export const fullWidth = makeStyles((theme: AlicornTheme) => ({
  form: {
    // width: theme.spacing(80),
    // width: "100%",
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
}));

export const useTextStyles = makeStyles((theme: AlicornTheme) => ({
  root: {},
  firstText: {
    color: theme.palette.primary.main,
    fontSize: "large",
  },
  secondText: {
    color: theme.palette.secondary.main,
    fontSize: sessionStorage.getItem("smallFontSize") || "1em",
  },
  mediumText: {
    color: theme.palette.secondary.main,
    fontSize: "medium",
  },
  link: {
    color: theme.palette.primary.main,
    fontSize: sessionStorage.getItem("smallFontSize") || "1em",
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
}));

export const useTextStylesLight = makeStyles((theme: AlicornTheme) => ({
  root: {},
  firstText: {
    color: theme.palette.secondary.light,
    fontSize: "large",
  },
  secondText: {
    color: theme.palette.secondary.light,
    fontSize: sessionStorage.getItem("smallFontSize") || "1em",
  },
  mediumText: {
    color: theme.palette.secondary.light,
    fontSize: "medium",
  },
  link: {
    color: theme.palette.primary.light,
    fontSize: sessionStorage.getItem("smallFontSize") || "1em",
  },
  thirdText: {
    color: theme.palette.primary.light,
    fontSize: "medium",
  },
}));
