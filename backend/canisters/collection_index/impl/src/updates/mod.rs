pub mod add_authorised_principal;
pub mod insert_category;
pub mod insert_collection;
pub mod remove_collection;
pub mod remove_category;
pub mod set_category_visibility;
pub mod update_collection_category;
pub mod insert_fake_collection;
pub mod toggle_promoted;

pub use add_authorised_principal::*;
pub use insert_category::*;
pub use insert_collection::*;
pub use remove_collection::*;
pub use remove_category::*;
pub use set_category_visibility::*;
pub use update_collection_category::*;
pub use insert_fake_collection::*;
pub use toggle_promoted::*;