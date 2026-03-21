import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { silentRefresh } from '../../services/api';

// Show warning after 30 minutes of inactivity
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
// Auto-logout 2 minutes after warning appears
const WARNING_COUNTDOWN_S = 120;
// Throttle activity tracking to once per 30 seconds
const ACTIVITY_THROTTLE_MS = 30 * 1000;

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointermove'];

export default function SessionTimeoutWarning() {
  const { logout, isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_COUNTDOWN_S);

  const idleTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const throttleRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(WARNING_COUNTDOWN_S);
    }, IDLE_TIMEOUT_MS);
  }, []);

  const handleActivity = useCallback(() => {
    if (throttleRef.current) return;
    throttleRef.current = true;
    setTimeout(() => { throttleRef.current = false; }, ACTIVITY_THROTTLE_MS);

    lastActivityRef.current = Date.now();
    // Only reset if warning is NOT showing — user must explicitly click "Stay Logged In"
    if (!showWarning) {
      resetIdleTimer();
    }
  }, [showWarning, resetIdleTimer]);

  // Start idle tracking when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    resetIdleTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      clearAllTimers();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [isAuthenticated, handleActivity, resetIdleTimer, clearAllTimers]);

  // Countdown timer when warning is showing
  useEffect(() => {
    if (!showWarning) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [showWarning, logout]);

  const handleStayLoggedIn = async () => {
    setShowWarning(false);
    clearAllTimers();

    // Refresh the token to extend the session
    const refreshed = await silentRefresh();
    if (!refreshed) {
      logout();
      return;
    }

    lastActivityRef.current = Date.now();
    resetIdleTimer();
  };

  const handleLogout = () => {
    setShowWarning(false);
    clearAllTimers();
    logout();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  if (!isAuthenticated) return null;

  return (
    <Modal
      isOpen={showWarning}
      onClose={handleStayLoggedIn}
      isDismissable={false}
      hideCloseButton
      classNames={{
        backdrop: 'bg-black/60 backdrop-blur-sm',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Clock size={20} className="text-warning" />
          <span>Session Expiring Soon</span>
        </ModalHeader>
        <ModalBody>
          <p className="text-default-600">
            You&apos;ve been inactive for a while. Your session will expire to protect your account.
          </p>
          <div className="flex items-center justify-center my-4">
            <div className="text-4xl font-mono font-bold text-danger tabular-nums">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
          <p className="text-sm text-default-400 text-center">
            Any unsaved work may be lost if you are logged out.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            startContent={<LogOut size={16} />}
            onPress={handleLogout}
          >
            Log Out
          </Button>
          <Button
            color="primary"
            onPress={handleStayLoggedIn}
          >
            Stay Logged In
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
