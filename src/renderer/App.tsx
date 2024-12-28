import React, { type FC } from "react";
import { clsx } from "clsx";
import { i18n } from "@/renderer/i18n/i18n";
import { Divider, NextUIProvider } from "@nextui-org/react";
import { Route, Switch, useLocation } from "wouter";
import { useTheme } from "@nextui-org/use-theme";
import { Header } from "@/renderer/components/Header";
import pkg from "~/package.json";
import { Sidebar } from "@/renderer/components/Sidebar";
import { About } from "@/renderer/pages/about/About";

/**
 * App entry.
 */
export const App: FC = () => {
    const { theme } = useTheme();
    const [, navigate] = useLocation();

    return <NextUIProvider navigate={navigate}>
        <main className={clsx("fixed inset-0 text-foreground bg-background", theme, i18n.getFontClass())}>
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
    return <div className="grow min-h-0 flex w-full">
        <div className="basis-1/6">
            <Sidebar/>
        </div>

        <div className="m-auto h-full py-4">
            <Divider orientation="vertical"/>
        </div>

        <div className="grow">
            <Routes/>
        </div>
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
