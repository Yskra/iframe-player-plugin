/* eslint-disable no-undef, antfu/no-import-dist */
/** @import {HTMLRewriterElementContentHandlers} from '@cloudflare/workers-types' */

import script from '../../../dist/injected.iife.js?raw';

/**
 * Get rewriter
 * @param {Request} request
 * @param {Response} response
 * @param {URL} targetUrl
 * @return {Response}
 */
export default function transformResponse(request, response, targetUrl) {
  /** @type {{selector: string, handlers: HTMLRewriterElementContentHandlers}[]} */
  const pipeline = [
    injectScript(),
    fixUserIp(request),
    rewriteAssetUrls(request, targetUrl),
  ]
    .flat();

  const rewriter = new HTMLRewriter();

  for (const { selector, handlers } of pipeline) {
    rewriter.on(selector, handlers);
  }

  return rewriter.transform(response);
}

/**
 * inject main script to body
 * @return {{selector: string, handlers: HTMLRewriterElementContentHandlers}}
 */
function injectScript() {
  const scriptToInject = `<script>${script}</script>`;

  return {
    selector: 'head',
    handlers: {
      element(element) {
        element.after(scriptToInject.trim(), { html: true });
      },
    },
  };
}

/**
 * update userIP, if cdn check it
 * @param {Request} request
 * @return {{selector: string, handlers: HTMLRewriterElementContentHandlers}}
 */
function fixUserIp(request) {
  const userIp = request.headers.get('CF-Connecting-IP');

  if (!userIp) { // on local development is null
    return {};
  }

  return {
    selector: 'script',
    handlers: {
      text(textChunk) {
        if (textChunk.text.includes('"userIp"')) {
          return textChunk.text.replace(/"userIp"\s*:\s*"([^"]+)"/, `"userIp": "${userIp}"`);
        }
      },
    },
  };
}

/**
 * Rewrite URLs in script and link tags to use the original domain.
 * @param {URL} targetUrl
 * @param {Request} request
 * @return {{selector: string, handlers: HTMLRewriterElementContentHandlers}[]}
 */
function rewriteAssetUrls(request, targetUrl) {
  const url = new URL(request.url);
  const proxyTargetUrl = `${url.origin}/${targetUrl.origin}`;

  return [
    // {
    //   selector: 'head',
    //   handlers: {
    //     element(element) {
    //       element.before(`<base href="${proxyTargetUrl}">`, { html: true });
    //     },
    //   },
    // },
    // {
    //   selector: 'script',
    //   handlers: {
    //     element(element) {
    //       const src = element.getAttribute('src');
    //
    //       if (src) {
    //         if (src.startsWith('/')) {
    //           element.setAttribute('src', `${proxyTargetUrl}/${src}`);
    //         }
    //         if (src.startsWith('./')) {
    //           element.setAttribute('src', `${proxyTargetUrl}/${src.slice(1)}`);
    //         }
    //       }
    //
    //       element.removeAttribute('integrity');
    //     },
    //   },
    // },
    // {
    //   selector: 'link',
    //   handlers: {
    //     element(element) {
    //       const href = element.getAttribute('href');
    //
    //       if (href && href.startsWith('/')) {
    //         element.setAttribute('href', `${proxyTargetUrl}/${href}`);
    //       }
    //
    //       element.removeAttribute('integrity');
    //     },
    //   },
    // },
  ];
}
