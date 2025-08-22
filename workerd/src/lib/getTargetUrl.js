/**
 * Get target url from request
 * @param {Request} request
 * @return {URL | Response}
 */
export default function getTargetUrl(request) {
  const url = new URL(request.url);
  const targetUrl = url.href.replace(`${url.origin}/`, '');

  if (!targetUrl) {
    return new Response('Missing /url', { status: 400 });
  }

  try {
    return new URL(targetUrl);
  }
  catch (e) {
    return new Response('Invalid URL', { status: 400 });
  }
}
