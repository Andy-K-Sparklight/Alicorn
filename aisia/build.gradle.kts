import com.github.gradle.node.pnpm.task.PnpmTask
import com.github.gradle.node.task.NodeTask

plugins {
    kotlin("jvm")
    id("com.github.node-gradle.node")
    id("org.teavm") version "0.10.0"
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    implementation(teavm.libs.jso)
    implementation(teavm.libs.jsoApis)
    implementation(project(":app"))
    implementation(project(":jsi"))
}

teavm {
    js {
        mainClass = "skjsjhb.a2.aisia.Main"
        targetFileName = "a2.js"
    }
}

tasks.register<NodeTask>("bundleAisiaJsDebug") {
    inputs.files(
        "esbuild.mjs",
        "package.json",
        "pnpm-lock.yaml",
        "tsconfig.json",
    )
    inputs.dir("src/main/js")
    script.set(file("esbuild.mjs"))
    args.set(listOf("debug"))
    outputs.dirs("build/esbuild/debug")
    dependsOn(":aisia:pnpmInstall")
}

tasks.register<NodeTask>("bundleAisiaJsRelease") {
    inputs.files(
        "esbuild.mjs",
        "package.json",
        "pnpm-lock.yaml",
        "tsconfig.json",
    )
    inputs.dir("src/main/js")
    script.set(file("esbuild.mjs"))
    args.set(listOf("release"))
    outputs.dirs("build/esbuild/release")
    dependsOn(":aisia:pnpmInstall")
}

tasks.register<Copy>("copyAisiaResourcesDebug") {
    from("src/main/resources")
    into("build/app/debug")
}

tasks.register<Copy>("copyAisiaResourcesRelease") {
    from("src/main/resources")
    into("build/app/release")
}

tasks.register<Copy>("assembleAisiaAppDebug") {
    from(
        "build/generated/teavm/js",
        "build/esbuild/debug",
        rootProject.file("ui/build/esbuild/debug"),
    )
    into("build/app/debug")
    dependsOn(
        ":aisia:copyAisiaResourcesDebug",
        ":aisia:bundleAisiaJsDebug",
        ":aisia:generateJavaScript",
        ":ui:bundleUiJsDebug"
    )
}

tasks.register<Copy>("assembleAisiaAppRelease") {
    from(
        "build/generated/teavm/js",
        "build/esbuild/release",
        rootProject.file("ui/build/esbuild/release")
    )
    into("build/app/release")
    dependsOn(
        ":aisia:copyAisiaResourcesRelease",
        ":aisia:bundleAisiaJsRelease",
        ":aisia:generateJavaScript",
        ":ui:bundleUiJsRelease"
    )
}

tasks.register<PnpmTask>("runAisiaAppDebug") {
    args.set(listOf("exec", "electron", "build/app/debug"))
    dependsOn(":aisia:assembleAisiaAppDebug")
}

tasks.register<PnpmTask>("runAisiaAppRelease") {
    args.set(listOf("exec", "electron", "build/app/release"))
    dependsOn(":aisia:assembleAisiaAppRelease")
}

tasks.named("clean") {
    doLast {
        delete("build")
    }
}

sourceSets.remove(sourceSets.getByName("teavm"))