use super::storage::integrity::HashAlgo;
use super::storage::integrity::HashProvider;
use super::storage::integrity::hasher_of;

/// Credentials supplied to a Minecraft game process.
pub struct Credentials {
    pub player_name: String,
    pub uuid: String,
    pub access_token: String,
    pub xbox_id: String,
    pub user_type: String,
}

impl Credentials {
    /// Generates (possibly invalid) minimal [`Credentials`] for the given
    /// player name.
    pub fn of_name(name: &str) -> Self {
        Self {
            player_name: name.to_owned(),
            uuid: offline_uuid(name),
            access_token: "0".to_owned(),
            xbox_id: "0".to_owned(),
            user_type: "mojang".to_owned(),
        }
    }
}

/// Generates a Spigot-compatible UUID from an offline player name. Value is
/// lowercase and unhyphenated.
///
/// Spigot creates the UUID using Java's `nameUUIDFromBytes` on `OfflinePlayer:`
/// plus the player name, which runs an MD5 hash over the bytes and turns it
/// into a version 3 UUID.
///
/// This method is convenient for creating a unique UUID for an identity with at
/// most only the name can be known. However, it's really easy to misuse the
/// result:
/// - The UUID changes alongside the player name, which is probably not desired
///   for singleplayer worlds. To establish an offline profile, generate one
///   persistent UUID instead.
/// - Servers calculate their UUIDs of offline players, rendering the alignment
///   of this method less necessary.
/// - The generated UUID is unlikely to match the Mojang version, which can
///   cause confusion.
pub fn offline_uuid(name: &str) -> String {
    let mut hasher = hasher_of(HashAlgo::Md5);
    hasher.update(b"OfflinePlayer:");
    hasher.update(name.as_bytes());
    hasher.digest_with(|digest| {
        digest[6] = (digest[6] & 0x0f) | 0x30; // Version 3
        digest[8] = (digest[8] & 0x3f) | 0x80; // IETF
        faster_hex::hex_string(&*digest)
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// ASCII and Unicode names produce UUIDs matching independently computed
    /// MD5 vectors.
    #[test]
    fn offline_uuid_vectors() {
        for (name, expected) in [
            ("Notch", "b50ad385829d3141a2167e7d7539ba7f"),
            ("Steve", "5627dd98e6be3c21b8a8e92344183641"),
            ("🈲", "2f705594767a3426aa128bb4e816a470"),
        ] {
            assert_eq!(
                offline_uuid(name),
                expected,
                "Offline UUIDs should match the expected"
            );
        }
    }

    /// Offline credentials preserve the supplied name and use the offline token
    /// and type.
    #[test]
    fn named_credentials_fields() {
        let credentials = Credentials::of_name("Notch");
        assert_eq!(
            credentials.player_name, "Notch",
            "The player name should be preserved exactly"
        );
        assert!(!credentials.uuid.is_empty(), "Generated UUID should exist");
        assert!(
            !credentials.access_token.is_empty(),
            "Generated token should exist"
        );
        assert!(
            !credentials.xbox_id.is_empty(),
            "Generated XUID should exist"
        );
        assert!(
            !credentials.user_type.is_empty(),
            "Generated user type should exist"
        );
    }
}
