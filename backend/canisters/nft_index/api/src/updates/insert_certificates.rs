use crate::{ certificate::Certificate, errors::InsertCertificateError };

pub type Args = Certificate;
pub type Response = Result<bool, InsertCertificateError>;
