import { useThemeColorValues } from "@pages/monitor/use-color";
import { useTranslation } from "react-i18next";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface MemoryUsageChartProps {
    stat: number[];
}

export function MemoryUsageChart({ stat }: MemoryUsageChartProps) {
    const { primary, background } = useThemeColorValues();
    const { t } = useTranslation("pages", { keyPrefix: "monitor.memory" });

    const raw = stat.slice(-10);

    while (raw.length < 10) {
        raw.unshift(0);
    }

    const data = raw.map((mem, i) => ({
        mem: Math.round(mem / 1024 / 1024 * 100) / 100,
        time: i === 9 ? t("now") : (i - 9) + "s"
    }));

    return <div className="w-full h-full">
        <AutoSizer renderProp={
            ({ height, width }) =>
                <LineChart width={width} height={height} data={data}>
                    <Line
                        isAnimationActive={false}
                        type="monotone"
                        dot={false}
                        dataKey="mem"
                        stroke={primary}
                        strokeWidth={3}
                    />
                    <CartesianGrid stroke={background}/>
                    <XAxis dataKey="time"/>
                    <YAxis/>
                </LineChart>
        }
        />
    </div>;
}
