import React from 'react';
import { useCountdown } from './useCountdownTimer';

const ExpiredNotice = () => {
    return (
        <div className="expired-notice flex flex-row">
            <p>00</p>
            <p>:</p>
            <p>00</p>
            <p>:</p>
            <p>00</p>
        </div>
    );
};

const ShowCounter = ({ days, hours, minutes }) => {
    return (
        <div className="show-counter flex">
            <DateTimeDisplay value={days} isDanger={days <= 3} />
            <p>:</p>
            <DateTimeDisplay value={hours} isDanger={false} />
            <p>:</p>
            <DateTimeDisplay value={minutes} isDanger={false} />
        </div>
    );
};

const CountdownTimer = ({ targetDate }) => {
    const [days, hours, minutes, seconds] = useCountdown(targetDate);

    if (Number(days) + Number(hours) + Number(minutes) + Number(seconds) <= 0) {
        return <ExpiredNotice />;
    } else {
        return <ShowCounter days={days} hours={hours} minutes={minutes} />;
    }
};

const DateTimeDisplay = ({ value, isDanger }) => {
    return (
        <div className={isDanger ? 'countdown danger' : 'countdown'}>
            <p>{String(value).padStart(2, '0')}</p>
        </div>
    );
};

export default CountdownTimer;
