import type { GameProcessLog } from "@/main/launch/log-parser";
import { cn } from "@heroui/react";
import { useCurrentProc } from "@pages/monitor/GameProcessProvider";
import React, { useEffect, useRef, type WheelEvent } from "react";
import { VList, type VListHandle } from "virtua";

export function LogsDisplay() {
    const autoScroll = useRef(true);
    const ref = useRef<VListHandle | null>(null);
    const { id: procId, logs } = useCurrentProc();

    function scrollToBottom() {
        ref.current?.scrollToIndex(Number.MAX_SAFE_INTEGER, { smooth: true });
    }

    useEffect(() => {
        if (autoScroll.current) {
            scrollToBottom();
        }
    }, [logs]);

    function handleWheel(e: WheelEvent) {
        // Cancels when user input happens
        if (e.deltaY < 0) {
            autoScroll.current = false;
            return;
        }

        if (ref.current) {
            // Adding e.deltaY makes it possible to detect that user "will" scroll to the bottom
            // Even before this actually happens
            if (ref.current.scrollOffset + e.deltaY - ref.current.scrollSize + ref.current.viewportSize >= -10) {
                autoScroll.current = true;
            }
        }
    }

    return <VList
        ref={ref}
        onWheel={handleWheel}
        className="h-full p-2"
    >
        {
            logs.map(log =>
                // The key includes process ID to correctly handle props changes when switching between monitors
                <LogLineMemo log={log} key={procId + ":" + log.index}/>
            )
        }
    </VList>;

}

const LogLineMemo = React.memo(LogLine, (prevProps, nextProps) => {
    // Log objects are not changed once parsed
    // By comparing props via index we save lots of re-renders
    return nextProps.log.index === prevProps.log.index;
});

function LogLine({ log }: { log: GameProcessLog }) {
    const { time, level, message, throwable } = log;

    return <div className="flex flex-col text-sm pb-1">
        <div className="flex gap-3">
            <pre className="text-foreground-400">
                {new Date(time).toLocaleTimeString()}
            </pre>
            <div
                className={
                    cn("break-all whitespace-pre-line", {
                        "font-bold text-danger": level === "FATAL" || level === "ERROR",
                        "font-bold text-warning": level === "WARN",
                        "text-foreground-400": level === "DEBUG"
                    })
                }
            >

                <pre className="whitespace-pre-wrap">
                    {message}
                    <br/>
                    {throwable && <><br/>{throwable}</>}
                </pre>
            </div>
        </div>
    </div>;
}
