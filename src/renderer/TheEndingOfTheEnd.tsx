import { Typography } from "@mui/material";
import React from "react";
import pkg from "../../package.json";
import { useTextStyles } from "./Stylex";
import { tr } from "./Translator";

export function TheEndingOfTheEnd(): JSX.Element {
    const classes = useTextStyles();
    return (
        <>
            <Typography className={classes.firstText} color={"primary"}>
                {tr("EOE.Thanks")}
            </Typography>
            <Typography className={classes.secondText} gutterBottom>
                {tr("EOE.ThanksDesc")}
            </Typography>
            <Typography className={classes.thirdTextRaw} color={"primary"}>
                {tr("EOE.Packages")}
            </Typography>
            <Typography className={classes.secondText} gutterBottom>
                {Object.keys(pkg.dependencies)
                    .concat(Object.keys(pkg.devDependencies))
                    .join(" ")}
            </Typography>
            <Typography className={classes.thirdTextRaw} color={"primary"}>
                {tr("EOE.And")}
            </Typography>
            <Typography className={classes.secondText} gutterBottom>
                {tr("EOE.Orgs")}
            </Typography>
            <br/>
            <Typography className={classes.firstText} color={"primary"}>
                {tr("EOE.StoryTitle")}
            </Typography>
            <Typography className={classes.secondText} gutterBottom>
                {tr("EOE.Story")}
            </Typography>
            <br/>
            <Typography className={classes.firstText} color={"primary"}>
                {tr("EOE.EndPoem")}
            </Typography>
            <Typography className={classes.secondText} gutterBottom>
                {tr("EOE.EndPoemContent")}
            </Typography>
        </>
    );
}
