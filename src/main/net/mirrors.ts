import { conf } from "@/main/conf/conf";
import { net } from "electron";

interface Mirror {
    name: string;
    test: string;

    apply(origin: string): string;
}

const vanilla = {
    name: "vanilla",
    test: "https://libraries.minecraft.net/com/google/guava/guava/21.0/guava-21.0.jar",
    apply: o => o
} satisfies Mirror;

const bmclapi = import.meta.env.AL_ENABLE_BMCLAPI && {
    name: "bmclapi",
    test: "https://bmclapi2.bangbang93.com/maven/com/google/guava/guava/21.0/guava-21.0.jar",
    apply(origin: string): string {
        const u = URL.parse(origin);
        if (!u) return origin; // Possibly malformed URL

        if (["launcher.mojang.com", "launchermeta.mojang.com", "piston-meta.mojang.com", "piston-data.mojang.com"].includes(u.host)) {
            u.host = "bmclapi2.bangbang93.com";
        }

        if (["maven.minecraftforge.net", "libraries.minecraft.net", "maven.fabricmc.net"].includes(u.host)) {
            u.host = "bmclapi2.bangbang93.com";
            u.pathname = "/maven" + u.pathname;
        }

        if (u.host === "files.minecraftforge.net" && u.pathname.startsWith("/maven")) {
            u.host = "bmclapi2.bangbang93.com";
        }

        if (u.host === "resources.download.minecraft.net") {
            u.host = "bmclapi2.bangbang93.com";
            u.pathname = "/assets" + u.pathname;
        }

        if (u.host === "authlib-injector.yushi.moe") {
            u.host = "bmclapi2.bangbang93.com";
            u.pathname = "/mirrors/authlib-injector" + u.pathname;
        }

        if (u.host === "meta.fabricmc.net") {
            u.host = "bmclapi2.bangbang93.com";
            u.pathname = "/fabric-meta" + u.pathname;
        }

        return u.toString();
    }
} satisfies Mirror;

const mirrorList = [bmclapi, vanilla].filter(Boolean) as Mirror[];

let activeMirrors: Mirror[];

function setInitialMirrors() {
    if (!activeMirrors) {
        const preferMirror = mirrorList.find(m => m.name === conf().net.mirror.prefer);
        activeMirrors = [...new Set([preferMirror, ...mirrorList].filter(Boolean) as Mirror[])];
    }
}

function apply(url: string): string[] {
    setInitialMirrors();
    const sources = [...activeMirrors.map(m => m.apply(url)), url];
    return [...new Set(sources)];
}

async function bench(): Promise<void> {
    setInitialMirrors();

    const mirrors = [bmclapi, vanilla].filter(Boolean) as Mirror[];

    if (mirrors.length < 2 || !conf().net.mirror.bench) {
        return;
    }

    const speed: [Mirror, number][] = [];
    for (const m of mirrors) {
        console.log(`Testing URL: ${m.test}`);
        const s = await testMirrorSpeed(m.test);
        console.log(`Estimated speed: ${s} (KB/s)`);
        speed.push([m, s]);
    }
    speed.sort((a, b) => b[1] - a[1]);
    activeMirrors = speed.map(it => it[0]);
    conf().net.mirror.prefer = activeMirrors[0].name;
}

async function testMirrorSpeed(url: string): Promise<number> {
    const t = Date.now();
    const res = await net.fetch(url, { cache: "no-cache" });
    if (!res.ok) return -1;
    const arr = await res.arrayBuffer();
    return arr.byteLength / (Date.now() - t);
}

export const mirror = {
    bench, apply
};