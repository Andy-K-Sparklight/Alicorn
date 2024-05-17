package skjsjhb.a2.aisia.impl.sys

import kotlin.reflect.KClass

object ImplRegistry {
    val registry: MutableMap<KClass<*>, Any> = mutableMapOf()

    inline fun <reified T : Any> add(impl: T) {
        registry[T::class] = impl
    }

    // This cannot be made reified as the super method cannot be inlined
    @Suppress("UNCHECKED_CAST")
    fun <T : Any> get(spec: KClass<out T>): T = registry[spec] as T?
        ?: throw UnsupportedOperationException("No implementation available for ${spec.java.name}")
}