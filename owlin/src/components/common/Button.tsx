import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export default function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded-md font-medium text-sm transition-colors'

  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}
