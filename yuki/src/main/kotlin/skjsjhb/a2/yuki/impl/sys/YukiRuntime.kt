package skjsjhb.a2.yuki.impl.sys

import skjsjhb.a2.spec.sys.AlicornRuntime
import kotlin.reflect.KClass

class YukiRuntime : AlicornRuntime() {
    override fun <T : Any> getImplProc(what: KClass<out T>): T {
        TODO("Not yet implemented")
    }

    override fun vendor(): String {
        TODO("Not yet implemented")
    }

    override fun exit() {
        TODO("Not yet implemented")
    }
}