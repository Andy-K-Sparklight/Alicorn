use core::fmt::Formatter;

use serde::Deserialize;
use serde::de::MapAccess;
use serde::de::SeqAccess;
use serde::de::Visitor;
use serde::de::value::MapAccessDeserializer;
use serde::de::value::SeqAccessDeserializer;

use super::ArgValue;
use super::GatedArg;
use super::LaunchArg;

/// Selects [`LaunchArg`] based on whether the source type is a string or an
/// object.
pub(super) struct LaunchArgVis;

impl<'de> Visitor<'de> for LaunchArgVis {
    type Value = LaunchArg;

    fn expecting(&self, formatter: &mut Formatter<'_>) -> core::fmt::Result {
        formatter.write_str("a plain argument string or a gated argument object")
    }

    fn visit_str<E: serde::de::Error>(self, value: &str) -> Result<Self::Value, E> {
        Ok(LaunchArg::Literal(value.to_owned()))
    }

    fn visit_string<E: serde::de::Error>(self, value: String) -> Result<Self::Value, E> {
        Ok(LaunchArg::Literal(value))
    }

    fn visit_map<A: MapAccess<'de>>(self, map: A) -> Result<Self::Value, A::Error> {
        GatedArg::deserialize(MapAccessDeserializer::new(map)).map(LaunchArg::Gated)
    }
}

/// Selects [`ArgValue`] based on whether the source type is a string or an
/// array.
pub(super) struct ArgValueVis;

impl<'de> Visitor<'de> for ArgValueVis {
    type Value = ArgValue;

    fn expecting(&self, formatter: &mut Formatter<'_>) -> core::fmt::Result {
        formatter.write_str("an argument string or an array of that")
    }

    fn visit_str<E: serde::de::Error>(self, value: &str) -> Result<Self::Value, E> {
        Ok(ArgValue::Single(value.to_owned()))
    }

    fn visit_string<E: serde::de::Error>(self, value: String) -> Result<Self::Value, E> {
        Ok(ArgValue::Single(value))
    }

    fn visit_seq<A: SeqAccess<'de>>(self, sequence: A) -> Result<Self::Value, A::Error> {
        let args = Vec::deserialize(SeqAccessDeserializer::new(sequence))?;
        Ok(ArgValue::Multiple(args))
    }
}
