import childProcess from "node:child_process";

export function run(cmd: string): Promise<string> {
    return new Promise((res, rej) => {
        childProcess.exec(cmd, (e, stdout) => {
            if (e) rej(e);
            else res(stdout.toString());
        });
    });
}

export const command = { run };
