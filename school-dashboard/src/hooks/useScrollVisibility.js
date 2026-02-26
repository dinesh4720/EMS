import { useEffect, useRef, useState } from 'react';

/**
 * Hook that detects scrolling and adds a 'scrolling' class to the element
 * The class is removed after a delay when scrolling stops
 * 
 * @param {number} delay - Time in ms to wait after scrolling stops before removing the class (default: 1000ms)
 * @returns {React.RefObject} - Ref to attach to the scrollable element
 */
export function useScrollVisibility(delay = 1000) {
  const elementRef = useRef(null);
  const timeoutRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      console.log('[useScrollVisibility] No element found for ref');
      return;
    }

    console.log('[useScrollVisibility] Attached to element:', element);

    const handleScroll = () => {
      console.log('[useScrollVisibility] Scroll event detected');
      // Add scrolling class
      setIsScrolling(true);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to remove class after delay
      timeoutRef.current = setTimeout(() => {
        console.log('[useScrollVisibility] Removing scrolling class');
        setIsScrolling(false);
      }, delay);
    };

    // Use passive listener for better performance
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay]);

  // Update the class based on scrolling state
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    console.log('[useScrollVisibility] isScrolling state:', isScrolling, 'Element classes:', element.className);
    
    if (isScrolling) {
      element.classList.add('scrolling');
      console.log('[useScrollVisibility] Added .scrolling class');
    } else {
      element.classList.remove('scrolling');
      console.log('[useScrollVisibility] Removed .scrolling class');
    }
  }, [isScrolling]);

  return elementRef;
}

export default useScrollVisibility;
