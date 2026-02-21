import { Event, EventType } from '../types'

export const getEventTypeColor = (type: EventType): string => {
  const colors: Record<EventType, string> = {
    click: 'text-blue-600',
    hover: 'text-gray-400',
    scroll: 'text-purple-400',
    navigation: 'text-green-600',
    form_submit: 'text-orange-600',
    form_focus: 'text-yellow-600',
    api_call: 'text-cyan-600',
    error: 'text-red-600',
    custom: 'text-indigo-600',
  }
  return colors[type] || 'text-gray-600'
}

export const getEventTypeLabel = (type: EventType): string => {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export const filterEventsByPage = (events: Event[], page: string): Event[] => {
  return events.filter(event => event.page === page)
}

export const filterEventsByType = (events: Event[], type: EventType): Event[] => {
  return events.filter(event => event.type === type)
}

export const filterEventsByUser = (events: Event[], userId: string): Event[] => {
  return events.filter(event => event.userId === userId)
}

export const filterEventsBySession = (events: Event[], sessionId: string): Event[] => {
  return events.filter(event => event.sessionId === sessionId)
}

export const groupEventsByPage = (events: Event[]): Record<string, Event[]> => {
  return events.reduce((acc, event) => {
    if (!acc[event.page]) {
      acc[event.page] = []
    }
    acc[event.page].push(event)
    return acc
  }, {} as Record<string, Event[]>)
}

export const groupEventsByType = (events: Event[]): Record<EventType, Event[]> => {
  return events.reduce((acc, event) => {
    if (!acc[event.type]) {
      acc[event.type] = []
    }
    acc[event.type].push(event)
    return acc
  }, {} as Record<EventType, Event[]>)
}
