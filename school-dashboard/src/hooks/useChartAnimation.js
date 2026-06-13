import useReducedMotion from "./useReducedMotion";

/**
 * Returns Recharts animation props that respect the user's reduced-motion
 * preference. Spread the result onto chart components or graphical elements.
 */
export function useChartAnimation() {
  const reduced = useReducedMotion();
  return {
    isAnimationActive: !reduced,
    animationDuration: reduced ? 0 : 1500,
    animationBegin: reduced ? 0 : 0,
  };
}

export default useChartAnimation;
