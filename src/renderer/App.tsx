import { i18n } from "@/renderer/i18n/i18n";
import { themeManager, useTheme } from "@/renderer/theme";
import { Header } from "@components/Header";
import { HeroUIProvider } from "@heroui/react";
import { About } from "@pages/about/About";
import { Settings } from "@pages/settings/Settings";
import React, { type FC, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import pkg from "~/package.json";

/**
 * App entry.
 */
export const App: FC = () => {
    const [, navigate] = useLocation();
    const { theme } = useTheme();

    useEffect(() => {
        if (themeManager.isDark(theme)) {
            console.log(`Is dark: ${theme}`);
            document.documentElement.classList.add("dark");
        } else {
            console.log(`Is not dark: ${theme}`);
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    i18n.useAutoFontClass();

    return <HeroUIProvider navigate={navigate}>
        <main className="fixed inset-0 text-foreground bg-background">
            <div className="flex flex-col w-full h-full">
                <Header/>
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
        <Route path="/About" component={About}/>
        <Route path="/Settings" component={Settings}/>
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
