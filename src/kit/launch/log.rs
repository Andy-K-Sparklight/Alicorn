use std::cmp::min;

use serde::Deserialize;

/// A game log entry.
#[derive(Debug)]
pub struct LogRecord {
    pub index: usize,
    pub time_ms: i64,
    pub logger: String,
    pub level: String,
    pub thread: String,
    pub message: String,
    pub throwable: Option<String>,
}

impl LogRecord {
    /// Parses one or more log entries permissively.
    ///
    /// If the supplied value contains valid log4j XML events, it's parsed
    /// structurally. Otherwise, this method treats the entire input as one raw
    /// log message, and derives corresponding fields based on best-effort
    /// guesses.
    ///
    /// The exact output of this method is completely unspecified and should
    /// only be used at most for displaying and heuristic-based recognition
    /// (e.g. LAN server started). It's not intended to be machine-parsable.
    pub fn parse(input: &str, first_index: usize, fallback_time_ms: i64) -> Vec<Self> {
        if input.trim_start().starts_with('<')
            && let Ok(events) = quick_xml::de::from_str::<Vec<XmlNode>>(input)
        {
            let mut index = first_index;
            return events
                .into_iter()
                .filter_map(|event| {
                    let XmlNode::Event(event) = event else {
                        return None;
                    };
                    let record = Self {
                        index,
                        time_ms: event.timestamp.trim().parse().unwrap_or(0),
                        logger: event.logger.trim().to_owned(),
                        level: event.level.trim().to_owned(),
                        thread: event.thread.trim().to_owned(),
                        message: event.message.trim().to_owned(),
                        throwable: event.throwable.map(|text| text.trim().to_owned()),
                    };
                    // Saturating add loses order upon overflow but won't cause panic.
                    // OK, but how is it even possible for usize::MAX logs to be produced?
                    index = index.saturating_add(1);
                    Some(record)
                })
                .collect();
        }

        vec![Self {
            index: first_index,
            time_ms: fallback_time_ms,
            logger: "Unknown".to_owned(), // XXX: Best-effort detection?
            level: guess_log_level(input).to_owned(),
            thread: "Unknown".to_owned(),
            message: input.trim().to_owned(),
            throwable: None,
        }]
    }
}

/// Attempts to extract the log level from the message by looking at a short
/// header slice of it.
fn guess_log_level(msg: &str) -> &'static str {
    ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"]
        .iter()
        .find(|level| {
            msg.as_bytes()[..min(20, msg.len())]
                .windows(level.len())
                .any(|window| window.eq_ignore_ascii_case(level.as_bytes())) // Comparison is valid as level names are ASCII-only
        })
        .unwrap_or(&"INFO")
}

/// An event or an unrelated XML element in the fragment collection.
#[derive(Deserialize)]
enum XmlNode {
    Event(LogEvent),

    #[serde(other)]
    Unknown,
}

/// Log4j attributes and text before conversion to a log record.
#[derive(Deserialize)]
struct LogEvent {
    #[serde(rename = "@timestamp", default)]
    timestamp: String,
    #[serde(rename = "@logger", default)]
    logger: String,
    #[serde(rename = "@level", default = "LogEvent::default_level")]
    level: String,
    #[serde(rename = "@thread", default)]
    thread: String,
    #[serde(rename = "Message", default)]
    message: String,
    #[serde(rename = "Throwable", default)]
    throwable: Option<String>,
}

impl LogEvent {
    /// Returns the level for XML events without a level attribute.
    fn default_level() -> String { "INFO".to_owned() }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Multiple XML events decode escaped attributes, text, CDATA, and
    /// throwable content.
    #[test]
    fn log_record_parse_xml_fields() {
        let input = r#"
            <log4j:Event logger="main&amp;game" timestamp="1234" level="WARN" thread="worker&quot;1">
                <log4j:Message> Loading &lt;世界&gt; &#33; </log4j:Message>
                <log4j:Throwable> Failure &amp; detail </log4j:Throwable>
            </log4j:Event>
            <log4j:Other/>
            <log4j:Event timestamp="5678">
                <log4j:Message><![CDATA[raw <message>]]></log4j:Message>
            </log4j:Event>
        "#;
        let records = LogRecord::parse(input, 9, 99);
        assert_eq!(records.len(), 2, "Both XML events should be returned");
        let first = &records[0];
        assert_eq!(first.index, 9, "Indices should start at the supplied index");
        assert_eq!(first.time_ms, 1234, "XML timestamps should be preserved");
        assert_eq!(first.logger, "main&game", "Logger entities should decode");
        assert_eq!(first.level, "WARN", "XML levels should be preserved");
        assert_eq!(first.thread, "worker\"1", "Thread entities should decode");
        assert_eq!(
            first.message, "Loading <世界> !",
            "Message entities should decode and surrounding whitespace should trim"
        );
        assert_eq!(
            first.throwable.as_deref(),
            Some("Failure & detail"),
            "Throwable entities should decode"
        );
        let second = &records[1];
        assert_eq!(second.index, 10, "Event indices should advance");
        assert_eq!(
            second.time_ms, 5678,
            "Each event should retain its timestamp"
        );
        assert_eq!(second.level, "INFO", "Missing XML levels should use INFO");
        assert_eq!(second.message, "raw <message>", "CDATA should remain text");
        assert!(
            second.throwable.is_none(),
            "Absent throwables should be None"
        );
    }

    /// Unprefixed events and alternate namespaces match the same local names.
    #[test]
    fn log_record_parse_xml_local_names() {
        for input in [
            "<Event><Message>hello</Message></Event>",
            "<Event xmlns=\"urn:test\"><Message>hello</Message></Event>",
            "<other:Event \
             xmlns:other=\"urn:test\"><other:Message>hello</other:Message></other:Event>",
        ] {
            let records = LogRecord::parse(input, 0, 42);
            assert_eq!(records.len(), 1, "Each event should produce one record");
            assert_eq!(
                records[0].message, "hello",
                "Local names should select event text"
            );
        }
    }

    /// Raw text and incomplete or mismatched XML preserve the input using
    /// fallback metadata.
    #[test]
    fn log_record_parse_raw_fallback() {
        for input in [
            "  info then ERROR and fatal\n",
            "  plain output  ",
            "<log4j:Event level=\"WARN\"><log4j:Message>broken",
            "<log4j:Event><log4j:Message>error</log4j:Event>",
            "<log4j:Event/><log4j:Event><log4j:Message>broken",
            "<log4j:Event><log4j:Message>&custom;</log4j:Message></log4j:Event>",
        ] {
            let records = LogRecord::parse(input, 7, 42);
            assert_eq!(records.len(), 1, "Raw input should produce one record");
            let record = &records[0];
            assert_eq!(record.index, 7, "Raw records should use the supplied index");
            assert_eq!(
                record.time_ms, 42,
                "Raw records should use the fallback time"
            );
            assert_eq!(record.message, input.trim(), "Raw text should be trimmed");
            assert!(
                record.throwable.is_none(),
                "Raw records should have no throwable"
            );
        }
    }
}
