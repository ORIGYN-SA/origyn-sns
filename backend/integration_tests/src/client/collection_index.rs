use crate::{ generate_query_call, generate_update_call };

use collection_index_api::queries::{ get_categories, get_collections };
use collection_index_api::updates::{
    insert_category,
    insert_collection,
    set_category_hidden,
    update_collection_category,
    remove_collection,
};

generate_query_call!(get_collections);
generate_query_call!(get_categories);
generate_update_call!(insert_category);
generate_update_call!(insert_collection);
generate_update_call!(set_category_hidden);
generate_update_call!(update_collection_category);
generate_update_call!(remove_collection);
