import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { roundAndFormatLocale, divideBy1e8 } from '@helpers/numbers/index'
import { ChartData } from '@services/types/charts.types'

const generateFakeData = (
  startDays: number
): Array<[bigint, { balance: bigint }]> => {
  const fakeData: Array<[bigint, { balance: bigint }]> = []
  for (let i = 0; i < startDays; i++) {
    fakeData.push([
      BigInt(i),
      { balance: BigInt(2000000000000000 + i * 1000000000) } // Simulating balance changes
    ])
  }
  return fakeData
}

const useVotingPowerData = ({ period }: { period: string }) => {
  const [data, setData] = useState<
    | {
        total: string
        dataChart: ChartData[]
        stakePower: string
        votingPower: string
      }
    | undefined
  >(undefined)

  useEffect(() => {
    const startDays = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365
    const response = generateFakeData(startDays)

    const results = response.map(r => {
      const name = DateTime.fromMillis(0)
        .plus({ days: Number(r[0]) })
        .toFormat('LLL dd')
      const value = divideBy1e8(r[1].balance)
      return {
        name,
        value,
        valueToString: roundAndFormatLocale({ number: value })
      }
    })

    const fakeStakePower = '400,000,000'
    const fakeVotingPower = '1,232,238,366'

    setData({
      dataChart: results,
      total: results[results.length - 1].valueToString,
      stakePower: fakeStakePower,
      votingPower: fakeVotingPower
    })
  }, [period])

  return {
    data,
    isSuccess: !!data,
    isError: false,
    isLoading: !data
  }
}

export default useVotingPowerData
