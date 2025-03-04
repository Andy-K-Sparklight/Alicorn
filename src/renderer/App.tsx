import { useAutoFontClass } from "@/renderer/i18n/i18n";
import { useAutoTheme } from "@/renderer/theme";
import { useNav } from "@/renderer/util/nav";
import { AnimatedRoute } from "@components/AnimatedRoute";
import { ExceptionDisplay } from "@components/ExceptionDisplay";
import { Navigator } from "@components/Navigator";
import { addToast, HeroUIProvider, ToastProvider } from "@heroui/react";
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
import { useLocalStorage } from "react-use";
import { Redirect } from "wouter";
import pkg from "~/package.json";

/**
 * App entry.
 */
export function App() {
    const nav = useNav();

    useAutoTheme();
    useAutoFontClass();

    useEffect(() => {
        native.app.onUpgraded(version => addToast({
            color: "success",
            title: t("toast.app-upgraded", { version })
        }));
    }, []);
    // Spinner styles need to be set manually for each one until the following issue gets solved
    // https://github.com/heroui-inc/heroui/issues/4906
    return <HeroUIProvider navigate={nav}>
        <main className="fixed inset-0 text-foreground bg-background">
            <div className="flex flex-col w-full h-full">
                <Navigator/>
                <MainArea/>
            </div>
            <VersionOverlay/>
            <ExceptionDisplay/>
            <ToastProvider placement="bottom-left" toastOffset={4}/>
        </main>
    </HeroUIProvider>;
}


/**
 * Main app content area.
 */
function MainArea() {
    return <div className="grow min-h-0 w-11/12 mb-8 mt-4 mx-auto relative">
        <AnimatedRoute path="/about" component={AboutView}/>
        <AnimatedRoute path="/settings" component={SettingsView}/>
        <AnimatedRoute path="/games/new/:gameId?" component={CreateGameView}/>
        <AnimatedRoute path="/games" component={GamesView}/>
        <AnimatedRoute path="/games/detail/:gameId" component={GameDetailView}/>
        <AnimatedRoute path="/monitor/:procId" component={MonitorView}/>
        <AnimatedRoute path="/monitor" component={MonitorListView}/>
        <AnimatedRoute path="/setup/*?" component={SetupView}/>
        <AnimatedRoute path="/" component={DefaultPageRedirect}/>
    </div>;
}

function DefaultPageRedirect() {
    const [setupDone] = useLocalStorage("setup.done");
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
