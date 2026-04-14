#[macro_export]
macro_rules! impl_storable_minicbor {
    ($type:ty ) => {
        impl ic_stable_structures::storable::Storable for $type {
            fn to_bytes(&'_ self) -> std::borrow::Cow<'_, [u8]> {
                let mut buf = Vec::new();
                minicbor::encode(self, &mut buf).expect("minicbor encoding should always succeed");
                std::borrow::Cow::Owned(buf)
            }
            fn into_bytes(self) -> Vec<u8> {
                let mut buf = Vec::new();
                minicbor::encode(&self, &mut buf).expect("minicbor encoding should always succeed");
                buf
            }
            fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
                minicbor::decode(bytes.as_ref()).unwrap_or_else(|e| {
                    panic!(
                        "failed to decode minicbor bytes {}: {}",
                        hex::encode(&bytes),
                        e
                    )
                })
            }
            const BOUND: ic_stable_structures::storable::Bound =
                ic_stable_structures::storable::Bound::Unbounded;
        }
    };
}

/// Bounded variant — use for types stored in `StableBTreeMap`.
/// `$max_size` is the upper-bound on CBOR-encoded byte length.
#[macro_export]
macro_rules! impl_storable_minicbor_bounded {
    ($type:ty, $max_size:expr) => {
        impl ic_stable_structures::storable::Storable for $type {
            fn to_bytes(&'_ self) -> std::borrow::Cow<'_, [u8]> {
                let mut buf = Vec::new();
                minicbor::encode(self, &mut buf).expect("minicbor encoding should always succeed");
                std::borrow::Cow::Owned(buf)
            }
            fn into_bytes(self) -> Vec<u8> {
                let mut buf = Vec::new();
                minicbor::encode(&self, &mut buf).expect("minicbor encoding should always succeed");
                buf
            }
            fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
                minicbor::decode(bytes.as_ref()).unwrap_or_else(|e| {
                    panic!(
                        "failed to decode minicbor bytes {}: {}",
                        hex::encode(&bytes),
                        e
                    )
                })
            }
            const BOUND: ic_stable_structures::storable::Bound =
                ic_stable_structures::storable::Bound::Bounded {
                    max_size: $max_size,
                    is_fixed_size: false,
                };
        }
    };
}
