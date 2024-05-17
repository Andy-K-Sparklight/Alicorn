package skjsjhb.a2.jsi.json

import org.teavm.jso.JSBody
import org.teavm.jso.JSObject
import skjsjhb.a2.spec.json.*

class JsonImpl : Json {
    override fun parse(src: String): JsonValue = nJsonParse(src).toJsonValue()

    override fun stringify(obj: JsonValue): String = nJsonStringify(obj.toJsValue())

    override fun newObject(): JsonObject = nNewObject().toJsonValue().asObject()

    override fun newArray(): JsonArray = nNewArray().toJsonValue().asArray()

    override fun newPrimitive(value: Number): JsonPrimitive = nullValue().apply { set(value) }

    override fun newPrimitive(value: Boolean): JsonPrimitive = nullValue().apply { set(value) }

    override fun newPrimitive(value: String): JsonPrimitive = nullValue().apply { set(value) }

    override fun nullValue(): JsonPrimitive = JsonPrimitiveImpl(null)
}

@JSBody(script = "return [];")
private external fun nNewArray(): JSObject

@JSBody(script = "return {};")
private external fun nNewObject(): JSObject

@JSBody(params = ["o"], script = "return JSON.stringify(o);")
private external fun nJsonStringify(obj: Any?): String

@JSBody(params = ["s"], script = "return JSON.parse(s);")
private external fun nJsonParse(src: String): Any?