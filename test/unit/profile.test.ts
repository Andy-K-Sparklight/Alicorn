import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import fs from "fs-extra";
import { linkProfile } from "@/main/profile/linker";

beforeEach(() => process.chdir(import.meta.dirname));

const getProfileContent = async (id: string) => await fs.readJSON(`../resources/${id}.json`);

test("Load Vanilla Profile (1.7.10)", async () => {
    const p = await linkProfile("1.7.10", getProfileContent);

    assert.equal(p.id, "1.7.10", "Should load ID");
    assert.equal(p.version, "1.7.10", "Should infer version");
    assert.equal(p.assets, "1.7.10", "Should load assets");
    assert.equal(p.mainClass, "net.minecraft.client.main.Main", "Should load main class");
    assert.equal(
        p.downloads.client.sha1,
        "e80d9b3bf5085002218d4be59e668bac718abbc6",
        "Should load client artifact details",
    );
    assert.equal(p.arguments.game[0], "--username", "Should load arguments");
    assert.equal(p.libraries[0].name, "com.mojang:netty:1.8.8", "Should load libraries");
    assert.equal(p.logging?.client.file.id, "client-1.7.xml", "Should load logging configuration");
});

test("Load Vanilla Profile (1.16.5)", async () => {
    const p = await linkProfile("1.16.5", getProfileContent);

    assert.equal(p.id, "1.16.5", "Should load ID");
    assert.equal(p.version, "1.16.5", "Should infer version");
    assert.equal(p.assets, "1.16", "Should load assets");
    assert.equal(p.mainClass, "net.minecraft.client.main.Main", "Should load main class");
    assert.equal(
        p.downloads.client.sha1,
        "37fd3c903861eeff3bc24b71eed48f828b5269c8",
        "Should load client artifact details",
    );
    assert.equal(
        p.downloads.client_mappings?.sha1,
        "374c6b789574afbdc901371207155661e0509e17",
        "Should load client mappings",
    );
    assert.equal(p.arguments.game[0], "--username", "Should load arguments");
    assert.equal(p.libraries[0].name, "com.mojang:patchy:1.3.9", "Should load libraries");
    assert.equal(p.logging?.client.file.id, "client-1.12.xml", "Should load logging configuration");
});

test("Load Inherited Profile (1.7.10 Forge)", async () => {
    const p = await linkProfile("Forge-1.7.10", getProfileContent);

    assert.equal(p.id, "Forge-1.7.10", "Should load ID");
    assert.equal(p.version, "1.7.10", "Should infer version");
    assert.equal(p.assets, "1.7.10", "Should load assets");
    assert.equal(p.mainClass, "net.minecraft.launchwrapper.Launch", "Should load main class");
    assert.equal(
        p.downloads.client.sha1,
        "e80d9b3bf5085002218d4be59e668bac718abbc6",
        "Should load client artifact details",
    );
    assert.equal(p.arguments.game[0], "--username", "Should load arguments");
    assert.equal(
        p.libraries[0].name,
        "net.minecraftforge:forge:1.7.10-10.13.4.1614-1.7.10",
        "Should load libraries",
    );
    assert.equal(p.logging?.client.file.id, "client-1.7.xml", "Should load logging configuration");
});

test("Load Inherited Profile (1.12.2 Forge)", async () => {
    const p = await linkProfile("Forge-1.12.2", getProfileContent);

    assert.equal(p.id, "Forge-1.12.2", "Should load ID");
    assert.equal(p.version, "1.12.2", "Should infer version");
    assert.equal(p.assets, "1.12", "Should load assets");
    assert.equal(p.mainClass, "net.minecraft.launchwrapper.Launch", "Should load main class");
    assert.equal(
        p.downloads.client.sha1,
        "0f275bc1547d01fa5f56ba34bdc87d981ee12daf",
        "Should load client artifact details",
    );
    assert.equal(p.arguments.game[0], "--username", "Should load arguments");
    assert.equal(
        p.libraries[0].name,
        "net.minecraftforge:forge:1.12.2-14.23.5.2859",
        "Should load libraries",
    );
    assert.equal(p.logging?.client.file.id, "client-1.12.xml", "Should load logging configuration");
});

test("Load Inherited Profile (1.20.1 Fabric)", async () => {
    const p = await linkProfile("Fabric-1.20.1", getProfileContent);

    assert.equal(p.id, "Fabric-1.20.1", "Should load ID");
    assert.equal(p.version, "1.20.1", "Should infer version");
    assert.equal(p.assets, "5", "Should load assets");
    assert.equal(
        p.mainClass,
        "net.fabricmc.loader.impl.launch.knot.KnotClient",
        "Should load main class",
    );
    assert.equal(
        p.downloads.client.sha1,
        "0c3ec587af28e5a785c0b4a7b8a30f9a8f78f838",
        "Should load client artifact details",
    );
    assert.equal(
        p.downloads.client_mappings?.sha1,
        "6c48521eed01fe2e8ecdadbd5ae348415f3c47da",
        "Should load client mappings",
    );
    assert.equal(p.arguments.game[0], "--username", "Should load game arguments");
    assert.equal(
        p.arguments.jvm[0],
        "-DFabricMcEmu= net.minecraft.client.main.Main ",
        "Should load VM arguments",
    );
    assert.equal(p.libraries[0].name, "org.ow2.asm:asm:9.6", "Should load libraries");
    assert.equal(p.logging?.client.file.id, "client-1.12.xml", "Should load logging configuration");
});

test("Fail Circular Inheritance", async () => {
    await assert.rejects(
        linkProfile("Circular", getProfileContent),
        "Should reject circular inherited profile",
    );
});
