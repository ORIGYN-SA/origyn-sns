import { HistoryData } from '@services/types/token_metrics'

const fetchVotingPowerHistory = async ({
  start
}: {
  start: number
}): Promise<Array<[bigint, HistoryData]>> => {
  const fakeData = []
  for (let i = 0; i < start; i++) {
    fakeData.push([
      BigInt(i),
      { balance: BigInt(2000000000000000 + i * 1000000000) } // Fake balance changes
    ])
  }
  return fakeData as Array<[bigint, HistoryData]>
}

export default fetchVotingPowerHistory
