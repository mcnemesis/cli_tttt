/*----------------------
 * offline_mode.js
 * ---------------------
 *  To automatically intercept all static resources on page
 *  and register them to the cache service worker that will
 *  help make them all available in offline mode
 *  ----------------------------------------------------------*/
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('resources/offline/sw.js').then(reg => {
    const assets = [
      location.pathname,
      ...Array.from(document.querySelectorAll('link[rel="stylesheet"], script[src], img[src]'))
        .map(el => el.href || el.src)
    ];
    navigator.serviceWorker.controller?.postMessage({ assets });
  });
}
