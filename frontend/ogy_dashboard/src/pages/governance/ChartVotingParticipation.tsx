import { useMemo, useState } from 'react'
import { Card, TooltipInfo, Select } from '@components/ui'
import {
  Loader as ChartLoader,
  Error as ChartError,
  Area as ChartArea
} from '@components/charts'
import useVotingParticipationData from '@hooks/metrics/useVotingParticipationData'

const SELECT_PERIOD_OPTIONS = [
  { value: 'weekly' },
  { value: 'monthly' },
  { value: 'yearly' }
]

const ChartVotingParticipation = ({
  className,
  ...restProps
}: {
  className?: string
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('weekly')
  const { data, isSuccess, isLoading, isError } = useVotingParticipationData({
    period: selectedPeriod
  })

  const handleOnChangePeriod = (period: string) => {
    setSelectedPeriod(period)
  }

  const barFill = useMemo(() => '#34d399', [])

  console.log('Voting participation data:', data)

  return (
    <Card className={`${className}`} {...restProps}>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold mr-2'>Voting Participation</h2>
        <Select
          options={SELECT_PERIOD_OPTIONS}
          value={selectedPeriod}
          handleOnChange={value => handleOnChangePeriod(value as string)}
          className='w-25'
        />
      </div>
      {isLoading && <ChartLoader />}
      {isError && (
        <ChartError>Error while fetching voting participation data.</ChartError>
      )}
      {isSuccess && (
        <div className='flex flex-col xl:flex-row mt-4'>
          {/* Left Panel */}
          <div className='xl:w-1/4 flex flex-col'>
            {/* Last Voting Participation */}
            <div>
              <div className='flex'>
                <span className='text-content/60 font-semibold mr-2'>
                  Last Voting Participation
                </span>
                <TooltipInfo id='tooltip-last-voting-participation'>
                  <p>Percentage of participation in the last voting event.</p>
                </TooltipInfo>
              </div>
              <div className='text-2xl font-semibold mt-2'>
                <span>{data?.lastParticipation}%</span>
              </div>
            </div>
            <div className='border-b border-[#E1E1E1] my-4 w-3/4' />

            {/* Average Voting Participation */}
            <div>
              <div className='flex'>
                <span className='text-content/60 font-semibold mr-2'>
                  Average Voting Participation
                </span>
                <TooltipInfo id='tooltip-average-voting-participation'>
                  <p>Average percentage of voting participation over time.</p>
                </TooltipInfo>
              </div>
              <div className='text-2xl font-semibold mt-2'>
                <span>{data?.averageParticipation}%</span>
              </div>
            </div>
            <div className='border-b border-[#E1E1E1] my-4 w-3/4' />

            {/* Average Voting Power */}
            <div>
              <div className='flex'>
                <span className='text-content/60 font-semibold mr-2'>
                  Average Voting Power
                </span>
                <TooltipInfo id='tooltip-average-voting-power'>
                  <p>Average voting power across all participants.</p>
                </TooltipInfo>
              </div>
              <div className='text-2xl font-semibold mt-2'>
                <span>{data?.averagePower}</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className='xl:w-3/4 h-72 rounded-xl'>
            <ChartArea data={data?.dataChart} fill={barFill} />
          </div>
        </div>
      )}
    </Card>
  )
}

export default ChartVotingParticipation
