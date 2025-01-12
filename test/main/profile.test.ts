import { linkProfile } from "@/main/profile/linker";
import chaiAsPromised from "chai-as-promised";
import fs from "fs-extra";
import { beforeEach, chai, expect, test } from "vitest";

chai.use(chaiAsPromised);
beforeEach(() => process.chdir(import.meta.dirname));

const getProfileContent = async (id: string) => await fs.readJSON(`../resources/${id}.json`);

test("Load Vanilla Profile (1.7.10)", async () => {
    const p = await linkProfile("1.7.10", getProfileContent);

    expect(p.id, "Should load ID").to.eq("1.7.10");
    expect(p.version, "Should infer version").to.eq("1.7.10");
    expect(p.assets, "Should load assets").to.eq("1.7.10");
    expect(p.mainClass, "Should load main class").to.eq("net.minecraft.client.main.Main");
    expect(p.downloads.client.sha1, "Should load client artifact details")
        .to.eq("e80d9b3bf5085002218d4be59e668bac718abbc6");
    expect(p.arguments.game[0], "Should load arguments").to.eq("--username");
    expect(p.libraries[0].name, "Should load libraries").to.eq("com.mojang:netty:1.8.8");
    expect(p.logging?.client.file.id, "Should load logging configuration").to.eq("client-1.7.xml");
});

test("Load Vanilla Profile (1.16.5)", async () => {
    const p = await linkProfile("1.16.5", getProfileContent);

    expect(p.id, "Should load ID").to.eq("1.16.5");
    expect(p.version, "Should infer version").to.eq("1.16.5");
    expect(p.assets, "Should load assets").to.eq("1.16");
    expect(p.mainClass, "Should load main class").to.eq("net.minecraft.client.main.Main");
    expect(p.downloads.client.sha1, "Should load client artifact details")
        .to.eq("37fd3c903861eeff3bc24b71eed48f828b5269c8");
    expect(p.downloads.client_mappings?.sha1, "Should load client mappings")
        .to.eq("374c6b789574afbdc901371207155661e0509e17");
    expect(p.arguments.game[0], "Should load arguments").to.eq("--username");
    expect(p.libraries[0].name, "Should load libraries").to.eq("com.mojang:patchy:1.3.9");
    expect(p.logging?.client.file.id, "Should load logging configuration").to.eq("client-1.12.xml");
});

test("Load Inherited Profile (1.7.10 Forge)", async () => {
    const p = await linkProfile("Forge-1.7.10", getProfileContent);

    expect(p.id, "Should load ID").to.eq("Forge-1.7.10");
    expect(p.version, "Should infer version").to.eq("1.7.10");
    expect(p.assets, "Should load assets").to.eq("1.7.10");
    expect(p.mainClass, "Should load main class").to.eq("net.minecraft.launchwrapper.Launch");
    expect(p.downloads.client.sha1, "Should load client artifact details")
        .to.eq("e80d9b3bf5085002218d4be59e668bac718abbc6");
    expect(p.arguments.game[0], "Should load arguments").to.eq("--username");
    expect(p.libraries[0].name, "Should load libraries").to.eq("net.minecraftforge:forge:1.7.10-10.13.4.1614-1.7.10");
    expect(p.logging?.client.file.id, "Should load logging configuration").to.eq("client-1.7.xml");
});


test("Load Inherited Profile (1.12.2 Forge)", async () => {
    const p = await linkProfile("Forge-1.12.2", getProfileContent);

    expect(p.id, "Should load ID").to.eq("Forge-1.12.2");
    expect(p.version, "Should infer version").to.eq("1.12.2");
    expect(p.assets, "Should load assets").to.eq("1.12");
    expect(p.mainClass, "Should load main class").to.eq("net.minecraft.launchwrapper.Launch");
    expect(p.downloads.client.sha1, "Should load client artifact details")
        .to.eq("0f275bc1547d01fa5f56ba34bdc87d981ee12daf");
    expect(p.arguments.game[0], "Should load arguments").to.eq("--username");
    expect(p.libraries[0].name, "Should load libraries").to.eq("net.minecraftforge:forge:1.12.2-14.23.5.2859");
    expect(p.logging?.client.file.id, "Should load logging configuration").to.eq("client-1.12.xml");
});

test("Load Inherited Profile (1.20.1 Fabric)", async () => {
    const p = await linkProfile("Fabric-1.20.1", getProfileContent);

    expect(p.id, "Should load ID").to.eq("Fabric-1.20.1");
    expect(p.version, "Should infer version").to.eq("1.20.1");
    expect(p.assets, "Should load assets").to.eq("5");
    expect(p.mainClass, "Should load main class").to.eq("net.fabricmc.loader.impl.launch.knot.KnotClient");
    expect(p.downloads.client.sha1, "Should load client artifact details")
        .to.eq("0c3ec587af28e5a785c0b4a7b8a30f9a8f78f838");
    expect(p.downloads.client_mappings?.sha1, "Should load client mappings")
        .to.eq("6c48521eed01fe2e8ecdadbd5ae348415f3c47da");
    expect(p.arguments.game[0], "Should load game arguments").to.eq("--username");
    expect(p.arguments.jvm[0], "Should load VM arguments").to.eq("-DFabricMcEmu= net.minecraft.client.main.Main ");
    expect(p.libraries[0].name, "Should load libraries").to.eq("org.ow2.asm:asm:9.6");
    expect(p.logging?.client.file.id, "Should load logging configuration").to.eq("client-1.12.xml");
});

test("Fail Circular Inheritance", async () => {
    await expect(linkProfile("Circular", getProfileContent), "Should reject circular inherited profile").to.eventually.be.rejected;
});