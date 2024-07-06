import { useMutation } from "@tanstack/react-query";
import { useWallet, getActor } from "@amerej/artemis-react";
import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { TRANSACTION_FEE } from "@constants/index";
import { Response_1 } from "@services/types/ogy_token_swap";

// const isRejected = (
//   input: PromiseSettledResult<unknown>
// ): input is PromiseRejectedResult => input.status === "rejected";

const isFulfilled = <T,>(
  input: PromiseSettledResult<T>
): input is PromiseFulfilledResult<T> => input.status === "fulfilled";

interface IValueOGYBalance {
  e8s: bigint;
}

const sendTokens = async ({ owner }: { owner: string }) => {
  // for fetching OGY user balance
  const userAccountIdentifier = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(owner),
  });
  const actorLedgerLegacy = await getActor("ledgerLegacy", { isAnon: false });
  const actorOGYTokenSwap = await getActor("OGYTokenSwap", { isAnon: false });
  const rawResult = await Promise.allSettled([
    actorLedgerLegacy.account_balance_dfx({
      account: userAccountIdentifier.toHex(),
    }),
    actorOGYTokenSwap.request_deposit_account({
      of: [Principal.fromText(owner)],
    }),
  ]);

  const result = rawResult.filter(isFulfilled);
  const to = Principal.fromUint8Array(
    (result[1]?.value as Response_1).Success as Uint8Array
  ).toHex();
  const fee = { e8s: TRANSACTION_FEE };
  const amount = (result[0]?.value as IValueOGYBalance).e8s - TRANSACTION_FEE;

  const resultSendTokens = await actorLedgerLegacy.send_dfx({
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
  const { principalId } = useWallet();

  return useMutation({
    mutationFn: () =>
      sendTokens({
        owner: principalId as string,
      }),
  });
};

export default useSendTokens;
