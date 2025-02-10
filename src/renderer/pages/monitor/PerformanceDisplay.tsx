import { Link } from "@heroui/react";
import { useCurrentProc } from "@pages/monitor/GameProcessProvider";
import { MemoryUsageChart } from "@pages/monitor/MemoryUsageChart";
import React from "react";
import { useTranslation } from "react-i18next";

const EXPLAIN_MEMORY_URL = "https://stackoverflow.com/a/5406063";

export function PerformanceDisplay() {
    const { memUsage } = useCurrentProc();
    const { t } = useTranslation("pages", { keyPrefix: "monitor.memory" });

    function handleExplainMemory() {
        native.ext.openURL(EXPLAIN_MEMORY_URL);
    }

    return <div className="w-full h-full flex flex-col gap-4 p-4">
        <div className="basis-1/2 flex flex-col gap-4">
            <div className="text-xl font-bold">{t("title")}</div>
            <div className="text-foreground-400 text-sm">
                {t("sub")}
                <Link onPress={handleExplainMemory} className="text-sm">{t("sub-link")}</Link>
            </div>
            <MemoryUsageChart stat={memUsage}/>
        </div>
    </div>;
}
