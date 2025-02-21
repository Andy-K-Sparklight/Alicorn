import { useNav } from "@/renderer/util/nav";
import { AnimatedRoute } from "@components/AnimatedRoute";
import { AccountInitView } from "@pages/setup/AccountInitView";
import { AnalyticsView } from "@pages/setup/AnalyticsView";
import { FinishView } from "@pages/setup/FinishView";
import { GamePathSetupView } from "@pages/setup/GamePathSetupView";
import { LanguageView } from "@pages/setup/LanguageView";
import { LicenseView } from "@pages/setup/LicenseView";
import { MirrorView } from "@pages/setup/MirrorView";
import { WelcomeView } from "@pages/setup/WelcomeView";
import { ZoomFactorView } from "@pages/setup/ZoomFactorView";
import React, { useContext, useState } from "react";
import { Redirect } from "wouter";

interface PagesContextContent {
    currentPage: number;
    setCurrentPage: (p: number) => void;
    pages: string[];
}

const PagesContext = React.createContext<PagesContextContent | null>(null);

const setupPages = [
    ["lang", LanguageView],
    ["welcome", WelcomeView],
    ["zoom", ZoomFactorView],
    ["license", LicenseView],
    ["mirror", MirrorView],
    ["game-path", GamePathSetupView],
    ["account-init", AccountInitView],
    ["analytics", AnalyticsView],
    ["finish", FinishView]
] as [string, React.ComponentType<any>][];

export function SetupView() {
    const [currentPage, setCurrentPage] = useState(0);

    const pages = setupPages.map(p => p[0]);

    return <div className="p-8 w-full h-full">
        <PagesContext.Provider value={{ pages, currentPage, setCurrentPage }}>
            {
                setupPages.map(([name, comp]) =>
                    <AnimatedRoute key={name} path={`/setup/${name}`} component={comp}/>
                )
            }

            <AnimatedRoute path="/setup" component={DefaultPageRedirect}/>
        </PagesContext.Provider>
    </div>;
}

export function useSetupNextPage() {
    const ctx = useContext(PagesContext);
    if (!ctx) throw "Should not try to use next-page navigation hook outside its provider";

    const nav = useNav();

    return () => {
        const pt = ctx.pages[ctx.currentPage + 1];
        ctx.setCurrentPage(ctx.currentPage + 1);
        nav(`/setup/${pt}`);
    };
}

function DefaultPageRedirect() {
    return <Redirect to="/setup/lang"/>;
}
