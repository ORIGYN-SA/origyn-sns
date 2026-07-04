// Subset of the Minting Studio (claimlink) interface used to resolve
// collection certificate templates.
export const idlFactory = ({ IDL }) => {
  const CollectionSearchParam = IDL.Variant({
    CanisterId: IDL.Principal,
    CollectionId: IDL.Nat,
  });
  const CollectionStatus = IDL.Variant({
    Queued: IDL.Null,
    Failed: IDL.Text,
    InstallingWasm: IDL.Null,
    Reimbursed: IDL.Null,
    UploadingTemplate: IDL.Null,
    Created: IDL.Null,
    ReimbursingQueued: IDL.Null,
    Installed: IDL.Null,
    TemplateUploaded: IDL.Null,
  });
  const CollectionMetadata = IDL.Record({
    categories: IDL.Vec(IDL.Text),
    name: IDL.Text,
    description: IDL.Text,
    template_id: IDL.Nat,
    symbol: IDL.Text,
  });
  const CollectionInfo = IDL.Record({
    categories: IDL.Vec(IDL.Text),
    status: CollectionStatus,
    updated_at: IDL.Nat,
    owner: IDL.Principal,
    metadata: CollectionMetadata,
    canister_id: IDL.Opt(IDL.Principal),
    collection_id: IDL.Nat,
    created_at: IDL.Nat,
    temaplte_url: IDL.Opt(IDL.Text),
    wasm_hash: IDL.Opt(IDL.Text),
    ogy_charged: IDL.Nat,
  });
  const GetTemplateByIdArgs = IDL.Record({ template_id: IDL.Nat });
  const Template = IDL.Record({
    template_json: IDL.Text,
    template_id: IDL.Nat,
  });
  const GetTemplateByIdError = IDL.Variant({ TemplateNotFound: IDL.Null });
  const GetTemplateByIdResult = IDL.Variant({
    Ok: Template,
    Err: GetTemplateByIdError,
  });
  return IDL.Service({
    get_collection_info: IDL.Func(
      [CollectionSearchParam],
      [IDL.Opt(CollectionInfo)],
      ["query"]
    ),
    get_template_by_id: IDL.Func(
      [GetTemplateByIdArgs],
      [GetTemplateByIdResult],
      ["query"]
    ),
  });
};
