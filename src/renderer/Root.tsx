import React, { FC } from "react";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { App } from "@/renderer/App";

/**
 * The root render entry of Alicorn.
 */
export const Root: FC = () => {
    return <React.StrictMode>
        <Router hook={useHashLocation}>
            <App/>
        </Router>
    </React.StrictMode>;
};