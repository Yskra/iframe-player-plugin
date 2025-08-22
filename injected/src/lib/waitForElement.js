export default function waitForElement(selector) {
  return new Promise((resolve) => {
    waitDocumentLoaded().then(() => {
      const existing = document.body.querySelector(selector);

      if (existing) {
        resolve(existing);
        return;
      }

      const observer = new MutationObserver(() => {
        const existing = document.body.querySelector(selector);

        if (existing) {
          observer.disconnect();
          resolve(existing);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  });
}

function waitDocumentLoaded() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }

    window.addEventListener('DOMContentLoaded', () => {
      resolve();
    });
  });
}
