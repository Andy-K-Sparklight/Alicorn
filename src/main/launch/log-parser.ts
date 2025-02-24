import { XMLParser } from "fast-xml-parser";
import lazyValue from "lazy-value";

export interface GameProcessLog {
    index: number; // An absolute index of the log
    time: number;
    logger: string;
    level: string;
    thread: string;
    message: string;
    throwable?: string;
}

const parser = lazyValue(() => new XMLParser({ ignoreAttributes: false, removeNSPrefix: true }));

function compatFragment(src: string): string {
    return `
        <?xml version="1.0" encoding="UTF-8"?>
        <Events xmlns:log4j="http://logging.apache.org/log4j/2.0/events">
            ${src}
        </Events>
    `;
}

function isPossiblyXmlLog(src: string): boolean {
    return src.replaceAll("\n", "").trim().startsWith("<log4j");
}

function parseAsRaw(src: string, index: number): GameProcessLog {
    const ss = src.toLowerCase();
    const level = ["fatal", "error", "warn", "info", "debug", "trace"].find(lv => ss.includes(lv))?.toUpperCase() ?? "INFO";
    return {
        index,
        time: Date.now(),
        logger: "Unknown",
        level,
        thread: "Unknown",
        message: src.trim(),
        throwable: undefined
    };
}

/**
 * Parse the XML-formatted log output as JS objects.
 */
function parse(src: string, index: number): GameProcessLog[] {
    if (!isPossiblyXmlLog(src)) {
        return [parseAsRaw(src, index)];
    }

    const dom = parser().parse(compatFragment(src));
    let events = dom?.["Events"]?.["Event"];

    if (typeof events !== "object") return [];

    if (!Array.isArray(events)) {
        events = [events];
    }

    events = events.filter((e: unknown) => typeof e === "object");

    return events.map((e: any) => {
        return {
            index: index++,
            message: e["Message"] ?? "",
            throwable: e["Throwable"],
            logger: e["@_logger"] ?? "",
            time: parseInt(e["@_timestamp"] ?? "0"),
            level: e["@_level"] ?? "INFO",
            thread: e["@_thread"] ?? ""
        } satisfies GameProcessLog;
    });
}

export const logParser = { parse };
