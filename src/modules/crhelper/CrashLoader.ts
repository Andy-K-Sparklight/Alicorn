import { getCurrentLocale } from "../../renderer/Translator";
import { CMC_CRASH_LOADER } from "./CutieMCCrashLoader";
import fs from "fs-extra";
import got from "got";
import { safeEval } from "./SafeEvalNatives";
import { schedulePromiseTask } from "../../renderer/Schedule";

export interface CrashLoader {
  rules: Record<string, CrashLoaderRule>;
}

// Script Specification
// A function receives arguments 'cursor' 'locale'
// And returns {reason?: string, suggestions?: string[]}
// If cannot handle it, leave 'reason' to 'undefined' and Alicorn will ignore this line

export interface CrashLoaderRule {
  match: string;
  script: string;
}

export interface CrashLoaderReport {
  by?: string;
  reason?: string;
  suggestions?: string[];
}

export class CrashReportCursor {
  lines: string[] = [];
  currentLine = 0;
  lineMap: Map<number, { origin: string; report: CrashLoaderReport[] }> =
    new Map();

  constructor(content: string) {
    let all = content.split("\n");
    console.log(all);
    all = all.map((l) => {
      return l.trimEnd(); // Don't trim head - indent required
    });
    this.lines = all;
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
      report: [],
    });
    const rules = loader.rules;
    for (const [name, r] of Object.entries(rules)) {
      const scr = r.script;
      const regex = new RegExp(r.match);

      if (!regex.test(crLine)) {
        continue;
      }
      try {
        const func = safeEval(scr) as (
          cursor: CrashReportCursor,
          locale: string
        ) => CrashLoaderReport;
        const report = func(this, getCurrentLocale());
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
  fPath: string,
  loader = CMC_CRASH_LOADER
): Promise<Map<number, { origin: string; report: CrashLoaderReport[] }>> {
  try {
    const f = (await fs.readFile(fPath)).toString();
    const c = new CrashReportCursor(f);

    while (c.getLine() !== undefined) {
      await schedulePromiseTask(async () => {
        c.executeLine(loader);
      });
      c.next();
    }

    return c.build();
  } catch {
    return new Map<number, { origin: string; report: CrashLoaderReport[] }>();
  }
}

async function getOnlineCrashLoader(
  url: string
): Promise<CrashLoader | undefined> {
  try {
    const r = (await got.get(url, { responseType: "text" })).body;
    const obj = safeEval(r);
    if (obj) {
      return obj as CrashLoader;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function onlineAnalyzeCrashReport(
  fPath: string,
  url: string
): Promise<Map<number, { origin: string; report: CrashLoaderReport[] }>> {
  const d = await getOnlineCrashLoader(url);
  if (!d) {
    return new Map<number, { origin: string; report: CrashLoaderReport[] }>();
  }
  return analyzeCrashReport(fPath, d);
}
