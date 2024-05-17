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
        mainClass = "skjsjhb.a2.neko.Main"
        targetFileName = "a2.js"
    }
}

tasks.register<NodeTask>("bundleNekoJsDebug") {
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
    dependsOn(":neko:pnpmInstall")
}

tasks.register<NodeTask>("bundleNekoJsRelease") {
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
    dependsOn(":neko:pnpmInstall")
}

val neuLocation = project.file(".gradle/neu")

tasks.register<PnpmTask>("setupTemporalNeu") {
    args.set(listOf("neu", "create", neuLocation.canonicalPath))
    outputs.dir(neuLocation)
    dependsOn(":neko:pnpmInstall")
}

tasks.register<Copy>("copyNekoResourcesDebug") {
    from("src/main/resources")
    into("build/app/debug")
}

tasks.register<Copy>("copyNekoResourcesRelease") {
    from("src/main/resources")
    into("build/app/release")
}

tasks.register<Copy>("copyNeuBinariesDebug") {
    from(File(neuLocation, "bin"))
    into("build/app/debug/bin")
    dependsOn(":neko:setupTemporalNeu")
}

tasks.register<Copy>("copyNeuBinariesRelease") {
    from(File(neuLocation, "bin"))
    into("build/app/release/bin")
    dependsOn(":neko:setupTemporalNeu")
}

tasks.register<Copy>("copyNeuJsDebug") {
    from(File(neuLocation, "resources/js/neutralino.js"))
    into("build/app/debug")
    dependsOn(":neko:setupTemporalNeu")
}

tasks.register<Copy>("copyNeuJsRelease") {
    from(File(neuLocation, "resources/js/neutralino.js"))
    into("build/app/release")
    dependsOn(":neko:setupTemporalNeu")
}

tasks.register<Copy>("assembleNekoAppDebug") {
    from(
        "build/generated/teavm/js",
        "build/esbuild/debug",
        rootProject.file("ui/build/esbuild/debug")
    )
    into("build/app/debug")
    dependsOn(
        ":neko:copyNekoResourcesDebug",
        ":neko:bundleNekoJsDebug",
        ":neko:generateJavaScript",
        ":neko:copyNeuBinariesDebug",
        ":neko:copyNeuJsDebug",
        ":ui:bundleUiJsDebug"
    )
}

tasks.register<Copy>("assembleNekoAppRelease") {
    from(
        "build/generated/teavm/js",
        "build/esbuild/release",
        rootProject.file("ui/build/esbuild/release")
    )
    into("build/app/release")
    dependsOn(
        ":neko:copyNekoResourcesRelease",
        ":neko:bundleNekoJsRelease",
        ":neko:generateJavaScript",
        ":neko:copyNeuBinariesRelease",
        ":neko:copyNeuJsRelease",
        ":ui:bundleUiJsRelease"
    )
}

tasks.register<NodeTask>("runNekoAppDebug") {
    workingDir.set(file("build/app/debug"))
    script.set(file("node_modules/@neutralinojs/neu/bin/neu.js"))
    args.set(listOf("run"))
    dependsOn(":neko:assembleNekoAppDebug")
}

tasks.register<NodeTask>("runNekoAppRelease") {
    workingDir.set(file("build/app/release"))
    script.set(file("node_modules/@neutralinojs/neu/bin/neu.js"))
    args.set(listOf("run"))
    dependsOn(":neko:assembleNekoAppRelease")
}

tasks.named("clean") {
    doLast {
        delete("build")
    }
}

sourceSets.remove(sourceSets.getByName("teavm"))