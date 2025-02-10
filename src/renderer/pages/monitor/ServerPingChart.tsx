import { useThemeColorValues } from "@pages/monitor/use-color";
import { useTranslation } from "react-i18next";
import AutoSizer from "react-virtualized-auto-sizer";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface ServerPingChartProps {
    stat: number[];
}

export function ServerPingChart({ stat }: ServerPingChartProps) {
    const { primary, background } = useThemeColorValues();
    const { t } = useTranslation("pages", { keyPrefix: "monitor.ping" });

    const raw = stat.slice(-10);

    while (raw.length < 10) {
        raw.unshift(0);
    }

    const data = raw.map((ping, i) => ({
        ping: Math.round(ping),
        time: i === 9 ? t("now") : (i - 9) + "s"
    }));

    return <div className="w-full h-full">
        <AutoSizer>
            {({ height, width }) =>
                <LineChart width={width} height={height} data={data}>
                    <Line
                        isAnimationActive={false}
                        type="monotone"
                        dot={false}
                        dataKey="ping"
                        stroke={primary}
                        strokeWidth={3}
                    />
                    <CartesianGrid stroke={background}/>
                    <XAxis dataKey="time"/>
                    <YAxis/>
                </LineChart>
            }
        </AutoSizer>

    </div>;
}
