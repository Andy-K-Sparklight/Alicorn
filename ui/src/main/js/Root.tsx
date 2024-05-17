import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

function useInterval(callback: () => unknown, period: number) {
    useEffect(() => {
        const i = setInterval(callback, period);
        return () => clearInterval(i);
    }, []);
}

export function Root() {
    const [loading, setLoading] = useState(false);
    useInterval(() => {
        setLoading(false);
    }, 1000);
    return <>
        <SlButton loading={loading} variant={"primary"} disabled={loading} onClick={() => setLoading(true)}>
            DO NOT CLICK
        </SlButton>
    </>;
}

export function renderApp() {
    const d = document.createElement("div");
    document.body.appendChild(d);
    const root = createRoot(d);
    root.render(<Root/>);
}