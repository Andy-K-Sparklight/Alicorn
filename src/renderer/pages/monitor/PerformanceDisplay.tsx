import { Link } from "@heroui/react";
import { useCurrentProc } from "@pages/monitor/GameProcessProvider";
import { MemoryUsageChart } from "@pages/monitor/MemoryUsageChart";
import { ServerPingChart } from "@pages/monitor/ServerPingChart";
import React from "react";
import { useTranslation } from "react-i18next";

const EXPLAIN_MEMORY_URL = "https://stackoverflow.com/a/5406063";

export function PerformanceDisplay() {
    const { memUsage, server, serverPing } = useCurrentProc();
    const { t } = useTranslation("pages", { keyPrefix: "monitor" });

    function handleExplainMemory() {
        native.ext.openURL(EXPLAIN_MEMORY_URL);
    }

    return <div className="w-full h-full flex flex-col gap-4 p-4">
        <div className="grow flex flex-col gap-4">
            <div className="text-xl font-bold">{t("memory.title")}</div>
            <div className="text-foreground-400 text-sm">
                {t("memory.sub")}
                <Link onPress={handleExplainMemory} className="text-sm">{t("memory.sub-link")}</Link>
            </div>
            <MemoryUsageChart stat={memUsage}/>
        </div>

        <div className="grow flex flex-col gap-4">
            <div className="text-xl font-bold">{t("ping.title")}</div>
            <div className="text-foreground-400 text-sm">
                {
                    server ?
                        t("ping.sub", { server }) :
                        t("ping.no-server")
                }
            </div>
            {
                server && <ServerPingChart stat={serverPing}/>
            }

        </div>
    </div>;
}
