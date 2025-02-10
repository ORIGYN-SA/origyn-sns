use crate::{ generate_query_call, generate_update_call };

use collection_index_api::queries::{
    get_categories,
    get_collections,
    search_collections,
    get_user_collections,
    get_collection_by_principal,
};
use collection_index_api::updates::{
    insert_category,
    insert_collection,
    set_category_visibility,
    update_collection,
    remove_collection,
    insert_fake_collection,
    toggle_promoted,
};

generate_query_call!(get_collections);
generate_query_call!(get_categories);
generate_query_call!(search_collections);
generate_update_call!(insert_category);
generate_update_call!(insert_collection);
generate_update_call!(set_category_visibility);
generate_update_call!(update_collection);
generate_update_call!(remove_collection);
generate_update_call!(insert_fake_collection);
generate_update_call!(get_user_collections);
generate_query_call!(get_collection_by_principal);
generate_update_call!(toggle_promoted);
