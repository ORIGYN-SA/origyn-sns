use collection_index_api::errors::InsertCategoryError;
use collection_index_api::get_collections::GetCollectionsArgs;
use collection_index_api::insert_category::InsertCategoryArgs;
use collection_index_api::insert_collection::InsertCollectionArgs;
use collection_index_api::remove_collection::RemoveCollectionArgs;
use collection_index_api::set_category_visibility::{
    Args as SetCategoryVisibilityArgs,
    Response as SetCategoryVisibilityResponse,
};
use collection_index_api::update_collection::UpdateCollectionArgs;

use crate::client::collection_index::{
    get_categories,
    get_collections,
    insert_category,
    insert_collection,
    remove_collection,
    set_category_visibility,
    update_collection,
};
use crate::collection_index_suite::{ init::init, TestEnv };

#[test]
fn insert_a_category_works() {
    let env = init();
    let TestEnv { mut pic, canister_ids, principal_ids } = env;

    let colletion_canister = canister_ids.collection_index;

    // Insert a new category, "Category A"
    assert_eq!(
        insert_category(
            &mut pic,
            principal_ids.controller,
            colletion_canister,
            &(InsertCategoryArgs {
                category_name: "Category A".to_string(),
            })
        ).unwrap(),
        ()
    );
}

#[test]
fn inserting_a_duplicate_category_should_fail() {
    let env = init();
    let TestEnv { mut pic, canister_ids, principal_ids } = env;

    let colletion_canister = canister_ids.collection_index;

    // Insert a new category, "Category A"
    assert_eq!(
        insert_category(
            &mut pic,
            principal_ids.controller,
            colletion_canister,
            &(InsertCategoryArgs {
                category_name: "Category A".to_string(),
            })
        ).unwrap(),
        ()
    );

    let res = insert_category(
        &mut pic,
        principal_ids.controller,
        colletion_canister,
        &(InsertCategoryArgs {
            category_name: "Category A".to_string(),
        })
    );
    matches!(res, Err(InsertCategoryError::CategoryAlreadyExists));
}

#[test]
fn categories_can_be_made_inactive_or_active() {
    let env = init();
    let TestEnv { mut pic, canister_ids, principal_ids } = env;

    let colletion_canister = canister_ids.collection_index;

    // Insert a new category, "Category A"
    assert_eq!(
        insert_category(
            &mut pic,
            principal_ids.controller,
            colletion_canister,
            &(InsertCategoryArgs {
                category_name: "Category A".to_string(),
            })
        ).unwrap(),
        ()
    );

    // check it is visible by default
    let res = get_categories(&pic, principal_ids.controller, colletion_canister, &()).unwrap();
    assert_eq!(res.len(), 1);
    assert_eq!(res[0].0, "Category A".to_string());
    assert_eq!(res[0].1.active, true);

    // set visibility to false
    let res = set_category_visibility(
        &mut pic,
        principal_ids.controller,
        colletion_canister,
        &(SetCategoryVisibilityArgs {
            category_name: "Category A".to_string(),
            hidden: false,
        })
    ).unwrap();
    assert_eq!(res, ());

    let res = get_categories(&pic, principal_ids.controller, colletion_canister, &()).unwrap();
    assert_eq!(res[0].0, "Category A".to_string());
    assert_eq!(res[0].1.active, false);

    // set visibility to true
    let res = set_category_visibility(
        &mut pic,
        principal_ids.controller,
        colletion_canister,
        &(SetCategoryVisibilityArgs {
            category_name: "Category A".to_string(),
            hidden: true,
        })
    ).unwrap();
    assert_eq!(res, ());

    let res = get_categories(&pic, principal_ids.controller, colletion_canister, &()).unwrap();
    assert_eq!(res[0].0, "Category A".to_string());
    assert_eq!(res[0].1.active, true);
}

// // Get all cateogries, we should see the "Category A" as the first one
// let first_category = get_categories(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &()
// )
//     .unwrap()
//     .first()
//     .unwrap()
//     .clone();
// assert_eq!(first_category.0, "Category A".to_string());
// assert_eq!(first_category.1.hidden, false);
// assert_eq!(first_category.1.total_collections, 0);
// assert_eq!(first_category.1.collection_ids, []);

// // Make the category hidden
// assert_eq!(
//     set_category_hidden(
//         &mut pic,
//         principal_ids.controller,
//         colletion_canister,
//         &(SetCategoryHiddenArgs {
//             category_name: "Category A".to_string(),
//             hidden: true,
//         })
//     ).unwrap(),
//     true
// );

// // Check if the collection is now hidden
// let first_category = get_categories(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &()
// )
//     .unwrap()
//     .first()
//     .unwrap()
//     .clone();
// assert_eq!(first_category.1.hidden, true);

// // Insert a new collection
// assert_eq!(
//     insert_collection(
//         &mut pic,
//         principal_ids.controller,
//         colletion_canister,
//         &(InsertCollectionArgs {
//             collection_canister_id: origyn_nft_one_canister_id,
//             is_promoted: false,
//             category: "Category A".to_string(),
//         })
//     ).unwrap(),
//     true
// );

// // Check all categories with stats
// let first_category = get_categories(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &()
// )
//     .unwrap()
//     .first()
//     .unwrap()
//     .clone();
// assert_eq!(first_category.1.total_collections, 1);

// println!("res: {first_category:?}");

