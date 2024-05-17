package skjsjhb.a2.neko.impl.sys

import org.teavm.jso.JSBody
import skjsjhb.a2.spec.sys.AlicornRuntime
import kotlin.reflect.KClass

@JSBody(script = "Neutralino.app.exit();")
private external fun nExit()

class NekoRuntime : AlicornRuntime() {
    override fun <T : Any> getImplProc(what: KClass<out T>): T = ImplRegistry.get(what)

    override fun vendor(): String = "Neko (Alicorn NRT)"

    override fun exit() = nExit()
}