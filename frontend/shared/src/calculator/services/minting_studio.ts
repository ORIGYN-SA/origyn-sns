export const idlFactory = ({
  IDL,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IDL: any;
}) => {
  const EstimateMintCostArgs = IDL.Record({
    total_file_size_bytes: IDL.Nat,
    num_mints: IDL.Nat64,
  });
  const MintCostBreakdown = IDL.Record({
    storage_fee_usd_e8s: IDL.Nat64,
    base_fee_usd_e8s: IDL.Nat64,
  });
  const MintCostEstimate = IDL.Record({
    breakdown: MintCostBreakdown,
    total_usd_e8s: IDL.Nat64,
    ogy_usd_price_e8s: IDL.Nat64,
    total_ogy_e8s: IDL.Nat64,
  });
  const EstimateMintCostError = IDL.Variant({
    MintPricingNotConfigured: IDL.Null,
    OgyPriceNotAvailable: IDL.Null,
  });
  const Result = IDL.Variant({
    Ok: MintCostEstimate,
    Err: EstimateMintCostError,
  });

  return IDL.Service({
    estimate_mint_cost: IDL.Func([EstimateMintCostArgs], [Result], ["query"]),
  });
};
