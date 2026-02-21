import { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-white border border-gray-200 rounded-lg', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ children, className, ...props }: CardProps) {
  return <div className={cn('p-6', className)} {...props}>{children}</div>
}
