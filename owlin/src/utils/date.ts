import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns'

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM dd, yyyy HH:mm:ss')
}

export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'HH:mm:ss')
}

export const getDuration = (startTime: Date | string, endTime?: Date | string): number => {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime
  const end = endTime ? (typeof endTime === 'string' ? new Date(endTime) : endTime) : new Date()
  return differenceInSeconds(end, start)
}

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}
