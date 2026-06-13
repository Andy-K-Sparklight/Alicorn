import { ExceptionDisplay } from "@components/display/ExceptionDisplay";
import { AnimatedRoute } from "@components/misc/AnimatedRoute";
import { Navigator } from "@components/misc/Navigator";
import { Toast } from "@heroui/react";
import { AboutView } from "@pages/about/AboutView";
import { CreateGameFromModpackView } from "@pages/create-from-modpack/CreateGameFromModpackView";
import { CreateGameView } from "@pages/create-game/CreateGameView";
import { CreateGameWizardView } from "@pages/create-game-wizard/CreateGameWizardView";
import { GameDetailView } from "@pages/game-detail/GameDetailView";
import { GamesView } from "@pages/games/GamesView";
import { ImportGameView } from "@pages/import-game/ImportGameView";
import { MonitorView } from "@pages/monitor/MonitorView";
import { MonitorListView } from "@pages/monitor-list/MonitorListView";
import { SettingsView } from "@pages/settings/SettingsView";
import { SetupView } from "@pages/setup/SetupView";
import { useLocalStorage } from "react-use";
import { Redirect } from "wouter";
import { useAutoFontClass } from "@/renderer/i18n/i18n";
import { useAutoTheme } from "@/renderer/theme";
import pkg from "~/package.json";

/**
 * App entry.
 */
export function App() {
    useAutoTheme();
    useAutoFontClass();

    return (
        <main className="fixed inset-0 text-foreground bg-background">
            <div className="flex flex-col w-full h-full">
                <Navigator />
                <MainArea />
            </div>
            <VersionOverlay />
            <ExceptionDisplay />
            <Toast.Provider placement="bottom start" />
        </main>
    );
}

/**
 * Main app content area.
 */
function MainArea() {
    return (
        <div className="grow min-h-0 w-11/12 mb-8 mt-4 mx-auto relative">
            <AnimatedRoute path="/about" component={AboutView} />
            <AnimatedRoute path="/settings" component={SettingsView} />
            <AnimatedRoute path="/games/import" component={ImportGameView} />
            <AnimatedRoute path="/games/new-wizard/*?" component={CreateGameWizardView} />
            <AnimatedRoute path="/games/new/:gameId?" component={CreateGameView} />
            <AnimatedRoute
                path="/games/from-modpack/:path?"
                component={CreateGameFromModpackView}
            />
            <AnimatedRoute path="/games" component={GamesView} />
            <AnimatedRoute path="/games/detail/:gameId" component={GameDetailView} />
            <AnimatedRoute path="/monitor/:procId" component={MonitorView} />
            <AnimatedRoute path="/monitor" component={MonitorListView} />
            <AnimatedRoute path="/setup/*?" component={SetupView} />
            <AnimatedRoute path="/" component={DefaultPageRedirect} />
        </div>
    );
}

function DefaultPageRedirect() {
    const [setupDone] = useLocalStorage("setup.done");
    return <Redirect to={setupDone ? "/games" : "/setup"} />;
}

/**
 * Version overlay at the right bottom.
 */
function VersionOverlay() {
    if (!import.meta.env.AL_DEV) return "";

    const { version, codename } = pkg;

    return (
        <div className="fixed right-2 bottom-2 text-sm text-muted">
            Alicorn Launcher "{codename}" {version}
        </div>
    );
}
