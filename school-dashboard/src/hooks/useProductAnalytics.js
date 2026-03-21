import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackPageView, identifyUser } from '../lib/analytics';

/**
 * Hook that tracks route changes and identifies the authenticated user
 * for GA4 + Mixpanel. Call once inside the authenticated app shell.
 */
export function useProductAnalytics() {
  const location = useLocation();
  const { user } = useAuth();
  const identifiedRef = useRef(null);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // Identify user once after login
  useEffect(() => {
    if (user && user.id !== identifiedRef.current) {
      identifiedRef.current = user.id;
      identifyUser(user);
    }
  }, [user]);
}
