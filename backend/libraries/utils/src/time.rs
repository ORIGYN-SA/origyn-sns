use canister_time::timestamp_nanos;

pub fn get_current_day() -> u64 {
    return timestamp_nanos() / 86400 / 1_000_000_000;
}

pub fn fill_missing_days<T: Clone>(
    mut history: Vec<(u64, T)>,
    days: u64,
    default_data: T
) -> Vec<(u64, T)> {
    history.sort_by_key(|&(day, _)| day);

    let mut filled_history = Vec::new();
    let mut last_data: Option<&T> = None;
    let current_day = get_current_day();

    for day_offset in (0..=days).rev() {
        let day = current_day - day_offset;

        match history.iter().find(|&&(d, _)| d == day) {
            Some(&(_, ref data)) => {
                filled_history.push((day, data.clone()));
                last_data = Some(data);
            }
            None => {
                if let Some(data) = last_data {
                    filled_history.push((day, data.clone()));
                } else {
                    filled_history.push((day, default_data.clone()));
                }
            }
        }
    }

    filled_history
}
