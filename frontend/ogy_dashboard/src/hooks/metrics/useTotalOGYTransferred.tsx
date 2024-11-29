import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import {
  useQuery,
  keepPreviousData,
  UseQueryOptions,
  UseQueryResult
} from '@tanstack/react-query'
import { getActor } from '@amerej/artemis-react'
import { roundAndFormatLocale } from '@helpers/numbers'
import { TimeChunkStats, TimeStats } from '@hooks/super_stats_v3/declarations'

export interface TransferredData {
  transfer_count: {
    e8s: bigint
    number: number
    string: string
  }
  start_time: {
    e8s: bigint
    datetime: DateTime
  }
}

const useTotalOGYTransferred = ({
  start = 30,
  options = {
    placeholderData: keepPreviousData,
    queryKey: ['TOTAL_OGY_TRANSFERRED']
  }
}: {
  start?: number
  options?: Omit<UseQueryOptions<Array<TimeChunkStats>>, 'queryFn'>
}) => {
  const [data, setData] = useState<TransferredData[] | undefined>(undefined)

  const {
    data: rawData,
    isSuccess,
    isLoading,
    isError,
    error
  }: UseQueryResult<Array<TimeChunkStats>> = useQuery({
    ...options,
    queryFn: async (): Promise<Array<TimeChunkStats>> => {
      const actor = await getActor('tokenStats', { isAnon: true })
      const stats = (await actor.get_daily_stats()) as TimeStats
      return stats.count_over_time
    }
  })

  useEffect(() => {
    if (isSuccess && rawData) {
      const transformedData = rawData.slice(-start).map(r => {
        const number = Number(r.transfer_count)
        const datetime = DateTime.fromMillis(Number(r.start_time) / 1e6)
        return {
          transfer_count: {
            e8s: r.transfer_count,
            number,
            string: roundAndFormatLocale({ number })
          },
          start_time: {
            e8s: r.start_time,
            datetime
          }
        }
      })
      setData(transformedData)
    }
  }, [isSuccess, rawData, start])

  return {
    data,
    isSuccess: isSuccess && !!data,
    isError,
    isLoading: isLoading || !data,
    error
  }
}

export default useTotalOGYTransferred
