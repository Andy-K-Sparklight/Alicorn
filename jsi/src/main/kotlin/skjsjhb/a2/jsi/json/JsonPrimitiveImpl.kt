package skjsjhb.a2.jsi.json

import org.teavm.jso.core.JSBoolean
import org.teavm.jso.core.JSNumber
import org.teavm.jso.core.JSString
import org.teavm.jso.core.JSUndefined
import skjsjhb.a2.spec.json.JsonPrimitive
import java.util.*

class JsonPrimitiveImpl(var value: Any?) : JsonPrimitive {
    override fun isBoolean(): Boolean = value is JSBoolean

    override fun asBoolean(): Boolean = (value as JSBoolean).booleanValue()

    override fun isString(): Boolean = value is JSString

    override fun asString(): String = (value as JSString).stringValue()

    override fun isNumber(): Boolean = value is JSNumber

    override fun asNumber(): Number = (value as JSNumber).doubleValue()

    override fun set(v: Boolean) {
        value = JSBoolean.valueOf(v)
    }

    override fun set(v: String) {
        value = JSString.valueOf(v)
    }

    override fun set(v: Number) {
        value = JSNumber.valueOf(v.toDouble())
    }

    override fun setNull() {
        value = null
    }

    override fun setUndefined() {
        value = JSUndefined.instance()
    }

    override fun isNull(): Boolean = value == null

    override fun isUndefined(): Boolean = value is JSUndefined

    override fun equals(other: Any?): Boolean = other is JsonPrimitiveImpl && value == other.value

    override fun hashCode(): Int = Objects.hashCode(value)
}