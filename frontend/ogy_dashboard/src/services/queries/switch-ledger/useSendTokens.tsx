import { useMutation } from "@tanstack/react-query";
import { useWallet } from "@components/auth/useWallet";
import { getActor } from "@services/actor";
import { Principal } from "@dfinity/principal";
import { AccountIdentifier, type SubAccount } from "@dfinity/ledger-icp";
import { TRANSACTION_FEE } from "@constants/index";
import { Response_1 } from "@services/types/ogy_token_swap";
import { requireVariant } from "@services/queries/utils/variant";

interface IValueOGYBalance {
  e8s: bigint;
}

const sendTokens = async ({
  owner,
  subAccount,
}: {
  owner: string;
  subAccount?: SubAccount;
}) => {
  if (subAccount) {
    throw new Error(
      "Legacy OGY swap is only supported from the principal default account."
    );
  }

  // for fetching OGY user balance
  const userAccountIdentifier = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(owner),
  });
  const actorLedgerLegacy = await getActor("ledgerLegacy", { isAnon: false });
  const actorLedgerLegacyAnon = await getActor("ledgerLegacy", {
    isAnon: true,
  });
  const actorOGYTokenSwap = await getActor("OGYTokenSwap", { isAnon: false });
  const [balance, depositAccountResult] = await Promise.all([
    // Account-keyed query, read anonymously (no wallet consent).
    actorLedgerLegacyAnon.account_balance_dfx({
      account: userAccountIdentifier.toHex(),
    }),
    actorOGYTokenSwap.request_deposit_account({
      of: [Principal.fromText(owner)],
    }),
  ]);

  const balanceE8s = (balance as IValueOGYBalance).e8s;
  if (balanceE8s <= TRANSACTION_FEE) {
    throw new Error("Legacy OGY balance is too low to cover the transfer fee.");
  }

  const depositAccount = requireVariant<Uint8Array | number[]>(
    depositAccountResult as Response_1,
    "Success",
    "Deposit account request failed"
  );
  const to = Principal.fromUint8Array(
    depositAccount instanceof Uint8Array
      ? depositAccount
      : Uint8Array.from(depositAccount)
  ).toHex();
  const fee = { e8s: TRANSACTION_FEE };
  const amount = balanceE8s - TRANSACTION_FEE;

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
  const { principalId, subAccount } = useWallet();

  return useMutation({
    mutationFn: () =>
      sendTokens({
        owner: principalId as string,
        subAccount,
      }),
  });
};

export default useSendTokens;
