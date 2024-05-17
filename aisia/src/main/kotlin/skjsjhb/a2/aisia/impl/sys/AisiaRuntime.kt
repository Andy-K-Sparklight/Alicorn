package skjsjhb.a2.aisia.impl.sys

import org.teavm.jso.JSBody
import skjsjhb.a2.spec.sys.AlicornRuntime
import kotlin.reflect.KClass

@JSBody(script = "$.quit();")
private external fun nExit()

class AisiaRuntime : AlicornRuntime() {
    override fun <T : Any> getImplProc(what: KClass<out T>): T = ImplRegistry.get(what)

    override fun vendor(): String = "Aisia (Alicorn ERT)"

    override fun exit() = nExit()
}