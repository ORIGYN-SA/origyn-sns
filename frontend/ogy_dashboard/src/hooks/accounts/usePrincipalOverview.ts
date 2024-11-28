import { useState, useEffect } from 'react'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { getActor } from '@amerej/artemis-react'
import { divideBy1e8 } from '@helpers/numbers'

interface TransactionStats {
  totalSend: number
  totalReceive: number
  totalVolume: number
}

const usePrincipalOverview = (principal: string) => {
  const [data, setData] = useState<TransactionStats | null>(null)

  const {
    data: response,
    isSuccess,
    isLoading,
    isError,
    error
  }: UseQueryResult<any> = useQuery({
    queryKey: ['principalOverview', principal],
    queryFn: async () => {
      const actor = await getActor('tokenStats', { isAnon: true })
      const result = await actor.get_principal_overview(principal)
      return result
    },
    enabled: !!principal
  })

  useEffect(() => {
    if (isLoading) {
      setData(null)
    } else if (isSuccess) {
      if (Array.isArray(response) && response.length > 0) {
        const principalData = response[0]
        if (
          principalData.sent.length === 2 &&
          principalData.received.length === 2
        ) {
          const totalSendRaw = principalData.sent[1]
          const totalReceiveRaw = principalData.received[1]

          const totalSend = divideBy1e8(totalSendRaw)
          const totalReceive = divideBy1e8(totalReceiveRaw)
          const totalVolume = totalSend + totalReceive

          setData({ totalSend, totalReceive, totalVolume })
        } else {
          setData(null)
        }
      } else {
        setData(null)
      }
    } else {
      setData(null)
    }
  }, [isLoading, isSuccess, response])

  return {
    data,
    isSuccess,
    isLoading,
    isError,
    error
  }
}

export default usePrincipalOverview
