use ic_cdk::update;

use ogy_token_swap_api::update_whitelist::UpdateWhitelistCommand;

pub use ogy_token_swap_api::updates::update_whitelist::{
    Args as UpdateWhitelistArgs, Response as UpdateWhitelistResponse,
};

use crate::{guards::caller_is_authorised_principal, state::mutate_state};

// only to be used for integration testing
#[update(guard = "caller_is_authorised_principal", hidden = true)]
pub async fn update_whitelist(args: UpdateWhitelistArgs) -> UpdateWhitelistResponse {
    update_whitelist_impl(args.command).await
}

async fn update_whitelist_impl(command: UpdateWhitelistCommand) -> Result<String, String> {
    mutate_state(|s| match command {
        UpdateWhitelistCommand::Add(principal) => {
            if s.data.whitelisted_principals.insert(principal) {
                Ok("Whitelist updated successfully".to_string())
            } else {
                Err("Principal was already in the whitelist".to_string())
            }
        }
        UpdateWhitelistCommand::Remove(principal) => {
            if s.data.whitelisted_principals.remove(&principal) {
                Ok("Principal removed successfully".to_string())
            } else {
                Err("Principal was not found in the whitelist".to_string())
            }
        }
    })
}
