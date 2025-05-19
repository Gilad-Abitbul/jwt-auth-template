import { Button } from 'react-bootstrap';
import { useEffect, useRef, useState } from 'react';

interface CountdownButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: string;
  type?: 'button' | 'submit';
  onClick?: () => void | Promise<void>;
  countdownSeconds?: number;
  disabled?: boolean;
  id?: string;
}

export default function CountdownButton({
  children,
  className = '',
  variant = 'primary',
  type = 'submit',
  onClick,
  countdownSeconds,
  disabled = false,
  ...rest
}: CountdownButtonProps) {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Start countdown when countdownSeconds changes
  useEffect(() => {

    if (typeof countdownSeconds === 'number' && countdownSeconds > 0) {
      // Start countdown
      setRemaining(countdownSeconds);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = window.setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [countdownSeconds]);

  const handleClick = () => {
    if (type === 'button' && onClick && remaining === 0) {
      onClick();
    }
  };

  const isDisabled = disabled || remaining > 0;
  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const padded = (n: number) => String(n).padStart(2, '0');

    if (h > 0) {
      return `${padded(h)}:${padded(m)}:${padded(s)}`;
    } else {
      return `${padded(m)}:${padded(s)}`;
    }
  }
  return (
    <Button
      {...rest}
      type={type}
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {children}
      {remaining > 0 && ` (${formatTime(remaining)})`}
    </Button>
  );
}