// // Check if the collection is now hidden
// let first_collection = get_collections(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &(GetCollectionsArgs {
//         category: None,
//         offset: 0,
//         limit: 10,
//     })
// )
//     .unwrap()
//     .first()
//     .unwrap()
//     .clone();

// println!("res: {first_collection:?}");

// assert_eq!(first_collection.canister_id, origyn_nft_one_canister_id);
// assert_eq!(first_collection.category, "Category A".to_string());
// assert_eq!(first_collection.is_promoted, false);
// // This should match the value from init.rs
// assert_eq!(first_collection.name, Some("Collection A".to_string()));

// // Insert a new category, "Category B"
// let insert_category_args = InsertCategoryArgs {
//     category_name: "Category B".to_string(),
// };
// assert_eq!(
//     insert_category(
//         &mut pic,
//         principal_ids.controller,
//         colletion_canister,
//         &insert_category_args
//     ).unwrap(),
//     true
// );

// // Get all cateogries, we should see both of them - "Category A", "Category B"
// let categories_response = get_categories(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &()
// ).unwrap();
// assert_eq!(categories_response.len(), 2);
// assert_eq!(categories_response[0].0, "Category A".to_string());
// assert_eq!(categories_response[0].1.total_collections, 1);
// assert_eq!(categories_response[1].0, "Category B".to_string());
// assert_eq!(categories_response[1].1.total_collections, 0);

// // Update the collection category for this new collection to be now in B, from A
// assert_eq!(
//     update_collection_category(
//         &mut pic,
//         principal_ids.controller,
//         colletion_canister,
//         &(UpdateCollectionCategoryArgs {
//             collection_canister_id: origyn_nft_one_canister_id,
//             new_category: "Category B".to_string(),
//         })
//     ).unwrap(),
//     true
// );

// // Get all cateogries again
// let categories_response = get_categories(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &()
// ).unwrap();
// assert_eq!(categories_response.len(), 2);
// assert_eq!(categories_response[0].0, "Category A".to_string());
// assert_eq!(categories_response[0].1.total_collections, 0);
// assert_eq!(categories_response[1].0, "Category B".to_string());
// assert_eq!(categories_response[1].1.total_collections, 1);
// assert_eq!(
//     categories_response[1].1.collection_ids.first().unwrap(),
//     &origyn_nft_one_canister_id
// );

// // Get the collection, and check that it should be in "Category B" now
// let first_collection = get_collections(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &(GetCollectionsArgs {
//         category: None,
//         offset: 0,
//         limit: 10,
//     })
// )
//     .unwrap()
//     .first()
//     .unwrap()
//     .clone();
// assert_eq!(first_collection.category, "Category B".to_string());

// // Get the collections by Category B, only one should be returned
// let all_collections = get_collections(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &(GetCollectionsArgs {
//         category: Some("Category B".to_string()),
//         offset: 0,
//         limit: 10,
//     })
// ).unwrap();
// assert_eq!(all_collections.len(), 1);

// // Get the collections by Category A, none should be returned
// let all_collections = get_collections(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &(GetCollectionsArgs {
//         category: Some("Category A".to_string()),
//         offset: 0,
//         limit: 10,
//     })
// ).unwrap();
// assert_eq!(all_collections.len(), 0);

// // Remove the collection
// assert_eq!(
//     remove_collection(
//         &mut pic,
//         principal_ids.controller,
//         colletion_canister,
//         &(RemoveCollectionArgs {
//             collection_canister_id: origyn_nft_one_canister_id,
//         })
//     ).unwrap(),
//     true
// );

// // Try to get the collections, none should be returned
// let all_collections = get_collections(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &(GetCollectionsArgs {
//         category: None,
//         offset: 0,
//         limit: 10,
//     })
// ).unwrap();
// assert_eq!(all_collections.len(), 0);

// // Get all cateogries again, none of them should have any collections
// let categories_response = get_categories(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &()
// ).unwrap();
// assert_eq!(categories_response.len(), 2);
// assert_eq!(categories_response[0].1.total_collections, 0);
// assert_eq!(categories_response[1].1.total_collections, 0);

// // Insert collection one (Collection A)
// assert_eq!(
//     insert_collection(
//         &mut pic,
//         principal_ids.controller,
//         colletion_canister,
//         &(InsertCollectionArgs {
//             collection_canister_id: origyn_nft_one_canister_id,
//             is_promoted: false,
//             category: "Category A".to_string(),
//         })
//     ).unwrap(),
//     true
// );

// // Insert collection two (Collection B)
// assert_eq!(
//     insert_collection(
//         &mut pic,
//         principal_ids.controller,
//         colletion_canister,
//         &(InsertCollectionArgs {
//             collection_canister_id: origyn_nft_two_canister_id,
//             is_promoted: false,
//             category: "Category B".to_string(),
//         })
//     ).unwrap(),
//     true
// );

// // Get all cateogries again, each one of them should have 1 collection
// let categories_response = get_categories(
//     &mut pic,
//     principal_ids.controller,
//     colletion_canister,
//     &()
// ).unwrap();
// assert_eq!(categories_response.len(), 2);
// assert_eq!(categories_response[0].1.total_collections, 1);
// assert_eq!(
//     categories_response[0].1.collection_ids.first().unwrap(),
//     &origyn_nft_one_canister_id
// );
// assert_eq!(categories_response[1].1.total_collections, 1);
// assert_eq!(
//     categories_response[1].1.collection_ids.first().unwrap(),
//     &origyn_nft_two_canister_id
// );
