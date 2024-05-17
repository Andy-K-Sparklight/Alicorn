package skjsjhb.a2.jsi.json

import org.teavm.jso.JSObject
import org.teavm.jso.core.*
import skjsjhb.a2.spec.json.JsonValue

fun JsonValue.toJsValue(): Any? = when (this) {
    is JsonArrayImpl -> array
    is JsonObjectImpl -> obj
    is JsonPrimitiveImpl -> value
    else -> null
}

@Suppress("UNCHECKED_CAST")
fun Any?.toJsonValue(): JsonValue = when (this) {
    null -> JsonPrimitiveImpl(null)
    is JSString -> JsonPrimitiveImpl(this)
    is JSNumber -> JsonPrimitiveImpl(this)
    is JSBoolean -> JsonPrimitiveImpl(this)
    is JSUndefined -> JsonPrimitiveImpl(JSUndefined.instance())
    is JSArray<*> -> JsonArrayImpl(this as JSArray<Any?>)
    is JSObject -> JsonObjectImpl(this)
    else -> throw UnsupportedOperationException("Cannot wrap $this as JSON object")
}