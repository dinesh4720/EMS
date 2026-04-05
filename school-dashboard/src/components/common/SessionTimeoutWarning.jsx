import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { silentRefresh } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '../../utils/constants';

// Configurable via APP_CONFIG in utils/constants.js
const IDLE_TIMEOUT_MS = APP_CONFIG.SESSION_IDLE_TIMEOUT_MS;
const WARNING_COUNTDOWN_S = APP_CONFIG.SESSION_WARNING_COUNTDOWN_S;
const ACTIVITY_THROTTLE_MS = APP_CONFIG.ACTIVITY_THROTTLE_MS;

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointermove'];

export default function SessionTimeoutWarning() {
  const { t } = useTranslation();
  const { logout, isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_COUNTDOWN_S);

  const idleTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const throttleRef = useRef(false);
  const showWarningRef = useRef(false);

  // Timestamp-based deadlines — immune to browser timer throttling
  const idleDeadlineRef = useRef(Date.now() + IDLE_TIMEOUT_MS);
  const countdownDeadlineRef = useRef(null);

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
    idleDeadlineRef.current = Date.now() + IDLE_TIMEOUT_MS;
    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(WARNING_COUNTDOWN_S);
      countdownDeadlineRef.current = Date.now() + WARNING_COUNTDOWN_S * 1000;
    }, IDLE_TIMEOUT_MS);
  }, []);

  // When the tab becomes visible again, check timestamps to catch up
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !isAuthenticated) return;

      const now = Date.now();

      // If countdown is active, check if it expired while minimized
      if (countdownDeadlineRef.current) {
        const remaining = Math.ceil((countdownDeadlineRef.current - now) / 1000);
        if (remaining <= 0) {
          clearAllTimers();
          countdownDeadlineRef.current = null;
          logout();
          return;
        }
        setSecondsLeft(remaining);
        return;
      }

      // If idle deadline passed while minimized, show warning immediately
      if (idleDeadlineRef.current && now >= idleDeadlineRef.current) {
        clearAllTimers();
        // Check if the full countdown would have also expired
        const overdue = now - idleDeadlineRef.current;
        if (overdue >= WARNING_COUNTDOWN_S * 1000) {
          logout();
          return;
        }
        const remaining = WARNING_COUNTDOWN_S - Math.floor(overdue / 1000);
        setShowWarning(true);
        setSecondsLeft(remaining);
        countdownDeadlineRef.current = idleDeadlineRef.current + WARNING_COUNTDOWN_S * 1000;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, logout, clearAllTimers]);

  // Keep ref in sync so handleActivity can read it without re-creating
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const handleActivity = useCallback(() => {
    if (throttleRef.current) return;
    throttleRef.current = true;
    setTimeout(() => { throttleRef.current = false; }, ACTIVITY_THROTTLE_MS);

    // Only reset if warning is NOT showing — user must explicitly click "Stay Logged In"
    if (!showWarningRef.current) {
      resetIdleTimer();
    }
  }, [resetIdleTimer]);

  // Start idle tracking when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      setShowWarning(false);
      countdownDeadlineRef.current = null;
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

  // Countdown timer when warning is showing — uses deadline for accuracy
  useEffect(() => {
    if (!showWarning) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      countdownDeadlineRef.current = null;
      return;
    }

    if (!countdownDeadlineRef.current) {
      countdownDeadlineRef.current = Date.now() + WARNING_COUNTDOWN_S * 1000;
    }

    countdownRef.current = setInterval(() => {
      const remaining = Math.ceil((countdownDeadlineRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        countdownDeadlineRef.current = null;
        logout();
        return;
      }
      setSecondsLeft(remaining);
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
    countdownDeadlineRef.current = null;

    // Refresh the token to extend the session
    const refreshed = await silentRefresh();
    if (!refreshed) {
      logout();
      return;
    }

    resetIdleTimer();
  };

  const handleLogout = () => {
    setShowWarning(false);
    clearAllTimers();
    countdownDeadlineRef.current = null;
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
          <span>{t('components.sessionExpiringSoon')}</span>
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
