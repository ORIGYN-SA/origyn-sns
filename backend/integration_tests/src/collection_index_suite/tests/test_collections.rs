use candid::Principal;
use collection_index_api::collection::Collection;
use collection_index_api::errors::{ InsertCollectionError, RemoveCollectionError };
use collection_index_api::get_collections::GetCollectionsArgs;
use collection_index_api::insert_category::InsertCategoryArgs;
use collection_index_api::insert_collection::InsertCollectionArgs;
use collection_index_api::remove_collection::RemoveCollectionArgs;
use collection_index_api::set_category_visibility::SetCategoryVisibility;
use collection_index_api::update_collection_category::UpdateCollectionCategoryArgs;
use collection_index_api::insert_fake_collection::Args as InsertFakeCollectionArgs;

use crate::client::collection_index::{
    get_categories,
    get_collections,
    insert_category,
    insert_collection,
    insert_fake_collection,
    remove_collection,
    set_category_visibility,
    update_collection_category,
};
use crate::collection_index_suite::{ init::init, TestEnv };
use crate::utils::{ random_principal, tick_n_blocks };

#[test]
fn insert_collection_basic() {
    let env = init();
    let TestEnv { mut pic, canister_ids, principal_ids } = env;

    let origyn_nft_one_canister_id = canister_ids.origyn_nft_one;
    let origyn_nft_two_canister_id = canister_ids.origyn_nft_two;
    let collection_canister = canister_ids.collection_index;

    // Insert a new category, "Category A"
    assert_eq!(
        insert_category(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCategoryArgs {
                category_name: "Category A".to_string(),
            })
        ).unwrap(),
        ()
    );

    assert_eq!(
        insert_collection(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCollectionArgs {
                collection_canister_id: origyn_nft_one_canister_id,
                is_promoted: false,
                category: 0,
            })
        ).unwrap(),
        ()
    );

    let res = get_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(GetCollectionsArgs {
            categories: None,
            offset: 0,
            limit: 50,
        })
    ).unwrap();

    assert_eq!(res.total_pages, 1);
    assert_eq!(res.collections[0].canister_id, origyn_nft_one_canister_id);
}

#[test]
fn insert_collection_with_non_existent_category_should_fail() {
    let env = init();
    let TestEnv { mut pic, canister_ids, principal_ids } = env;

    let origyn_nft_one_canister_id = canister_ids.origyn_nft_one;
    let collection_canister = canister_ids.collection_index;

    // Insert a new category, "Category A"
    let res = insert_collection(
        &mut pic,
        principal_ids.controller,
        collection_canister,
        &(InsertCollectionArgs {
            collection_canister_id: origyn_nft_one_canister_id,
            is_promoted: false,
            category: 0,
        })
    );

    matches!(res, Err(InsertCollectionError::CategoryNotFound(_)));
}
#[test]
fn insert_collection_with_principal_that_already_exists_should_fail() {
    let env = init();
    let TestEnv { mut pic, canister_ids, principal_ids } = env;

    let origyn_nft_one_canister_id = canister_ids.origyn_nft_one;
    let collection_canister = canister_ids.collection_index;

    // Insert a new category, "Category A"
    assert_eq!(
        insert_category(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCategoryArgs {
                category_name: "Category A".to_string(),
            })
        ).unwrap(),
        ()
    );

    assert_eq!(
        insert_collection(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCollectionArgs {
                collection_canister_id: origyn_nft_one_canister_id,
                is_promoted: false,
                category: 0,
            })
        ).unwrap(),
        ()
    );

    // Insert a new category, "Category A"
    let res = insert_collection(
        &mut pic,
        principal_ids.controller,
        collection_canister,
        &(InsertCollectionArgs {
            collection_canister_id: origyn_nft_one_canister_id,
            is_promoted: false,
            category: 0,
        })
    );

    matches!(res, Err(InsertCollectionError::CollectionAlreadyExists));
}

