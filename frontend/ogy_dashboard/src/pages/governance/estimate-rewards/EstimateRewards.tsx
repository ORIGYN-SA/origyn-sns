import Slider, {
  SliderThumb
  // SliderValueLabelProps,
} from '@mui/material/Slider'
import { Mark } from '@mui/base/useSlider'
import { styled } from '@mui/material/styles'
import { Card } from '@components/ui'
import useEstimatedRewards from '@hooks/governance/useEstimatedRewards'
import { useState } from 'react'

interface EstimateRewardsProps {
  className?: string
}

const AirbnbSlider = styled(Slider)(({ theme }) => ({
  color: '#3a8589',
  height: 10,
  padding: '13px 0',
  '& .MuiSlider-thumb': {
    height: 27,
    width: 27,
    backgroundColor: '#fff',
    border: '1px solid currentColor',
    '&:hover': {
      boxShadow: '0 0 0 8px rgba(58, 133, 137, 0.16)'
    },
    '& .airbnb-bar': {
      height: 9,
      width: 1,
      backgroundColor: 'currentColor',
      marginLeft: 1,
      marginRight: 1
    }
  },
  '& .MuiSlider-track': {
    height: 10
  },
  '& .MuiSlider-rail': {
    color: theme.palette.mode === 'dark' ? '#bfbfbf' : '#d8d8d8',
    opacity: theme.palette.mode === 'dark' ? undefined : 1,
    height: 10
  }
}))

interface AirbnbThumbComponentProps extends React.HTMLAttributes<unknown> {}

function AirbnbThumbComponent (props: AirbnbThumbComponentProps) {
  const { children, ...other } = props
  return (
    <SliderThumb {...other}>
      {children}
      <span className='airbnb-bar' />
      <span className='airbnb-bar' />
      <span className='airbnb-bar' />
    </SliderThumb>
  )
}

const EstimateRewards = ({ className, ...restProps }: EstimateRewardsProps) => {
  const { data, isSuccess } = useEstimatedRewards()
  const [activeIndex, setActiveIndex] = useState(1)

  const handleOnChange = (v: Event) => {
    setActiveIndex(Number((v.target as HTMLInputElement).value))
  }

  return (
    <Card className={`${className} text-center xl:text-left`} {...restProps}>
      <h2 className='text-lg font-semibold text-content/60 mb-4'>
        Estimate rewards
      </h2>
      {isSuccess && data && (
        <div className='w-full px-2 py-2 md:px-4 md:py-4 xl:px-2 2xl:px-4'>
          <div className='gap-2'>
            <div className='text-4xl mb-8'>{data[activeIndex - 1].rate}</div>
          </div>
          <AirbnbSlider
            slots={{ thumb: AirbnbThumbComponent }}
            aria-label='Restricted values'
            value={activeIndex}
            step={null}
            valueLabelDisplay='auto'
            min={1}
            max={5}
            marks={data as Mark[]}
            onChange={v => handleOnChange(v)}
          />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mt-6'>
            {activeIndex < 5 && (
              <div className='flex flex-col items-center xl:items-start'>
                <div className='flex flex-col md:flex-row xl:flex-col 2xl:flex-row items-center text-2xl font-semibold md:space-x-4 xl:space-x-0 2xl:space-x-4'>
                  <img
                    src='/ogy_logo.svg'
                    alt='OGY Logo'
                    className='h-14 w-14 object-contain mb-2 md:mb-0 xl:mb-2 2xl:mb-0'
                  />
                  <div className='flex flex-col text-left'>
                    <div className='flex items-baseline'>
                      <span className='text-2xl'>
                        {data[activeIndex - 1].lockedSum}
                      </span>
                      <span className='ml-2 text-content/60 text-2xl'>OGY</span>
                    </div>
                    <div className='text-content/60 text-lg'>
                      <span className='text-content'>
                        {data[activeIndex - 1].countSum}
                      </span>{' '}
                      participants
                    </div>
                  </div>
                </div>
                <div className='text-content/60 mt-2'>
                  currently locked for at least {activeIndex} year
                </div>
              </div>
            )}

            <div className='flex flex-col items-center xl:items-start'>
              <div className='flex flex-col md:flex-row xl:flex-col 2xl:flex-row items-center text-2xl font-semibold md:space-x-4 xl:space-x-0 2xl:space-x-4'>
                <img
                  src='/ogy_logo.svg'
                  alt='OGY Logo'
                  className='h-14 w-14 object-contain mb-2 md:mb-0 xl:mb-2 2xl:mb-0'
                />
                <div className='flex flex-col text-left'>
                  <div className='flex items-baseline'>
                    <span className='text-2xl'>
                      {data[activeIndex - 1].locked}
                    </span>
                    <span className='ml-2 text-content/60 text-2xl'>OGY</span>
                  </div>
                  <div className='text-content/60 text-lg'>
                    <span className='text-content'>
                      {data[activeIndex - 1].count}
                    </span>{' '}
                    participants
                  </div>
                </div>
              </div>
              <div className='text-content/60 mt-2'>
                currently locked for {activeIndex} year
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default EstimateRewards
