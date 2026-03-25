/**
 * Parses a failed fetch Response into a standardized Error object.
 * Attach `.status` and `.details` so callers can inspect them.
 *
 * @param {Response} response - A fetch Response where response.ok === false
 * @returns {Promise<Error>}
 */
export async function parseApiError(response) {
  const body = await response.json().catch(() => ({}));
  const message =
    body.error || body.message || `Request failed with status ${response.status}`;
  const error = new Error(message);
  error.status = response.status;
  error.details = body.details ?? body;
  return error;
}
