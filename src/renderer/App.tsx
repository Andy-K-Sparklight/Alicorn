import { useAutoFontClass } from "@/renderer/i18n/i18n";
import { themeManager, useAutoTheme, useTheme } from "@/renderer/theme";
import { useNav } from "@/renderer/util/nav";
import { ConfigProvider } from "@components/ConfigProvider";
import { Navigator } from "@components/Navigator";
import { HeroUIProvider } from "@heroui/react";
import { AboutView } from "@pages/about/AboutView";
import { CreateGameView } from "@pages/create-game/CreateGameView";
import { GameDetailView } from "@pages/game-detail/GameDetailView";
import { GamesView } from "@pages/games/GamesView";
import { MonitorListView } from "@pages/monitor-list/MonitorListView";
import { MonitorView } from "@pages/monitor/MonitorView";
import { SettingsView } from "@pages/settings/SettingsView";
import { SetupView } from "@pages/setup/SetupView";
import { t } from "i18next";
import React, { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useLocalStorage } from "react-use";
import { Redirect, Route, Switch } from "wouter";
import pkg from "~/package.json";

/**
 * App entry.
 */
export function App() {
    const nav = useNav();

    useAutoTheme();
    const { theme } = useTheme();

    useAutoFontClass();

    // Toasts use the opposite theme
    const toastTheme = themeManager.isDark(theme) ? "light" : "dark";

    useEffect(() => {
        native.app.onUpgraded(version => toast(t("toast.app-upgraded", { version }), { type: "info" }));
    }, []);


    return <HeroUIProvider navigate={nav}>
        <ConfigProvider>
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
                    pauseOnFocusLoss={false}
                />
            </main>
        </ConfigProvider>
    </HeroUIProvider>;
}


/**
 * Main app content area.
 */
function MainArea() {
    return <div className="grow min-h-0 w-11/12 mb-8 mt-4 mx-auto">
        <Switch>
            <Route path="/about" component={AboutView}/>
            <Route path="/settings" component={SettingsView}/>
            <Route path="/create-game" component={CreateGameView}/>
            <Route path="/games" component={GamesView}/>
            <Route path="/game-detail/:gameId" component={GameDetailView}/>
            <Route path="/monitor/:procId" component={MonitorView}/>
            <Route path="/monitor" component={MonitorListView}/>
            <Route path="/setup" component={SetupView} nest/>
            <Route path="/" component={DefaultPageRedirect}/>
        </Switch>
    </div>;
}

function DefaultPageRedirect() {
    const [setupDone] = useLocalStorage("setup.done"); // TODO update the flag when setup is done
    return <Redirect to={setupDone ? "/games" : "/setup"}/>;
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