#[test]
fn removing_a_collection_that_does_not_exist_should_fail() {
    let env = init();
    let TestEnv { mut pic, canister_ids, principal_ids } = env;

    let collection_canister = canister_ids.collection_index;

    let res = remove_collection(
        &mut pic,
        principal_ids.controller,
        collection_canister,
        &(RemoveCollectionArgs { collection_canister_id: Principal::anonymous() })
    );

    matches!(res, Err(RemoveCollectionError::CollectionNotFound));
}
#[test]
fn removing_a_collection_should_work() {
    let env = init();
    let TestEnv { mut pic, canister_ids, principal_ids } = env;

    let collection_canister = canister_ids.collection_index;
    let origyn_nft_one_canister_id = canister_ids.origyn_nft_one;

    // Insert a new category, "Category A"
    assert_eq!(
        insert_category(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCategoryArgs {
                category_name: "Category A".to_string(),
            })
        ).unwrap(),
        ()
    );

    let categories = get_categories(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &()
    ).unwrap();
    assert_eq!(categories[0].1.collection_count, 0);

    assert_eq!(
        insert_collection(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCollectionArgs {
                collection_canister_id: origyn_nft_one_canister_id,
                is_promoted: false,
                category: 0,
            })
        ).unwrap(),
        ()
    );

    let categories = get_categories(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &()
    ).unwrap();
    assert_eq!(categories[0].1.collection_count, 1);

    let res = remove_collection(
        &mut pic,
        principal_ids.controller,
        collection_canister,
        &(RemoveCollectionArgs { collection_canister_id: origyn_nft_one_canister_id })
    );

    let categories = get_categories(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &()
    ).unwrap();
    assert_eq!(categories[0].1.collection_count, 0);

    matches!(res, Ok(()));
}

#[test]
fn updating_a_collection_assigned_category_should_update_correctly() {
    let env = init();
    let TestEnv { mut pic, canister_ids, principal_ids } = env;

    let collection_canister = canister_ids.collection_index;
    let origyn_nft_one_canister_id = canister_ids.origyn_nft_one;

    // Insert a new category, "Category A"
    assert_eq!(
        insert_category(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCategoryArgs {
                category_name: "Category A".to_string(),
            })
        ).unwrap(),
        ()
    );
    assert_eq!(
        insert_category(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCategoryArgs {
                category_name: "Category B".to_string(),
            })
        ).unwrap(),
        ()
    );

    assert_eq!(
        insert_collection(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCollectionArgs {
                collection_canister_id: origyn_nft_one_canister_id,
                is_promoted: false,
                category: 0,
            })
        ).unwrap(),
        ()
    );

    // get the categories and check counts
    let categories = get_categories(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &()
    ).unwrap();

    let category_a = categories
        .iter()
        .find(|(id, cat)| id == &0)
        .unwrap();
    let category_b = categories
        .iter()
        .find(|(id, cat)| id == &1)
        .unwrap();
    assert_eq!(category_a.1.collection_count, 1);
    assert_eq!(category_b.1.collection_count, 0);

    // assign a new category
    update_collection_category(
        &mut pic,
        principal_ids.controller,
        collection_canister,
        &(UpdateCollectionCategoryArgs {
            collection_canister_id: origyn_nft_one_canister_id,
            category_id: 1,
        })
    ).unwrap();

    tick_n_blocks(&pic, 2);

    // get the categories and check collection counts
    let categories = get_categories(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &()
    ).unwrap();
    let category_a = categories
        .iter()
        .find(|(id, cat)| id == &0)
        .unwrap();
    let category_b = categories
        .iter()
        .find(|(id, cat)| id == &1)
        .unwrap();
    assert_eq!(category_a.1.collection_count, 0);
    assert_eq!(category_b.1.collection_count, 1);
}

#[test]
fn test_pagination_works_correctly() {
    let env = init();
    let TestEnv { mut pic, canister_ids, principal_ids } = env;

    let collection_canister = canister_ids.collection_index;
    let origyn_nft_one_canister_id = canister_ids.origyn_nft_one;

    // insert 3 categories
    assert_eq!(
        insert_category(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCategoryArgs {
                category_name: "Category A".to_string(),
            })
        ).unwrap(),
        ()
    );
    assert_eq!(
        insert_category(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCategoryArgs {
                category_name: "Category B".to_string(),
            })
        ).unwrap(),
        ()
    );
    // Insert a new category, "Category A"
    assert_eq!(
        insert_category(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertCategoryArgs {
                category_name: "Category C".to_string(),
            })
        ).unwrap(),
        ()
    );

    let mut collection_prins: Vec<Principal> = vec![];

    /// insert 50 colletions with category A // 0 - 49
    for i in 0..50 {
        let collection_prin = random_principal();
        let res = insert_fake_collection(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertFakeCollectionArgs {
                collection: Collection {
                    canister_id: collection_prin,
                    name: Some(format!("Collection {i}")),
                    category: Some(0u64),
                    is_promoted: false,
                },
                category: 0,
            })
        ).unwrap();
        collection_prins.push(collection_prin);
    }

    /// insert 50 colletions with category A // 50 - 99
    for i in 50..100 {
        let collection_prin = random_principal();
        let res = insert_fake_collection(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertFakeCollectionArgs {
                collection: Collection {
                    canister_id: collection_prin,
                    name: Some(format!("Collection {i}")),
                    category: Some(1u64),
                    is_promoted: false,
                },
                category: 1,
            })
        ).unwrap();
        collection_prins.push(collection_prin);
    }

    /// insert 50 colletions with category A // 50 - 99
    for i in 100..150 {
        let collection_prin = random_principal();
        let res = insert_fake_collection(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertFakeCollectionArgs {
                collection: Collection {
                    canister_id: collection_prin,
                    name: Some(format!("Collection {i}")),
                    category: Some(2u64),
                    is_promoted: false,
                },
                category: 2,
            })
        ).unwrap();
        collection_prins.push(collection_prin);
    }

    // get all collections
    let res = get_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(GetCollectionsArgs {
            categories: None,
            offset: 0,
            limit: 200,
        })
    ).unwrap();

    assert_eq!(res.collections.len(), 150);
}
// fn full_flow() {
//     let env = init();
//     let TestEnv { mut pic, canister_ids, principal_ids } = env;

