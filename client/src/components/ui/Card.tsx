import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className, onClick, hover }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        hover && 'hover:shadow-md hover:border-gray-300 transition-shadow cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('px-6 py-4 border-b border-gray-100', className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>;
}
