// Convert legacy(1.12.2 or earlier) profile to modern profile

// NATIVE

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function convertFromLegacy(legacy) {
    try {
        const out = {};
        out["arguments"] = {};
        out["arguments"]["game"] = legacy["minecraftArguments"].split(" ");
        out["arguments"]["jvm"] = DEFAULT_VM_OPTIONS;
        Object.assign(out, legacy);
        return out;
    } catch {
        return legacy;
    }
}

const DEFAULT_VM_OPTIONS = [
    {
        rules: [
            {
                action: "allow",
                os: {
                    name: "osx"
                }
            }
        ],
        value: ["-XstartOnFirstThread"]
    },
    {
        rules: [
            {
                action: "allow",
                os: {
                    arch: "x86"
                }
            }
        ],
        value: "-Xss1M"
    },
    "-Djava.library.path=${natives_directory}",
    "-cp",
    "${classpath}"
];
