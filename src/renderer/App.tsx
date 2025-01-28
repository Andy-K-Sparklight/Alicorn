import { i18n } from "@/renderer/i18n/i18n";
import { useTheme } from "@/renderer/theme";
import { Navigator } from "@components/Navigator";
import { HeroUIProvider } from "@heroui/react";
import { AboutView } from "@pages/about/AboutView";
import { GamesView } from "@pages/games/GamesView";
import { MonitorView } from "@pages/monitor/MonitorView";
import { pages } from "@pages/pages";
import { SettingsView } from "@pages/settings/SettingsView";
import React from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import pkg from "~/package.json";

/**
 * App entry.
 */
export function App() {
    const [, nav] = useLocation();
    useTheme();

    i18n.useAutoFontClass();

    return <HeroUIProvider navigate={nav}>
        <main className="fixed inset-0 text-foreground bg-background">
            <div className="flex flex-col w-full h-full">
                <Navigator/>
                <MainArea/>
            </div>
            <VersionOverlay/>
        </main>
    </HeroUIProvider>;
}

/**
 * Main app content area.
 */
const MainArea = () => {
    return <div className="grow min-h-0 w-11/12 pb-8 pt-4 mx-auto">
        <Routes/>
    </div>;
};

function DefaultPageRedirect() {
    // TODO load default page from user config
    return <Redirect to={pages[0].href}/>;
}

/**
 * App routes.
 */
const Routes = () => {
    return <Switch>
        <Route path="/About" component={AboutView}/>
        <Route path="/Settings" component={SettingsView}/>
        <Route path="/Games" component={GamesView}/>
        <Route path="/Monitor/:procId" component={MonitorView}/>
        <Route path="/" component={DefaultPageRedirect}/>
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
