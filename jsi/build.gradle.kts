plugins {
    kotlin("jvm")
    id("org.teavm") version "0.10.0"
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    implementation(teavm.libs.jso)
    implementation(teavm.libs.jsoApis)
    implementation(project(":app"))
}


sourceSets.remove(sourceSets.getByName("teavm"))