import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-emerald-500"
  if (confidence >= 60) return "text-amber-500"
  return "text-orange-500"
}

export function getStatusColor(status: string): string {
  if (status === "resolved_correct") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  if (status === "resolved_incorrect") return "bg-red-500/10 text-red-600 dark:text-red-400"
  return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
}
