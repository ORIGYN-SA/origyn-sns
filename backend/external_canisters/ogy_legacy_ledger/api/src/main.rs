use candid_gen::generate_candid_method;

#[allow(deprecated)]
fn main() {
    // query calls
    generate_candid_method!(ogy_legacy_ledger, name, query);

    // update calls
    generate_candid_method!(ogy_legacy_ledger, transfer, update);

    candid::export_service!();
    std::print!("{}", __export_service());
}
