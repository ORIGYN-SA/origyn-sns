use bity_ic_types::BuildVersion;
use utils::env::CanisterEnv;

use crate::state::NeuronManagers;
use crate::state::RuntimeState;
use crate::types::icp_neuron_manager::IcpManager;
use crate::types::GoldaoManager;
use crate::types::WtnManager;

use self::types::state::RuntimeStateV0;
use crate::state::Data;

pub mod types;

impl From<RuntimeStateV0> for RuntimeState {
    fn from(old_state: RuntimeStateV0) -> Self {
        Self {
            env: CanisterEnv::new(
                old_state.env.is_test_mode(),
                BuildVersion::default(),
                "".to_string(),
            ),
            data: Data {
                authorized_principals: old_state.data.authorized_principals,
                rewards_destination: old_state.data.rewards_destination,
                neuron_managers: NeuronManagers {
                    now: old_state.data.neuron_managers.now,
                    goldao: GoldaoManager::default(),
                    wtn: WtnManager::default(),
                    icp: IcpManager::default(),
                },
            },
        }
    }
}
