package skjsjhb.a2.spec.io

import skjsjhb.a2.spec.sys.AlicornRuntime

/**
 * I/O related methods.
 */
interface IOUtils {
    companion object {
        /**
         * Gets an instance using [AlicornRuntime.getImplProc].
         */
        fun get(): IOUtils = AlicornRuntime.getImplProc<IOUtils>()
    }

    /**
     * Reads the content of the given file.
     *
     * @param path A list of path segments to be joined to reach the file.
     */
    fun read(vararg path: String): ByteArray

    /**
     * String version of [read].
     */
    fun readString(vararg path: String): String = String(read(*path))

    /**
     * Writes the content to given file.
     *
     * Parent folders are created automatically if necessary.
     *
     * @param path A list of path segments to be joined to reach the file.
     */
    fun write(src: ByteArray, vararg path: String)

    /**
     * String version of [write].
     */
    fun writeString(src: String, vararg path: String) = write(src.toByteArray(), *path)

    /**
     * Resolve the given path segments.
     */
    fun resolve(vararg path: String): String

    /**
     * Gets the current working directory.
     */
    fun cwd(): String

    /**
     * Gets the root path to the application resources.
     */
    fun resourcesRoot(): String

    /**
     * Gets the root path to the application data files.
     */
    fun dataRoot(): String

    /**
     * Resolves path segments against the application resources root.
     */
    fun resolveResource(vararg path: String): String = resolve(resourcesRoot(), *path)

    /**
     * Resolves path segments against the application data root.
     */
    fun resolveData(vararg path: String): String = resolve(dataRoot(), *path)
}
