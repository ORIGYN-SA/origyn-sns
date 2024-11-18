import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { ChartData } from '@services/types/charts.types'
import fetchVotingParticipationData from '@services/queries/metrics/fetchVotingParticipationData'

const useVotingParticipationData = ({ period }: { period: string }) => {
  const [data, setData] = useState<
    | {
        lastParticipation: string
        averageParticipation: string
        averagePower: string
        dataChart: ChartData[]
      }
    | undefined
  >(undefined)

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetchVotingParticipationData({ period })
      const results = response.map(r => {
        const name = DateTime.fromMillis(0)
          .plus({ days: Number(r[0]) })
          .toFormat('LLL dd')
        return {
          name,
          value: r[1].participation
        }
      })

      setData({
        lastParticipation: '99.99', // Simulated data
        averageParticipation: '99.05', // Simulated data
        averagePower: '794,992,323', // Simulated data
        dataChart: results
      })
    }

    fetchData()
  }, [period])

  return {
    data,
    isSuccess: !!data,
    isError: false,
    isLoading: !data
  }
}

export default useVotingParticipationData
