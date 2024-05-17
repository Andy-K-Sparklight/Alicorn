package skjsjhb.a2.app

import skjsjhb.a2.spec.io.IOUtils
import java.io.StringReader
import java.io.StringWriter
import java.util.*

const val DEFAULT_CONFIG_FILE = "a2.properties"

const val CONFIG_COMMENT = "Alicorn configuration file V2\nCAUTION: RISK OF IMPROPER CHANGES"

/**
 * The configuration class for the application.
 *
 * Alicorn uses properties file to store data and wraps it with several accessors.
 */
class Config(private val props: Properties) {
    /**
     * Loads properties from given path.
     */
    constructor(vararg path: String) : this(Properties()) {
        props.load(StringReader(IOUtils.get().readString(*path)))
    }

    /**
     * Loads the default properties.
     */
    constructor() : this(IOUtils.get().resolveData(DEFAULT_CONFIG_FILE))

    /**
     * Saves the configuration at the given path.
     */
    fun save(vararg path: String) {
        StringWriter().use {
            props.store(it, CONFIG_COMMENT)
            IOUtils.get().writeString(it.buffer.toString(), *path)
        }
    }

    /**
     * Saves the configuration at the default path.
     */
    fun save() = save(IOUtils.get().resolveData(DEFAULT_CONFIG_FILE))
}