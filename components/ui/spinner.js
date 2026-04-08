import { Loader2 } from 'lucide-react'

export function Spinner({ className = '', size = 20, ...props }) {
  return (
    <Loader2
      aria-label="Loading"
      className={`animate-spin ${className}`}
      role="status"
      size={size}
      {...props}
    />
  )
}
