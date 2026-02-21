import { useEffect } from 'react'
import { useEventStore } from '../store/useEventStore'
import { socketService } from '../services/socket'
import { LiveSession } from '../types'

export const useLiveSessions = () => {
  const { liveSessions, setLiveSessions, updateLiveSession, removeLiveSession } = useEventStore()

  useEffect(() => {
    socketService.connect()

    const handleSessionJoin = (session: LiveSession) => {
      setLiveSessions([...liveSessions, session])
    }

    const handleSessionLeave = (sessionId: string) => {
      removeLiveSession(sessionId)
    }

    const handleSessionUpdate = (session: LiveSession) => {
      updateLiveSession(session.id, session)
    }

    socketService.onLiveSessionJoin(handleSessionJoin)
    socketService.onLiveSessionLeave(handleSessionLeave)
    socketService.onLiveSessionUpdate(handleSessionUpdate)

    return () => {
      socketService.offLiveSessionJoin(handleSessionJoin)
      socketService.offLiveSessionLeave(handleSessionLeave)
      socketService.offLiveSessionUpdate(handleSessionUpdate)
    }
  }, [liveSessions, setLiveSessions, updateLiveSession, removeLiveSession])

  return { liveSessions }
}
