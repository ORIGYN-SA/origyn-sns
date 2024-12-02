import { useMemo, useState } from 'react'
import { Card, TooltipInfo, Select } from '@components/ui'
import useVotingPowerData from '@hooks/metrics/useVotingPowerData'
import {
  Loader as ChartLoader,
  Error as ChartError,
  Area as ChartArea
} from '@components/charts'

const SELECT_PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
]

const ChartVotingPower = ({
  className,
  ...restProps
}: {
  className?: string
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('weekly')
  const { data, isSuccess, isLoading, isError } = useVotingPowerData({
    period: selectedPeriod
  })

  console.log('data', data)

  const handleOnChangePeriod = (period: string) => {
    setSelectedPeriod(period)
  }

  const barFill = useMemo(() => '#34d399', [])

  return (
    <Card className={className} {...restProps}>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold mr-2'>Origyn Voting Power</h2>
        <Select
          options={SELECT_PERIOD_OPTIONS}
          value={selectedPeriod}
          handleOnChange={value => handleOnChangePeriod(value as string)}
          className='w-25'
        />
      </div>
      {isLoading && <ChartLoader />}
      {isError && (
        <ChartError>Error while fetching governance staking data.</ChartError>
      )}
      {isSuccess && data && !isLoading && (
        <div className='flex flex-col xl:flex-row mt-4'>
          <div className='xl:w-1/4 flex flex-col'>
            <div>
              <div className='flex'>
                <span className='text-content/60 font-semibold mr-2'>
                  Origyn Stake Power
                </span>
                <TooltipInfo id='tooltip-stake-power'>
                  <p>Tokens locked for staking purposes.</p>
                </TooltipInfo>
              </div>
              <div className='text-2xl font-semibold mt-2'>
                <span className='mr-3'>{data.stakePower}</span>
                <span className='text-content/60'>OGY</span>
              </div>
            </div>
            <div className='border-b border-[#E1E1E1] my-4 w-full xl:w-3/4' />
            <div>
              <div className='flex'>
                <span className='text-content/60 font-semibold mr-2'>
                  Total Voting Power
                </span>
                <TooltipInfo id='tooltip-total-voting-power'>
                  <p>The overall voting power across all participants.</p>
                </TooltipInfo>
              </div>
              <div className='text-2xl font-semibold mt-2'>
                <span className='mr-3'>{data.votingPower}</span>
                <span className='text-content/60'>OGY</span>
              </div>
            </div>
          </div>
          <div className='xl:w-3/4 h-72 rounded-xl mt-8 md:mt-0'>
            <ChartArea data={data.dataChart} fill={barFill} />
          </div>
        </div>
      )}
    </Card>
  )
}

export default ChartVotingPower
