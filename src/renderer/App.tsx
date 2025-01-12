import { i18n } from "@/renderer/i18n/i18n";
import { Header } from "@components/Header";
import { NextUIProvider } from "@nextui-org/react";
import { About } from "@pages/about/About";
import { clsx } from "clsx";
import React, { type FC, useEffect, useRef } from "react";
import { Route, Switch, useLocation } from "wouter";
import pkg from "~/package.json";

/**
 * App entry.
 */
export const App: FC = () => {
    const [, navigate] = useLocation();

    const fontClass = i18n.useFontClass();
    const prevFontClass = useRef<string>("");

    useEffect(() => {
        if (prevFontClass.current) {
            document.body.classList.remove(prevFontClass.current);
        }

        prevFontClass.current = fontClass;
        document.body.classList.add(fontClass);
    }, [fontClass]);

    return <NextUIProvider navigate={navigate}>
        <main className={clsx("fixed inset-0 text-foreground bg-background", fontClass)}>
            <div className="flex flex-col w-full h-full">
                <Header/>
                <MainArea/>
            </div>
            <VersionOverlay/>
        </main>
    </NextUIProvider>;
};

/**
 * Main app content area.
 */
const MainArea = () => {
    return <div className="grow min-h-0 w-full pb-8 pt-4">
        <Routes/>
    </div>;
};

/**
 * App routes.
 */
const Routes = () => {
    return <Switch>
        <Route path="/About" component={About}/>
    </Switch>;
};

/**
 * Version overlay at the right bottom.
 */
const VersionOverlay = () => {
    if (!import.meta.env.AL_DEV) return "";

    const { version, codename } = pkg;

    return <div className="fixed right-2 bottom-2 text-sm text-foreground-400">
        Alicorn Launcher "{codename}" {version}
    </div>;
};
