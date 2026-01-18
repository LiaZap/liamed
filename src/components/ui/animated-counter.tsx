import { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}

export function AnimatedCounter({
    value,
    duration = 1500,
    prefix = '',
    suffix = '',
    decimals = 0
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const startTime = useRef<number | null>(null);
    const animationFrame = useRef<number | null>(null);

    useEffect(() => {
        if (value === 0) {
            setDisplayValue(0);
            return;
        }

        const animate = (timestamp: number) => {
            if (!startTime.current) {
                startTime.current = timestamp;
            }

            const progress = Math.min((timestamp - startTime.current) / duration, 1);

            // Easing function for smooth deceleration
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            const currentValue = easeOutQuart * value;
            setDisplayValue(currentValue);

            if (progress < 1) {
                animationFrame.current = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
            }
        };

        startTime.current = null;
        animationFrame.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, [value, duration]);

    const formattedValue = decimals > 0
        ? displayValue.toFixed(decimals)
        : Math.floor(displayValue).toLocaleString('pt-BR');

    return (
        <span className="tabular-nums">
            {prefix}{formattedValue}{suffix}
        </span>
    );
}
