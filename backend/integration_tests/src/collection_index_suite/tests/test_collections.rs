use candid::Principal;
use collection_index_api::collection::Collection;
use collection_index_api::errors::{ InsertCollectionError, RemoveCollectionError };
use collection_index_api::get_collections::GetCollectionsArgs;
use collection_index_api::insert_category::InsertCategoryArgs;
use collection_index_api::insert_collection::InsertCollectionArgs;
use collection_index_api::remove_collection::RemoveCollectionArgs;
use collection_index_api::search_collections::SearchCollectionsArg;
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
    search_collections,
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
                    is_promoted: true,
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
    // test that the promoted collections are first
    res.collections[0..50].iter().for_each(|col| { assert_eq!(col.is_promoted, true) });
    // test that the rest are not promoted
    res.collections[50..150].iter().for_each(|col| { assert_eq!(col.is_promoted, false) });
    assert_eq!(res.total_pages, 1);
    // let only_names: Vec<String> = res.collections
    //     .iter()
    //     .map(|col| col.name.clone().unwrap())
    //     .collect();
    // println!("{only_names:?}");

    // get only category a
    let res = get_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(GetCollectionsArgs {
            categories: Some(vec![0]),
            offset: 0,
            limit: 200,
        })
    ).unwrap();

    assert_eq!(res.collections.len(), 50);
    assert_eq!(res.total_pages, 1);

    // get two categories worth of data
    let res = get_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(GetCollectionsArgs {
            categories: Some(vec![0, 2]),
            offset: 0,
            limit: 200,
        })
    ).unwrap();

    assert_eq!(res.collections.len(), 100);
    assert_eq!(res.total_pages, 1);

    // step paginate through 2 categories worth of collections ( 100 )
    let res = get_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(GetCollectionsArgs {
            categories: Some(vec![0, 2]),
            offset: 0,
            limit: 20,
        })
    ).unwrap();

    assert_eq!(res.collections.len(), 20);
    assert_eq!(res.total_pages, 5);

    // step paginate through 2 categories worth of collections ( 100 )
    let res = get_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(GetCollectionsArgs {
            categories: Some(vec![0, 2]),
            offset: 20,
            limit: 20,
        })
    ).unwrap();

    assert_eq!(res.collections.len(), 20);
    assert_eq!(res.total_pages, 5);

    let res = get_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(GetCollectionsArgs {
            categories: Some(vec![0, 2]),
            offset: 40,
            limit: 20,
        })
    ).unwrap();

    assert_eq!(res.collections.len(), 20);
    assert_eq!(res.total_pages, 5);

    let res = get_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(GetCollectionsArgs {
            categories: Some(vec![0, 2]),
            offset: 60,
            limit: 20,
        })
    ).unwrap();

    assert_eq!(res.collections.len(), 20);
    assert_eq!(res.total_pages, 5);

    let res = get_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(GetCollectionsArgs {
            categories: Some(vec![0, 2]),
            offset: 80,
            limit: 20,
        })
    ).unwrap();

    assert_eq!(res.collections.len(), 20);
    assert_eq!(res.total_pages, 5);

    let res = get_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(GetCollectionsArgs {
            categories: Some(vec![0, 2]),
            offset: 100,
            limit: 20,
        })
    ).unwrap();

    assert_eq!(res.collections.len(), 0);
    assert_eq!(res.total_pages, 5);
}

#[test]
fn test_search_collections_works_correctly() {
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

    let mut collection_prins: Vec<Principal> = vec![];
    let letters = ["a", "b", "c", "d", "e"];

    for i in 0..50 {
        let collection_prin = random_principal();
        let letter = letters[i % letters.len()];
        let res = insert_fake_collection(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertFakeCollectionArgs {
                collection: Collection {
                    canister_id: collection_prin,
                    name: Some(format!("{i} {letter}")),
                    category: Some(0u64),
                    is_promoted: true,
                },
                category: 0,
            })
        ).unwrap();
        collection_prins.push(collection_prin);
    }

    /// insert 50 colletions with category A // 50 - 99
    for i in 50..100 {
        let collection_prin = random_principal();
        let letter = letters[i % letters.len()];
        let res = insert_fake_collection(
            &mut pic,
            principal_ids.controller,
            collection_canister,
            &(InsertFakeCollectionArgs {
                collection: Collection {
                    canister_id: collection_prin,
                    name: Some(format!("{i} {letter}")),
                    category: Some(1u64),
                    is_promoted: false,
                },
                category: 1,
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

    assert_eq!(res.collections.len(), 100);
    assert_eq!(res.total_pages, 1);
    let only_names: Vec<String> = res.collections
        .iter()
        .map(|col| col.name.clone().unwrap())
        .collect();
    println!("{only_names:?}");

    // search for "a" - should be 20 hits
    let res = search_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(SearchCollectionsArg {
            categories: None,
            search_string: String::from("a"),
            offset: 0,
            limit: 200,
        })
    );
    let only_names: Vec<String> = res.collections
        .iter()
        .map(|col| col.name.clone().unwrap())
        .collect();
    println!("{only_names:?}");
    assert_eq!(res.total_pages, 1);
    assert_eq!(res.collections.len(), 20);

    // search for "b" - should be 20 hits
    let res = search_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(SearchCollectionsArg {
            categories: None,
            search_string: String::from("b"),
            offset: 0,
            limit: 200,
        })
    );
    let only_names: Vec<String> = res.collections
        .iter()
        .map(|col| col.name.clone().unwrap())
        .collect();
    println!("{only_names:?}");
    assert_eq!(res.total_pages, 1);
    assert_eq!(res.collections.len(), 20);

    // search for "b" - should be 20 hits
    let res = search_collections(
        &pic,
        Principal::anonymous(),
        collection_canister,
        &(SearchCollectionsArg {
            categories: None,
            search_string: String::from("22 c"),
            offset: 0,
            limit: 200,
        })
    );
    let only_names: Vec<String> = res.collections
        .iter()
        .map(|col| col.name.clone().unwrap())
        .collect();
    println!("{only_names:?}");
    assert_eq!(res.total_pages, 1);
    assert_eq!(res.collections.len(), 1);
}
