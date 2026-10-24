/* Biotechnology Forms Portal — service worker
   Keeps the app shell available offline and enables the Android install banner. */

const CACHE = 'biotech-forms-v1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Never cache Drive or Apps Script — those must always be live.
  const url = new URL(req.url);
  if (url.hostname.includes('google.com') || url.hostname.includes('googleusercontent.com')) return;

  // App shell: network first, fall back to cache when offline.
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
