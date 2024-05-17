package skjsjhb.a2.neko.impl.io

import org.teavm.jso.JSBody
import org.teavm.jso.JSByRef
import org.teavm.jso.core.JSArray
import org.teavm.jso.core.JSPromise
import org.teavm.jso.core.JSString
import skjsjhb.a2.jsi.asArray
import skjsjhb.a2.jsi.await
import skjsjhb.a2.spec.io.IOUtils

class IOUtilsImpl : IOUtils {
    override fun read(vararg path: String): ByteArray = nRead(nResolvePath(path)).await().asArray()

    override fun write(src: ByteArray, vararg path: String) {
        nWrite(src, nResolvePath(path)).await()
    }

    override fun resolve(vararg path: String): String = nResolvePath(path)

    override fun cwd(): String = nCwd()

    override fun resourcesRoot(): String = nGetAppPath()

    override fun dataRoot(): String = nGetDataRoot().await().stringValue()
}

@JSBody(params = ["p"], script = "return $.IO.read(p);")
private external fun nRead(path: String): JSPromise<JSArray<Byte>>

@JSBody(params = ["s", "p"], script = "return $.IO.write(p,s);")
private external fun nWrite(@JSByRef src: ByteArray, path: String): JSPromise<Any?>

@JSBody(script = "return NL_CWD;")
private external fun nCwd(): String

@JSBody(params = ["p"], script = "return $.IO.resolvePath(p);")
private external fun nResolvePath(paths: Array<out String>): String

@JSBody(script = "return NL_PATH;")
private external fun nGetAppPath(): String

@JSBody(script = "return $.IO.getDataRoot();")
private external fun nGetDataRoot(): JSPromise<JSString>