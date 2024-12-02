import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { getActor } from '@amerej/artemis-react'

interface TimeChunkStats {
  start_time: bigint
  total_count: bigint
}

interface TimeStats {
  count_over_time: TimeChunkStats[]
  total_unique_accounts: bigint
}

const useGetActiveAccounts = ({ period }: { period: string }) => {
  const [data, setData] = useState<{
    total: string
    dataChart: { name: string; value: number }[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setIsError(false)

        const actor = await getActor('tokenStats', { isAnon: true })

        const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365

        const results = await actor.get_daily_stats()
        const { count_over_time } = results as TimeStats

        const filteredData = count_over_time.slice(0, days).map(stat => {
          const name = DateTime.fromMillis(
            Number(stat.start_time) / 1e6
          ).toFormat('LLL dd')
          const value = Number(stat.total_count)
          return { name, value }
        })

        const total =
          filteredData[filteredData.length - 1]?.value.toLocaleString(
            'en-US'
          ) || '0'

        setData({
          total,
          dataChart: filteredData
        })
      } catch (error) {
        console.error('Error fetching active accounts data:', error)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period])

  return {
    data,
    isSuccess: !!data,
    isError,
    isLoading
  }
}

export default useGetActiveAccounts
