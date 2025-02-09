import { hslToHex } from "@/renderer/util/misc";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AutoSizer from "react-virtualized-auto-sizer";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface MemoryUsageChartProps {
    stat: number[];
}

export function MemoryUsageChart({ stat }: MemoryUsageChartProps) {
    const [primaryColor, setPrimaryColor] = useState("#ffffff");
    const [backgroundColor, setBackgroundColor] = useState("#333");
    const { t } = useTranslation("pages", { keyPrefix: "monitor.memory" });

    useEffect(() => {
        const style = getComputedStyle(document.documentElement);

        setPrimaryColor(
            hslToHex(style.getPropertyValue("--heroui-primary"))
        );

        setBackgroundColor(
            hslToHex(style.getPropertyValue("--heroui-foreground-400"))
        );
    }, []);

    const raw = stat.slice(-10);

    while (raw.length < 10) {
        raw.unshift(0);
    }

    const data = raw.map((mem, i) => ({
        mem: Math.round(mem / 1024 / 1024 * 100) / 100,
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
                        dataKey="mem"
                        stroke={primaryColor}
                        strokeWidth={3}
                    />
                    <CartesianGrid stroke={backgroundColor}/>
                    <XAxis dataKey="time"/>
                    <YAxis/>
                </LineChart>
            }
        </AutoSizer>

    </div>;
}
