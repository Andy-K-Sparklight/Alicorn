import { useAutoFontClass } from "@/renderer/i18n/i18n";
import { themeManager, useTheme } from "@/renderer/theme";
import { Navigator } from "@components/Navigator";
import { HeroUIProvider } from "@heroui/react";
import { AboutView } from "@pages/about/AboutView";
import { GamesView } from "@pages/games/GamesView";
import { MonitorView } from "@pages/monitor/MonitorView";
import { pages } from "@pages/pages";
import { SettingsView } from "@pages/settings/SettingsView";
import React from "react";
import { ToastContainer } from "react-toastify";
import { Redirect, Route, Switch, useLocation } from "wouter";
import pkg from "~/package.json";

/**
 * App entry.
 */
export function App() {
    const [, nav] = useLocation();

    const { theme } = useTheme();
    useAutoFontClass();

    // Toasts use the opposite theme
    const toastTheme = themeManager.isDark(theme) ? "light" : "dark";

    return <HeroUIProvider navigate={nav}>
        <main className="fixed inset-0 text-foreground bg-background">
            <div className="flex flex-col w-full h-full">
                <Navigator/>
                <MainArea/>
            </div>
            <VersionOverlay/>
            <ToastContainer
                theme={toastTheme}
                position="bottom-left"
                newestOnTop
            />
        </main>
    </HeroUIProvider>;
}


/**
 * Main app content area.
 */
function MainArea() {
    return <div className="grow min-h-0 w-11/12 mb-8 mt-4 mx-auto">
        <Routes/>
    </div>;
}

function DefaultPageRedirect() {
    // TODO load default page from user config
    return <Redirect to={"/" + pages[0].id}/>;
}


/**
 * App routes.
 */
function Routes() {
    return <Switch>
        <Route path="/about" component={AboutView}/>
        <Route path="/settings" component={SettingsView}/>
        <Route path="/games" component={GamesView}/>
        <Route path="/monitor/:procId" component={MonitorView}/>
        <Route path="/" component={DefaultPageRedirect}/>
    </Switch>;
}

/**
 * Version overlay at the right bottom.
 */
function VersionOverlay() {
    if (!import.meta.env.AL_DEV) return "";

    const { version, codename } = pkg;

    return <div className="fixed right-2 bottom-2 text-sm text-foreground-400">
        Alicorn Launcher "{codename}" {version}
    </div>;
}
