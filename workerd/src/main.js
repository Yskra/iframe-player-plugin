
import getTargetUrl from './lib/getTargetUrl.js';
import transformResponse from './lib/transformResponse.js';
import validateResponse from './lib/validateResponse.js';

export default {
  async fetch(request, env, ctx) {
    const targetUrl = getTargetUrl(request);

    if (targetUrl instanceof Response) {
      return targetUrl;
    }

    try {
      const response = await fetch(targetUrl, {
        headers: request.headers,
      });

      if (!validateResponse(response)) {
        return response;
      }

      return transformResponse(request, response, targetUrl);
    }
    catch (e) {
      return new Response(`Error fetching URL: ${e.message}`, { status: 500 });
    }
  },
};
