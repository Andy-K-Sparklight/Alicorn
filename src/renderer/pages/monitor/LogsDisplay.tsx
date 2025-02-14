import type { GameProcessLog } from "@/main/launch/log-parser";
import { useCurrentProc } from "@pages/monitor/GameProcessProvider";
import { clsx } from "clsx";
import React, { useEffect, useRef } from "react";
import { VList, type VListHandle } from "virtua";

export function LogsDisplay() {
    const autoScroll = useRef(true);
    const prevOffset = useRef(0);
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

    function updateAutoScroll(offset: number) {
        if (ref.current) {
            if (offset < prevOffset.current) {
                // Cancel auto scroll when scrolling up
                autoScroll.current = false;
                return;
            } else if (ref.current.scrollOffset - ref.current.scrollSize + ref.current.viewportSize >= -10) {
                // Enable auto scroll when not scrolling up & reached the bottom
                // But does not cancel it if not at the bottom (due to smooth scrolling)
                autoScroll.current = true;
            }

            prevOffset.current = offset;
        }
    }

    return <VList
        ref={ref}
        className="h-full p-2"
        onScroll={updateAutoScroll}
        onScrollEnd={() => {
            // Prevent misjudged scroll up when layout shifts
            prevOffset.current = 0;
        }}
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
                    clsx("break-all whitespace-pre-line", {
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
