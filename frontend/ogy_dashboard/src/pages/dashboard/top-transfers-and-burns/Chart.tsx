import { useMemo } from 'react'
import { Badge, Button, Card, Skeleton, Tooltip } from '@components/ui'
import { ColumnDef } from '@tanstack/react-table'
import { Table } from '@components/ui'
import useTopTransfersAndBurns, {
  TransformedData
} from '@hooks/metrics/useTopTransfersAndBurns'
import CopyToClipboard from '@components/buttons/CopyToClipboard'
import { useNavigate } from 'react-router-dom'

const formatLargeNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  return num.toFixed(2)
}

interface ChartProps {
  type: 'transfers' | 'burns'
  title: string
  limit: number
}

const Chart = ({ type, title, limit }: ChartProps) => {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useTopTransfersAndBurns({
    type,
    limit
  })

  const columns: ColumnDef<TransformedData>[] = useMemo(() => {
    const baseColumns: ColumnDef<TransformedData>[] = [
      {
        accessorKey: 'index',
        header: '#',
        cell: ({ row }) => <span>{row.index + 1}</span>
      },
      {
        accessorKey: 'from',
        header: 'From',
        cell: ({ getValue }) => {
          const address = String(getValue())
          return (
            <div className='flex items-center max-w-sm truncate justify-center place-items-center'>
              <button
                className='mr-2 truncate'
                onClick={() =>
                  navigate(`/explorer/transactions/accounts/${address}`)
                }
              >
                {address}
              </button>
              <CopyToClipboard value={address} />
            </div>
          )
        }
      },
      {
        accessorKey: 'value',
        header: 'Value',
        cell: ({ getValue }) => {
          const rawValue = parseFloat(
            String(getValue()).replace(/[^\d.-]/g, '')
          )
          return isNaN(rawValue) ? (
            <span>N/A</span>
          ) : (
            <span className='flex flex-row items-center justify-center'>
              {formatLargeNumber(rawValue)}{' '}
              <img
                src='/ogy_logo.svg'
                alt='OGY Logo'
                className='w-5 h-5 ml-2'
              />
            </span>
          )
        }
      },
      {
        accessorKey: 'time',
        header: 'Time',
        cell: ({ getValue }) => (
          <div>
            <Badge className='bg-slate-500/20 px-2'>
              <div className='text-slate-500 text-xs font-semibold shrink-0'>
                {String(getValue())}
              </div>
            </Badge>
          </div>
        )
      }
    ]

    if (type !== 'burns') {
      baseColumns.splice(2, 0, {
        accessorKey: 'to',
        header: 'To',
        cell: ({ getValue }) => {
          const address = String(getValue())
          return (
            <div className='flex items-center max-w-xs truncate justify-center'>
              <button
                className='mr-2 truncate'
                onClick={() =>
                  navigate(`/explorer/transactions/accounts/${address}`)
                }
              >
                {address}
              </button>
              <CopyToClipboard value={address} />
            </div>
          )
        }
      })
    }

    return baseColumns
  }, [type, navigate])

  const handleClick = () => {
    navigate(`/${type}`)
  }

  const isFullChartPage = useMemo(() => {
    return (
      window.location.pathname.includes('transfers') ||
      window.location.pathname.includes('burns')
    )
  }, [])

  return (
    <>
      <h1
        className={`text-4xl sm:text-6xl font-bold text-center ${
          isFullChartPage ? 'mt-16 mb-16' : 'hidden'
        }`}
      >
        {title}
      </h1>
      <Card
        className={`p-6 space-y-6 ${
          isFullChartPage ? 'my-16 w-11/12 mx-auto p-8' : ''
        }`}
      >
        <div className='flex flex-row items-center'>
          <div className='text-lg font-semibold'>{title}</div>
          <Button
            onClick={() => handleClick()}
            className={isFullChartPage ? 'hidden' : 'ml-4'}
          >
            Show All
          </Button>
          <Tooltip id='tooltip_address' />
        </div>
        {isLoading && <Skeleton count={limit} height={52} />}
        {isError && (
          <div className='text-red-500'>
            An error occurred: {error?.message || 'Unknown error'}
          </div>
        )}
        {data && data.length > 0 ? (
          <Table
            columns={columns}
            data={data.map((item, index) => ({ ...item, index }))}
            rowCount={data.length}
            showPageSizeOptions={false}
          />
        ) : (
          !isLoading && (
            <div className='text-center text-gray-500'>No data available.</div>
          )
        )}
        <Tooltip id='tooltip_address' />
      </Card>
    </>
  )
}

export default Chart
