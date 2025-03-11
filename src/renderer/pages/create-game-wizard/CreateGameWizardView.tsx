import type { CreateGameInit } from "@/main/api/game";
import { AnimatedRoute } from "@components/AnimatedRoute";
import { FinishView } from "@pages/create-game-wizard/FinishView";
import { PickAccountView } from "@pages/create-game-wizard/PickAccountView";
import { PickModLoaderView } from "@pages/create-game-wizard/PickModLoaderView";
import { PickVersionView } from "@pages/create-game-wizard/PickVersionView";
import React, { useState } from "react";
import { Redirect } from "wouter";

interface CreateGameWizardContextContent {
    value: Partial<CreateGameInit>;
    setValue: (value: Partial<CreateGameInit>) => void;
}

const CreateGameWizardContext = React.createContext<CreateGameWizardContextContent | null>(null);

export function CreateGameWizardView() {
    const [value, setValue] = useState<Partial<CreateGameInit>>({});
    return <CreateGameWizardContext.Provider value={{ value, setValue }}>
        <AnimatedRoute path="/games/new-wizard/pick-version" component={PickVersionView}/>
        <AnimatedRoute path="/games/new-wizard/pick-mod-loader" component={PickModLoaderView}/>
        <AnimatedRoute path="/games/new-wizard/pick-account" component={PickAccountView}/>
        <AnimatedRoute path="/games/new-wizard/finish" component={FinishView}/>
        <AnimatedRoute path="/games/new-wizard" component={DefaultPageRedirect}/>
    </CreateGameWizardContext.Provider>;
}

function DefaultPageRedirect() {
    return <Redirect to="/games/new-wizard/pick-version"/>;
}

export function useCreateGameWizardContext() {
    const ctx = React.useContext(CreateGameWizardContext);
    if (!ctx) throw "Should not try to use game creation context outside its provider";
    return ctx;
}
