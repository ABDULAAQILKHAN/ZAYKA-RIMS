import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to format dates consistently across server and client
export function formatOrderDate(dateString: string) {
  const date = new Date(dateString)

  // Use consistent formatting to prevent hydration mismatches
  return {
    date: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
}

// Format currency consistently
export function formatCurrency(amount: number) {
  return `₹${amount}`
}
