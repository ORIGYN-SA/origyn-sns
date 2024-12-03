use crate::category::Category;

pub type Args = ();
pub type Response = Result<Vec<(String, Category)>, ()>;
