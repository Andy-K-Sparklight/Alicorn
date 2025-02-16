import { AnimatedRoute } from "@components/AnimatedRoute";
import { AccountInitView } from "@pages/setup/AccountInitView";
import { AnalyticsView } from "@pages/setup/AnalyticsView";
import { FinishView } from "@pages/setup/FinishView";
import { GamePathSetupView } from "@pages/setup/GamePathSetupView";
import { LicenseView } from "@pages/setup/LicenseView";
import { WelcomeView } from "@pages/setup/WelcomeView";
import { ZoomFactorView } from "@pages/setup/ZoomFactorView";
import { Redirect } from "wouter";

export function SetupView() {
    return <div className="p-8 w-full h-full">
        <AnimatedRoute path="/setup/welcome" component={WelcomeView}/>
        <AnimatedRoute path="/setup/zoom" component={ZoomFactorView}/>
        <AnimatedRoute path="/setup/license" component={LicenseView}/>
        <AnimatedRoute path="/setup/game-path" component={GamePathSetupView}/>
        <AnimatedRoute path="/setup/account-init" component={AccountInitView}/>
        <AnimatedRoute path="/setup/analytics" component={AnalyticsView}/>
        <AnimatedRoute path="/setup/finish" component={FinishView}/>
        <AnimatedRoute path="/setup" component={DefaultPageRedirect}/>
    </div>;
}

function DefaultPageRedirect() {
    return <Redirect to="/setup/welcome"/>;
}
