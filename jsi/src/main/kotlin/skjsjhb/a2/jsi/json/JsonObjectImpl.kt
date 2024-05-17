package skjsjhb.a2.jsi.json

import org.teavm.jso.JSBody
import org.teavm.jso.JSObject
import org.teavm.jso.core.JSArray
import skjsjhb.a2.jsi.get
import skjsjhb.a2.jsi.remove
import skjsjhb.a2.jsi.set
import skjsjhb.a2.jsi.toList
import skjsjhb.a2.spec.json.JsonObject
import skjsjhb.a2.spec.json.JsonValue

class JsonObjectImpl(val obj: JSObject) : JsonObject {
    override fun get(key: String): JsonValue = obj.get(key).toJsonValue()

    override fun put(key: String, value: JsonValue) = obj.set(key, value.toJsValue())

    override fun remove(key: String) = obj.remove(key)

    override fun keys(): List<String> = nEnumerateEntries(obj).toList()

    override fun isNull(): Boolean = false

    override fun isUndefined(): Boolean = false

    override fun equals(other: Any?): Boolean = other is JsonObjectImpl && obj == other.obj

    override fun hashCode(): Int = obj.hashCode()
}

@JSBody(params = ["o"], script = "return Object.keys(o);")
private external fun nEnumerateEntries(obj: JSObject): JSArray<String>