//     let origyn_nft_one_canister_id = canister_ids.origyn_nft_one;
//     let origyn_nft_two_canister_id = canister_ids.origyn_nft_two;
//     let collection_index_canister_id = canister_ids.collection_index;

//     // Insert a new category, "Category A"
//     let insert_category_args = InsertCategoryArgs {
//         category_name: "Category A".to_string(),
//     };
//     assert_eq!(
//         insert_category(
//             &mut pic,
//             principal_ids.controller,
//             collection_index_canister_id,
//             &insert_category_args
//         ).unwrap(),
//         true
//     );

//     // Get all cateogries, we should see the "Category A" as the first one
//     let first_category = get_categories(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &()
//     )
//         .unwrap()
//         .first()
//         .unwrap()
//         .clone();
//     assert_eq!(first_category.0, "Category A".to_string());
//     assert_eq!(first_category.1.hidden, false);
//     assert_eq!(first_category.1.total_collections, 0);
//     assert_eq!(first_category.1.collection_ids, []);

//     // Make the category hidden
//     assert_eq!(
//         set_category_hidden(
//             &mut pic,
//             principal_ids.controller,
//             collection_index_canister_id,
//             &(SetCategoryHiddenArgs {
//                 category_name: "Category A".to_string(),
//                 hidden: true,
//             })
//         ).unwrap(),
//         true
//     );

//     // Check if the collection is now hidden
//     let first_category = get_categories(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &()
//     )
//         .unwrap()
//         .first()
//         .unwrap()
//         .clone();
//     assert_eq!(first_category.1.hidden, true);

//     // Insert a new collection
//     assert_eq!(
//         insert_collection(
//             &mut pic,
//             principal_ids.controller,
//             collection_index_canister_id,
//             &(InsertCollectionArgs {
//                 collection_canister_id: origyn_nft_one_canister_id,
//                 is_promoted: false,
//                 category: "Category A".to_string(),
//             })
//         ).unwrap(),
//         true
//     );

//     // Check all categories with stats
//     let first_category = get_categories(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &()
//     )
//         .unwrap()
//         .first()
//         .unwrap()
//         .clone();
//     assert_eq!(first_category.1.total_collections, 1);

//     println!("res: {first_category:?}");

//     // Check if the collection is now hidden
//     let first_collection = get_collections(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &(GetCollectionsArgs {
//             category: None,
//             offset: 0,
//             limit: 10,
//         })
//     )
//         .unwrap()
//         .first()
//         .unwrap()
//         .clone();

//     println!("res: {first_collection:?}");

//     assert_eq!(first_collection.canister_id, origyn_nft_one_canister_id);
//     assert_eq!(first_collection.category, "Category A".to_string());
//     assert_eq!(first_collection.is_promoted, false);
//     // This should match the value from init.rs
//     assert_eq!(first_collection.name, Some("Collection A".to_string()));

//     // Insert a new category, "Category B"
//     let insert_category_args = InsertCategoryArgs {
//         category_name: "Category B".to_string(),
//     };
//     assert_eq!(
//         insert_category(
//             &mut pic,
//             principal_ids.controller,
//             collection_index_canister_id,
//             &insert_category_args
//         ).unwrap(),
//         true
//     );

//     // Get all cateogries, we should see both of them - "Category A", "Category B"
//     let categories_response = get_categories(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &()
//     ).unwrap();
//     assert_eq!(categories_response.len(), 2);
//     assert_eq!(categories_response[0].0, "Category A".to_string());
//     assert_eq!(categories_response[0].1.total_collections, 1);
//     assert_eq!(categories_response[1].0, "Category B".to_string());
//     assert_eq!(categories_response[1].1.total_collections, 0);

