package skjsjhb.a2.aisia.impl.sys

import org.teavm.jso.JSBody
import skjsjhb.a2.spec.sys.SystemInfo

@JSBody(script = "return $.System.getOsName();")
private external fun nGetOsName(): String

@JSBody(script = "return $.System.getOsVersion();")
private external fun nGetOsVersion(): String

@JSBody(script = "return $.System.getOsArch();")
private external fun nGetOsArch(): String

class SystemInfoImpl : SystemInfo {
    override fun name(): String = nGetOsName()

    override fun version(): String = nGetOsVersion()

    override fun arch(): String = nGetOsArch()

    override fun isArm(): Boolean = arch() == "arm64"
}