/**
 * Validate response
 * @param {Response} response
 * @return {boolean}
 */
export default function validateResponse(response) {
  const contentType = response.headers.get('Content-Type') || '';

  return contentType.includes('text/html');
}
