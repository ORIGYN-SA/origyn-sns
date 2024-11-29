import Chart from './Chart'

const ChartFull = ({
  type,
  title
}: {
  type: 'transfers' | 'burns'
  title: string
}) => {
  return <Chart type={type} title={title} limit={25} />
}

export default ChartFull
