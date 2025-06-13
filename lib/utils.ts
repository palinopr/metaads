import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumberWithCommas = (value: number | string | undefined, decimals = 0): string => {
  if (value === undefined || value === null || value === "") return "-"
  const num = Number(value)
  if (isNaN(num)) return "-"
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === "") return "-"
  const num = Number(value)
  if (isNaN(num)) return "-"
  return num.toLocaleString(undefined, {
    style: "currency",
    currency: "USD", // Assuming USD
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const formatPercentage = (value: number | string | undefined, multiplyBy100 = false): string => {
  if (value === undefined || value === null || value === "") return "-"
  let num = Number(value)
  if (isNaN(num)) return "-"
  if (multiplyBy100) {
    num = num * 100
  }
  return `${num.toFixed(2)}%`
}

export const safeToFixed = (value: number | string | undefined, decimals = 2): string => {
  if (value === undefined || value === null || value === "") return "0"
  const num = Number(value)
  if (isNaN(num)) return "0"
  return num.toFixed(decimals)
}
