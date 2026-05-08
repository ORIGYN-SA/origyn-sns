/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ICRC-7 NFT Standard IDL Factory
 * Contains query methods for fetching collection metadata
 */
export const idlFactory = ({ IDL }) => {
  const ICRC3Value = IDL.Rec();

  ICRC3Value.fill(
    IDL.Variant({
      Int: IDL.Int,
      Map: IDL.Vec(IDL.Tuple(IDL.Text, ICRC3Value)),
      Nat: IDL.Nat,
      Blob: IDL.Vec(IDL.Nat8),
      Text: IDL.Text,
      Array: IDL.Vec(ICRC3Value),
    })
  );

  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  return IDL.Service({
    // Collection metadata queries
    icrc7_name: IDL.Func([], [IDL.Text], ["query"]),
    icrc7_symbol: IDL.Func([], [IDL.Text], ["query"]),
    icrc7_description: IDL.Func([], [IDL.Opt(IDL.Text)], ["query"]),
    icrc7_logo: IDL.Func([], [IDL.Opt(IDL.Text)], ["query"]),
    icrc7_total_supply: IDL.Func([], [IDL.Nat], ["query"]),
    icrc7_supply_cap: IDL.Func([], [IDL.Opt(IDL.Nat)], ["query"]),
    icrc7_collection_metadata: IDL.Func(
      [],
      [IDL.Vec(IDL.Tuple(IDL.Text, ICRC3Value))],
      ["query"]
    ),

    // Token queries
    icrc7_tokens: IDL.Func(
      [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
      [IDL.Vec(IDL.Nat)],
      ["query"]
    ),
    icrc7_tokens_of: IDL.Func(
      [Account, IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
      [IDL.Vec(IDL.Nat)],
      ["query"]
    ),
    icrc7_token_metadata: IDL.Func(
      [IDL.Vec(IDL.Nat)],
      [IDL.Vec(IDL.Opt(IDL.Vec(IDL.Tuple(IDL.Text, ICRC3Value))))],
      ["query"]
    ),

    // Balance and ownership queries
    icrc7_balance_of: IDL.Func(
      [IDL.Vec(Account)],
      [IDL.Vec(IDL.Nat)],
      ["query"]
    ),
    icrc7_owner_of: IDL.Func(
      [IDL.Vec(IDL.Nat)],
      [IDL.Vec(IDL.Opt(Account))],
      ["query"]
    ),
  });
};

export const init = ({ IDL }) => {
  return [];
};
