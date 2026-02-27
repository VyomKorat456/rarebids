import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ targetDate, mode = 'compact' }) => {
    const calculateTimeLeft = () => {
        const difference = new Date(targetDate) - new Date();

        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
                ended: false
            };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (timeLeft.ended) {
        return mode === 'detailed' ? (
            <div className="p-3 bg-light rounded text-center text-muted border">
                <span className="fw-bold">Auction Ended</span>
            </div>
        ) : (
            <span className="text-muted">Ended</span>
        );
    }

    if (mode === 'detailed') {
        const timeBlocks = [
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Mins', value: timeLeft.minutes },
            { label: 'Secs', value: timeLeft.seconds }
        ];

        return (
            <div className="d-flex gap-3 justify-content-center">
                {timeBlocks.map((block, index) => (
                    <div key={index} className="text-center">
                        <div
                            className="d-flex align-items-center justify-content-center shadow-sm mb-1"
                            style={{
                                width: '60px',
                                height: '60px',
                                background: '#2C3E50',
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '1.5rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {String(block.value).padStart(2, '0')}
                        </div>
                        <small className="text-muted text-uppercase" style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{block.label}</small>
                    </div>
                ))}
            </div>
        );
    }

    // Default: Compact Mode (e.g. "2d 4h left")
    // Logic: Show largest two units
    let displayText = "";
    if (timeLeft.days > 0) {
        displayText = `${timeLeft.days}d ${timeLeft.hours}h left`;
    } else if (timeLeft.hours > 0) {
        displayText = `${timeLeft.hours}h ${timeLeft.minutes}m left`;
    } else if (timeLeft.minutes > 0) {
        displayText = `${timeLeft.minutes}m ${timeLeft.seconds}s left`;
    } else {
        displayText = `${timeLeft.seconds}s left`;
    }

    return (
        <span className="d-flex align-items-center gap-1">
            <Clock size={12} /> {displayText}
        </span>
    );
};

export default CountdownTimer;
