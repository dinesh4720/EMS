import { useEffect } from 'react'
import { useEventStore } from '../store/useEventStore'
import { eventsApi } from '../services/api'
import { socketService } from '../services/socket'
import { AnalyticsFilter } from '../types'

export const useEvents = (filter?: AnalyticsFilter) => {
  const { events, setEvents, isLoading, setLoading, error, setError } = useEventStore()

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const response = await eventsApi.getEvents(filter)
        // Handle { success: true, events: [...], pagination: {...} } format
        const data = response.events || []
        setEvents(Array.isArray(data) ? data : [])
        setError(null)
      } catch (err) {
        console.error('[Owlin] Failed to fetch events:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [filter, setEvents, setLoading, setError])

  return { events, isLoading, error }
}

export const useLiveEvents = () => {
  const { liveEvents, addLiveEvent } = useEventStore()

  useEffect(() => {
    socketService.connect()

    const handleLiveEvent = (event: any) => {
      addLiveEvent(event)
    }

    socketService.onLiveEvent(handleLiveEvent)

    return () => {
      socketService.offLiveEvent(handleLiveEvent)
    }
  }, [addLiveEvent])

  return { liveEvents }
}
