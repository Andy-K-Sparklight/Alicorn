package skjsjhb.a2.neko.impl.sys

import org.teavm.jso.JSBody
import org.teavm.jso.core.JSPromise
import org.teavm.jso.core.JSString
import skjsjhb.a2.jsi.await
import skjsjhb.a2.spec.sys.SystemInfo

@JSBody(script = "return $.getOsName();")
private external fun nGetOsNameAsync(): JSPromise<JSString>

@JSBody(script = "return $.getOsVersion();")
private external fun nGetOsVersionAsync(): JSPromise<JSString>

@JSBody(script = "return $.getOsArch();")
private external fun nGetOsArchAsync(): JSPromise<JSString>

class SystemInfoImpl : SystemInfo {
    override fun name(): String {
        val rawName = nGetOsNameAsync().await().stringValue().lowercase()
        if (listOf("win32", "windows").any { rawName.contains(it) }) {
            return "windows"
        }
        if (listOf("apple", "mac", "osx").any { rawName.contains(it) }) {
            return "osx"
        }
        return "linux"
    }

    override fun version(): String = nGetOsVersionAsync().await().stringValue()

    override fun arch(): String = nGetOsArchAsync().await().stringValue()

    override fun isArm(): Boolean = arch() == "arm"
}