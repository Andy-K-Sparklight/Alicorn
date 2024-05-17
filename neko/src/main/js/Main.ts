import * as IO from "./IO";

Neutralino.init();

void Neutralino.events.on("windowClose", () => {
    void Neutralino.app.exit();
});

async function getOsName() {
    return (await Neutralino.computer.getOSInfo()).name;
}

async function getOsVersion() {
    return (await Neutralino.computer.getOSInfo()).version;
}

async function getOsArch() {
    return await Neutralino.computer.getArch();
}

// @ts-expect-error Non-standard property access
window["$"] = {
    getOsArch, getOsName, getOsVersion, IO
};

// @ts-expect-error Non-standard property access
window["process"] = {
    cwd() {
        return NL_CWD;
    }
};


// @ts-expect-error Non-standard property access
window["main"]();