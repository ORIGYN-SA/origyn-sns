import React from 'react'
import { useParams } from 'react-router-dom'
import { Card, LoaderSpin, TooltipInfo } from '@components/ui'
import PieChart from '@components/charts/pie/Pie'
import { roundAndFormatLocale } from '@helpers/numbers'
import usePrincipalOverview from '@hooks/accounts/usePrincipalOverview'

const PrincipalOverview = () => {
  const { accountId } = useParams<{ accountId: string }>()
  const { data, isSuccess, isLoading, isError, error } = usePrincipalOverview(
    accountId || ''
  )

  const chartData =
    isSuccess && data
      ? [
          { name: 'Total Sent', value: Number(data.totalSend) },
          { name: 'Total Received', value: Number(data.totalReceive) }
        ]
      : []

  const borderColors = ['bg-purple-500', 'bg-pink-500', 'bg-green-500']

  const stats = [
    {
      label: 'Total Sent',
      value: data?.totalSend,
      token: 'OGY',
      tooltip: 'Total amount sent by the principal.'
    },
    {
      label: 'Total Received',
      value: data?.totalReceive,
      token: 'OGY',
      tooltip: 'Total amount received by the principal.'
    },
    {
      label: 'Total Volume',
      value: data?.totalVolume,
      token: 'OGY',
      tooltip: 'Total volume of transactions (sent + received).'
    }
  ]

  return (
    <Card className='p-6'>
      <h2 className='text-lg font-semibold mb-6'>Principal Account Overview</h2>

      {isLoading && (
        <LoaderSpin
          size='lg'
          className='flex justify-center items-center h-full my-12'
        />
      )}

      {isError && (
        <div className='bg-rose-500 rounded-xl text-white font-bold mb-8 p-6'>
          {error?.message || 'An error occurred'}
        </div>
      )}

      {data === null && isSuccess && (
        <div className='justify-center font-semibold my-8 p-6 flex italic'>
          No data found for this principal ID.
        </div>
      )}

      {isSuccess && data && (
        <>
          <div className='h-72 my-12'>
            <PieChart data={chartData} colors={['#645eff', '#333089']} />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
            {stats.map((stat, index) => (
              <Card
                className='bg-surface-2/40 dark:bg-surface-2 pb-8'
                key={stat.label}
              >
                <div className='flex flex-col md:flex-row items-center justify-between'>
                  <div className='flex flex-col md:flex-row items-center text-lg font-semibold'>
                    <img
                      src='/ogy_logo.svg'
                      height={32}
                      width={32}
                      alt='Token logo'
                    />
                    <h2 className='ml-2 text-content/60'>{stat.label}</h2>
                  </div>
                  <TooltipInfo id={`tooltip-${stat.label}`}>
                    {stat.tooltip}
                  </TooltipInfo>
                </div>
                <div className='flex flex-col md:flex-row items-center mt-4 text-2xl font-semibold'>
                  <span className='mr-3'>
                    {stat.value !== undefined
                      ? roundAndFormatLocale({ number: Number(stat.value) })
                      : 'N/A'}
                  </span>
                  <span className='text-content/60'>{stat.token}</span>
                </div>
                <Card.BorderBottom
                  className={`${borderColors[index % borderColors.length]}`}
                />
              </Card>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

export default PrincipalOverview
