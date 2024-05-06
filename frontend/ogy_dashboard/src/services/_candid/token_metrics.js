export const idlFactory = ({ IDL }) => {
  const HttpResponse = IDL.Rec();
  const Args = IDL.Record({ test_mode: IDL.Bool });
  const GovernanceStats = IDL.Record({
    total_rewards: IDL.Nat64,
    total_staked: IDL.Nat64,
    total_locked: IDL.Nat64,
    total_unlocked: IDL.Nat64,
  });
  const TokenSupplyData = IDL.Record({
    circulating_supply: IDL.Nat64,
    total_supply: IDL.Nat64,
  });
  const HttpRequest = IDL.Record({
    url: IDL.Text,
    method: IDL.Text,
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });
  const Token = IDL.Record({
    key: IDL.Text,
    sha256: IDL.Opt(IDL.Vec(IDL.Nat8)),
    index: IDL.Nat,
    content_encoding: IDL.Text,
  });
  const StreamingStrategy = IDL.Variant({
    Callback: IDL.Record({
      token: Token,
      callback: IDL.Func([Token], [HttpResponse], ["query"]),
    }),
  });
  HttpResponse.fill(
    IDL.Record({
      body: IDL.Vec(IDL.Nat8),
      headers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
      streaming_strategy: IDL.Opt(StreamingStrategy),
      status_code: IDL.Nat16,
    })
  );
  return IDL.Service({
    __get_candid_interface_tmp_hack: IDL.Func([], [IDL.Text], ["query"]),
    get_all_neuron_owners: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
    get_neurons_stats: IDL.Func(
      [IDL.Opt(IDL.Principal)],
      [GovernanceStats],
      ["query"]
    ),
    get_supply_data: IDL.Func([], [TokenSupplyData], ["query"]),
    http_request: IDL.Func([HttpRequest], [HttpResponse], ["query"]),
    run_gov_job: IDL.Func([], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => {
  const Args = IDL.Record({ test_mode: IDL.Bool });
  return [Args];
};
