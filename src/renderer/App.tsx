import { i18n } from "@/renderer/i18n/i18n";
import { useTheme } from "@/renderer/theme";
import { Navigator } from "@components/Navigator";
import { HeroUIProvider } from "@heroui/react";
import { AboutView } from "@pages/about/AboutView";
import { GamesView } from "@pages/games/GamesView";
import { SettingsView } from "@pages/settings/SettingsView";
import React, { type FC } from "react";
import { Route, Switch, useLocation } from "wouter";
import pkg from "~/package.json";

/**
 * App entry.
 */
export const App: FC = () => {
    const [, navigate] = useLocation();
    useTheme();

    i18n.useAutoFontClass();

    return <HeroUIProvider navigate={navigate}>
        <main className="fixed inset-0 text-foreground bg-background">
            <div className="flex flex-col w-full h-full">
                <Navigator/>
                <MainArea/>
            </div>
            <VersionOverlay/>
        </main>
    </HeroUIProvider>;
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
        <Route path="/About" component={AboutView}/>
        <Route path="/Settings" component={SettingsView}/>
        <Route path="/Games" component={GamesView}/>
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
