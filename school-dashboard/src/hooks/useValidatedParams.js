import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { isObjectId } from '../utils/objectIdHelper';

/**
 * Hook that validates route params (e.g. MongoDB ObjectIds) before they're used in API calls.
 * If a param is present but fails validation, navigates back and returns isValid: false.
 *
 * @param {Object} rules - Map of param name to validation type. Supported: 'objectId'
 * @param {Object} [options]
 * @param {string} [options.redirectTo] - Path to redirect on invalid param (default: go back)
 * @returns {{ params: Object, isValid: boolean }}
 *
 * @example
 *   const { params: { id }, isValid } = useValidatedParams({ id: 'objectId' });
 *   if (!isValid) return null;
 */
export function useValidatedParams(rules = {}, options = {}) {
  const params = useParams();
  const navigate = useNavigate();
  const { redirectTo } = options;

  // Serialize rules to a stable string so inline object literals don't
  // cause useMemo to recompute on every render.
  const rulesKey = JSON.stringify(rules);

  const isValid = useMemo(() => {
    const parsed = JSON.parse(rulesKey);
    for (const [key, type] of Object.entries(parsed)) {
      const value = params[key];
      if (!value) continue; // missing params handled by the page itself
      if (type === 'objectId' && !isObjectId(value)) {
        return false;
      }
    }
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, rulesKey]);

  useEffect(() => {
    if (!isValid) {
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else {
        navigate(-1);
      }
    }
  }, [isValid, navigate, redirectTo]);

  return { params, isValid };
}
