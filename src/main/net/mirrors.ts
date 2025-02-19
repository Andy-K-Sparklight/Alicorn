import { conf } from "@/main/conf/conf";
import { isTruthy } from "@/main/util/misc";
import { net } from "electron";

interface Mirror {
    name: string;
    test?: {
        url: string;
        challenge: string;
    };

    apply(origin: string): string;
}

const vanilla = {
    name: "vanilla",
    test: undefined,
    apply: o => o
} satisfies Mirror;

const aliyun = {
    name: "aliyun",
    test: {
        url: "https://maven.aliyun.com/nexus/content/groups/public/com/google/guava/guava/21.0/guava-21.0.jar",
        challenge: "https://libraries.minecraft.net/com/google/guava/guava/21.0/guava-21.0.jar"
    },

    apply(origin: string): string {
        const u = URL.parse(origin);
        if (!u) return origin;

        if (u.host === "repo1.maven.org" && u.pathname.startsWith("/maven2")) {
            u.host = "maven.aliyun.com";
            u.pathname = "/nexus/content/groups/public" + u.pathname.slice("/maven2".length);
        }

        // It's not surprising that most libraries that the game / loaders use can be found in the central repo
        // This shall reduce the number of requests to other mirrors
        if (["maven.minecraftforge.net", "libraries.minecraft.net", "maven.fabricmc.net"].includes(u.host)) {
            u.host = "maven.aliyun.com";
            u.pathname = "/nexus/content/groups/public" + u.pathname;
        }

        return u.toString();
    }
};

const bmclapi = import.meta.env.AL_ENABLE_BMCLAPI && {
    name: "bmclapi",
    test: {
        url: "https://bmclapi2.bangbang93.com/maven/com/google/guava/guava/21.0/guava-21.0.jar",
        challenge: "https://libraries.minecraft.net/com/google/guava/guava/21.0/guava-21.0.jar"
    },
    apply(origin: string): string {
        const u = URL.parse(origin);
        if (!u) return origin; // Possibly malformed URL

        if (["launcher.mojang.com", "launchermeta.mojang.com", "piston-meta.mojang.com", "piston-data.mojang.com"].includes(u.host)) {
            u.host = "bmclapi2.bangbang93.com";
        }

        // We're not including Quilt here as it seems not included
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

const mirrorList = [aliyun, bmclapi, vanilla].filter(isTruthy);

function getMirrors() {
    return mirrorList.filter(m => conf().net.mirror.picked.includes(m.name) || m.name === "vanilla");
}

function apply(url: string): string[] {
    const sources = [...getMirrors().map(m => m.apply(url)), url];
    return [...new Set(sources)];
}

async function bench(): Promise<void> {
    if (!conf().net.mirror.bench || mirrorList.length < 2) {
        return;
    }

    const enabledMirrors: string[] = [];

    for (const m of mirrorList) {
        if (m.test) {
            const s1 = await testSpeed(m.test.url);
            const s2 = await testSpeed(m.test.challenge);

            if (s1 <= s2) {
                // The mirror is not faster, ignore it
                continue;
            }
        }

        console.log(`Enabling mirror: ${m.name}`);
        enabledMirrors.push(m.name);
    }

    conf.alter(c => c.net.mirror.picked = enabledMirrors);
}

async function testSpeed(url: string): Promise<number> {
    console.log(`Testing URL: ${url}`);
    const t = Date.now();
    const res = await net.fetch(url, { cache: "reload" });
    if (!res.ok) return -1;
    const arr = await res.arrayBuffer();
    const speed = arr.byteLength / (Date.now() - t);
    console.log(`Estimated speed: ${speed} (KB/s)`);
    return speed;
}

export const mirror = {
    bench, apply
};
