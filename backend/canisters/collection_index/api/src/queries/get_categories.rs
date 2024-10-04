use crate::category::{ Category, CategoryID };

pub type Args = ();
pub type Response = Result<Vec<(CategoryID, Category)>, ()>;
