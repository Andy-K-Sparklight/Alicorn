import { App } from "@/renderer/App";
import React, { FC } from "react";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

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