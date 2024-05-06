import {
  FetchQueryOptions,
  UseQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import ogyAPI from "@services/_api/ogy";
import { PieChart } from "@services/_api/types/charts.types";
import { roundAndFormatLocale } from "@helpers/numbers/index";

export interface FoundationAssetsOGYParams {
  options?: UseQueryOptions;
}

export interface FoundationAssetsOGY {
  totalSupply: number;
  totalSupplyToString: string;
  totalSupplyLocked: number;
  totalSupplyLockedToString: string;
  totalSupplyUnlocked: number;
  totalSupplyUnlockedToString: string;
  totalLockedVested: number;
  totalLockedVestedToString: string;
  totalLockedStaked: number;
  totalLockedStakedToString: string;
  dataPieChart: PieChart[];
}

const fn = async (): Promise<FoundationAssetsOGY> => {
  const { data } = await ogyAPI.get(`/foundation/assets`);

  // Locked
  const foundationWalletLocked = data?.children[0]?.children[0];
  const foundationLocked = data?.children[1]?.children[0];
  const foundationVotingLocked = data?.children[2]?.children[0];
  // Unlocked
  const foundationWalletUnlocked = data?.children[0]?.children[1];
  const foundationUnlocked = data?.children[1]?.children[1];
  const foundationVotingUnlocked = data?.children[2]?.children[1];

  // 1. Total supply
  const totalSupply = data.value;
  // 2. Total locked
  const totalSupplyLocked =
    foundationWalletLocked?.value +
    foundationLocked?.value +
    foundationVotingLocked?.value;
  // 3. Total unlocked
  const totalSupplyUnlocked =
    foundationWalletUnlocked?.value +
    foundationUnlocked?.value +
    foundationVotingUnlocked?.value;
  // 4. Total staked
  const totalLockedStaked =
    foundationLocked?.children[3].value +
    foundationVotingLocked?.children[3].value;
  // 5. Total vested
  const totalLockedVested =
    foundationLocked?.children[0].value +
    foundationLocked?.children[1].value +
    foundationLocked?.children[2].value +
    foundationVotingLocked?.children[0].value +
    foundationVotingLocked?.children[1].value +
    foundationVotingLocked?.children[2].value;

  const totalSupplyLockedToString = roundAndFormatLocale({
    number: totalSupplyLocked,
  });
  const totalSupplyUnlockedToString = roundAndFormatLocale({
    number: totalSupplyUnlocked,
  });

  return {
    totalSupply,
    totalSupplyToString: roundAndFormatLocale({ number: totalSupply }),
    totalSupplyLocked,
    totalSupplyLockedToString,
    totalSupplyUnlocked,
    totalSupplyUnlockedToString,
    totalLockedStaked,
    totalLockedStakedToString: roundAndFormatLocale({
      number: totalLockedStaked,
    }),
    totalLockedVested,
    totalLockedVestedToString: roundAndFormatLocale({
      number: totalLockedVested,
    }),
    dataPieChart: [
      {
        name: "Locked",
        value: totalSupplyLocked,
        valueToString: totalSupplyLockedToString,
      },
      {
        name: "Unlocked",
        value: totalSupplyUnlocked,
        valueToString: totalSupplyUnlockedToString,
      },
    ],
  };
};

const fetchFoundationAssetsOGY = ({ options }: FoundationAssetsOGYParams) => {
  return {
    queryKey: ["fetchFoundationAssetsOGY"],
    queryFn: async () => fn(),
    placeholderData: keepPreviousData,
    ...options,
  } as FetchQueryOptions;
};

export default fetchFoundationAssetsOGY;
