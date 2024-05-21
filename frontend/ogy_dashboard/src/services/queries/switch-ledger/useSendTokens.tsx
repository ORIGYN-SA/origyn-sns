import { useMutation } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { ActorSubclass } from "@dfinity/agent";
import { TRANSACTION_FEE } from "@constants/index";

// const isRejected = (
//   input: PromiseSettledResult<unknown>
// ): input is PromiseRejectedResult => input.status === "rejected";

const isFulfilled = <T,>(
  input: PromiseSettledResult<T>
): input is PromiseFulfilledResult<T> => input.status === "fulfilled";

interface ISendTokensParams {
  OGYTokenSwapActor: ActorSubclass;
  ledgerLegacyActor: ActorSubclass;
  owner: string;
}

interface IValueOGYBalance {
  e8s: bigint;
}

const sendTokens = async ({
  OGYTokenSwapActor,
  ledgerLegacyActor,
  owner,
}: ISendTokensParams) => {
  // for fetching OGY user balance
  const userAccountIdentifier = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(owner),
  });
  const rawResult = await Promise.allSettled([
    ledgerLegacyActor.account_balance_dfx({
      account: userAccountIdentifier.toHex(),
    }),
    OGYTokenSwapActor.request_deposit_account([Principal.fromText(owner)]),
  ]);

  const result = rawResult.filter(isFulfilled);
  const to = Principal.fromUint8Array(result[1]?.value as Uint8Array).toHex();
  const fee = { e8s: TRANSACTION_FEE };
  const amount = (result[0]?.value as IValueOGYBalance).e8s - TRANSACTION_FEE;

  const resultSendTokens = await ledgerLegacyActor.send_dfx({
    to,
    fee,
    memo: 0,
    from_subaccount: [],
    created_at_time: [],
    amount: { e8s: amount },
  });
  return resultSendTokens;
};

const useSendTokens = () => {
  const { principal } = useConnect();
  const [OGYTokenSwapActor] = useCanister("OGYTokenSwap");
  const [ledgerLegacyActor] = useCanister("ledgerLegacy");

  return useMutation({
    mutationFn: () =>
      sendTokens({
        OGYTokenSwapActor,
        ledgerLegacyActor,
        owner: principal as string,
      }),
  });
};

export default useSendTokens;
