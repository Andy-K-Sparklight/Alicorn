import { schedulePromiseTask } from "@/renderer/Schedule";
import { CMC_CRASH_LOADER } from "./CutieMCCrashLoader";

// Not only for crash reports, but also logs
export interface CrashLoader {
    rules: Record<string, CrashLoaderRule>;
}

// Script Specification
// A function receives arguments 'cursor' 'valueMap'
// And returns {reason?: string, suggestions?: string[]}
// If cannot handle it, leave 'reason' to 'undefined' and Alicorn will ignore this line

interface CrashLoaderRule {
    match: string;
    script: string;
}

export interface CrashLoaderReport {
    by?: string;
    reason?: string;
    suggestions?: string[];
}

export class CrashReportCursor {
    private tmpValues: Map<string, string> = new Map();
    lines: string[] = [];
    currentLine = 0;
    lineMap: Map<number, { origin: string; report: CrashLoaderReport[] }> =
        new Map();

    constructor(content: string[]) {
        content = content.map((l) => {
            return l.trimEnd(); // Don't trim head - indent required
        });
        this.lines = content;
    }

    // Move cursor forward
    next(lines = 1): string | undefined {
        this.currentLine += lines;
        return this.lines[this.currentLine];
    }

    // Move cursor back
    prev(lines = 1): string | undefined {
        this.currentLine -= lines;
        return this.lines[this.currentLine];
    }

    // Get line without moving cursor
    getLine(line = 0): string | undefined {
        return this.lines[this.currentLine + line];
    }

    executeLine(loader: CrashLoader): void {
        const crLine = this.getLine();
        if (crLine === undefined) {
            return;
        }
        this.lineMap.set(this.currentLine, {
            origin: crLine,
            report: []
        });
        const rules = loader.rules;
        for (const [name, r] of Object.entries(rules)) {
            const scr = r.script;
            const regex = new RegExp(r.match);

            if (!regex.test(crLine)) {
                continue;
            }
            try {
                const func = eval(scr) as (
                    cursor: CrashReportCursor,
                    valueMap: Map<string, string>
                ) => CrashLoaderReport;
                const report = func(this, this.tmpValues);
                // Offer a value registry table to the crash loader
                if (!report.by) {
                    report.by = name;
                }
                if (!report.reason) {
                    continue;
                }
                if (report.suggestions === undefined) {
                    report.suggestions = [];
                }
                this.lineMap.get(this.currentLine)?.report.push(report);
            } catch {}
        }
    }

    build(): Map<number, { origin: string; report: CrashLoaderReport[] }> {
        return this.lineMap;
    }
}

export async function analyzeCrashReport(
    crashReport: string[],
    loader = CMC_CRASH_LOADER
): Promise<Map<number, { origin: string; report: CrashLoaderReport[] }>> {
    try {
        const c = new CrashReportCursor(crashReport);

        while (c.getLine() !== undefined) {
            await schedulePromiseTask(() => {
                c.executeLine(loader);
                return Promise.resolve();
            });
            c.next();
        }

        return c.build();
    } catch (e) {
        console.log("Error during analyzing!");
        console.log(e);
        return new Map<number, { origin: string; report: CrashLoaderReport[] }>();
    }
}

async function getOnlineCrashLoader(
    url: string
): Promise<CrashLoader | undefined> {
    try {
        const r = await (
            await fetch(url, {
                method: "GET",
                credentials: "omit"
            })
        ).text();
        const obj = eval(r);
        if (obj) {
            return obj as CrashLoader;
        }
        return undefined;
    } catch {
        return undefined;
    }
}

export type CrashReportMap = Map<
    number,
    { origin: string; report: CrashLoaderReport[] }
>;
