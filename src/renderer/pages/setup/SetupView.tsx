import { AccountInitView } from "@pages/setup/AccountInitView";
import { AnalyticsView } from "@pages/setup/AnalyticsView";
import { FinishView } from "@pages/setup/FinishView";
import { GamePathSetupView } from "@pages/setup/GamePathSetupView";
import { LicenseView } from "@pages/setup/LicenseView";
import { WelcomeView } from "@pages/setup/WelcomeView";
import { Redirect, Route, Switch } from "wouter";

export function SetupView() {
    return <div className="p-8 w-full h-full">
        <Switch>
            <Route path="/">
                <Redirect to="/welcome"/>
            </Route>

            <Route path="/welcome" component={WelcomeView}/>
            <Route path="/license" component={LicenseView}/>
            <Route path="/game-path" component={GamePathSetupView}/>
            <Route path="/account-init" component={AccountInitView}/>
            <Route path="/analytics" component={AnalyticsView}/>
            <Route path="/finish" component={FinishView}/>
        </Switch>
    </div>;
}