//     // Update the collection category for this new collection to be now in B, from A
//     assert_eq!(
//         update_collection_category(
//             &mut pic,
//             principal_ids.controller,
//             collection_index_canister_id,
//             &(UpdateCollectionCategoryArgs {
//                 collection_canister_id: origyn_nft_one_canister_id,
//                 new_category: "Category B".to_string(),
//             })
//         ).unwrap(),
//         true
//     );

//     // Get all cateogries again
//     let categories_response = get_categories(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &()
//     ).unwrap();
//     assert_eq!(categories_response.len(), 2);
//     assert_eq!(categories_response[0].0, "Category A".to_string());
//     assert_eq!(categories_response[0].1.total_collections, 0);
//     assert_eq!(categories_response[1].0, "Category B".to_string());
//     assert_eq!(categories_response[1].1.total_collections, 1);
//     assert_eq!(
//         categories_response[1].1.collection_ids.first().unwrap(),
//         &origyn_nft_one_canister_id
//     );

//     // Get the collection, and check that it should be in "Category B" now
//     let first_collection = get_collections(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &(GetCollectionsArgs {
//             category: None,
//             offset: 0,
//             limit: 10,
//         })
//     )
//         .unwrap()
//         .first()
//         .unwrap()
//         .clone();
//     assert_eq!(first_collection.category, "Category B".to_string());

//     // Get the collections by Category B, only one should be returned
//     let all_collections = get_collections(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &(GetCollectionsArgs {
//             category: Some("Category B".to_string()),
//             offset: 0,
//             limit: 10,
//         })
//     ).unwrap();
//     assert_eq!(all_collections.len(), 1);

//     // Get the collections by Category A, none should be returned
//     let all_collections = get_collections(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &(GetCollectionsArgs {
//             category: Some("Category A".to_string()),
//             offset: 0,
//             limit: 10,
//         })
//     ).unwrap();
//     assert_eq!(all_collections.len(), 0);

//     // Remove the collection
//     assert_eq!(
//         remove_collection(
//             &mut pic,
//             principal_ids.controller,
//             collection_index_canister_id,
//             &(RemoveCollectionArgs {
//                 collection_canister_id: origyn_nft_one_canister_id,
//             })
//         ).unwrap(),
//         true
//     );

//     // Try to get the collections, none should be returned
//     let all_collections = get_collections(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &(GetCollectionsArgs {
//             category: None,
//             offset: 0,
//             limit: 10,
//         })
//     ).unwrap();
//     assert_eq!(all_collections.len(), 0);

//     // Get all cateogries again, none of them should have any collections
//     let categories_response = get_categories(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &()
//     ).unwrap();
//     assert_eq!(categories_response.len(), 2);
//     assert_eq!(categories_response[0].1.total_collections, 0);
//     assert_eq!(categories_response[1].1.total_collections, 0);

//     // Insert collection one (Collection A)
//     assert_eq!(
//         insert_collection(
//             &mut pic,
//             principal_ids.controller,
//             collection_index_canister_id,
//             &(InsertCollectionArgs {
//                 collection_canister_id: origyn_nft_one_canister_id,
//                 is_promoted: false,
//                 category: "Category A".to_string(),
//             })
//         ).unwrap(),
//         true
//     );

//     // Insert collection two (Collection B)
//     assert_eq!(
//         insert_collection(
//             &mut pic,
//             principal_ids.controller,
//             collection_index_canister_id,
//             &(InsertCollectionArgs {
//                 collection_canister_id: origyn_nft_two_canister_id,
//                 is_promoted: false,
//                 category: "Category B".to_string(),
//             })
//         ).unwrap(),
//         true
//     );

//     // Get all cateogries again, each one of them should have 1 collection
//     let categories_response = get_categories(
//         &mut pic,
//         principal_ids.controller,
//         collection_index_canister_id,
//         &()
//     ).unwrap();
//     assert_eq!(categories_response.len(), 2);
//     assert_eq!(categories_response[0].1.total_collections, 1);
//     assert_eq!(
//         categories_response[0].1.collection_ids.first().unwrap(),
//         &origyn_nft_one_canister_id
//     );
//     assert_eq!(categories_response[1].1.total_collections, 1);
//     assert_eq!(
//         categories_response[1].1.collection_ids.first().unwrap(),
//         &origyn_nft_two_canister_id
//     );
// }
