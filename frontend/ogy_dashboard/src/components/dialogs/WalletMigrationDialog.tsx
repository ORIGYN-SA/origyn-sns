import { Dialog } from '@components/ui'
import { useState, useEffect } from 'react'

const useCountdown = (targetDate: Date) => {
  const calculateTimeLeft = () => {
    const difference = +targetDate - +new Date()
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    }

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }

    return timeLeft
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate])

  return timeLeft
}

const WalletMigrationDialog = () => {
  const [isOpen, setIsOpen] = useState(true)
  const targetDate = new Date('2024-12-19T23:59:59')
  const timeLeft = useCountdown(targetDate)

  const formatTime = (value: number | undefined) =>
    (value || 0).toString().padStart(2, '0')

  if (!isOpen) return null

  return (
    <Dialog show={isOpen} handleClose={() => setIsOpen(false)}>
      <div className='px-12 pb-12 flex flex-col justify-center items-center w-full'>
        {/* Header */}
        <h2 className='text-3xl text-center font-semibold text-white mb-6 flex items-center gap-2'>
          <span className='text-2xl'>⚠️</span> Attention!
        </h2>

        {/* Description */}
        <p className=' text-gray-300 mb-4 text-center'>
          <span className='text-orange-400'>Stoic</span>,{' '}
          <span className='text-orange-400'>AstroX ME</span> and{' '}
          <span className='text-orange-400'>Bitfinity Wallets</span> will be{' '}
          <span className='text-orange-400'>deprecated</span>. <br /> Users will
          need to migrate to Plug, Internet Identity, or NFID!
        </p>

        {/* Timer */}
        <div className='text-center font-bold text-lg mb-4 text-gray-200'>
          Time remaining for migration:
        </div>
        <div className='grid grid-cols-4 gap-4 text-center'>
          <div className='bg-gray-100 p-4 rounded-md'>
            <div className='text-2xl font-bold text-gray-800'>
              {formatTime(timeLeft?.days)}
            </div>
            <div className='text-xs text-gray-600'>Days</div>
          </div>
          <div className='bg-gray-100 p-4 rounded-md'>
            <div className='text-2xl font-bold text-gray-800'>
              {formatTime(timeLeft?.hours)}
            </div>
            <div className='text-xs text-gray-600'>Hours</div>
          </div>
          <div className='bg-gray-100 p-4 rounded-md'>
            <div className='text-2xl font-bold text-gray-800'>
              {formatTime(timeLeft?.minutes)}
            </div>
            <div className='text-xs text-gray-600'>Minutes</div>
          </div>
          <div className='bg-gray-100 p-4 rounded-md'>
            <div className='text-2xl font-bold text-gray-800'>
              {formatTime(timeLeft?.seconds)}
            </div>
            <div className='text-xs text-gray-600'>Seconds</div>
          </div>
        </div>

        {/* Footer */}
        <button
          className='w-full mt-6 bg-black/50 text-white hover:bg-black/100  py-2 rounded-md font-semibold'
          onClick={() => setIsOpen(false)}
        >
          Got it
        </button>
      </div>
    </Dialog>
  )
}

export default WalletMigrationDialog
