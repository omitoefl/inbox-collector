const CACHE_NAME = 'inbox-collector-v34';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './collections_data.js',
  './collections_data.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './apple-touch-icon-180x180.png',
  './favicon.png',
  './favicon.ico',
  './favicon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // 只快取同源靜態資源，GAS API 請求絕不走快取
  if (event.request.url.includes('script.google.com') || event.request.method !== 'GET') {
    return;
  }
  // HTML / 首頁 / 收藏資料採用 Network-First，離線才走 Cache，確保最新內容與修復即時生效
  const isNetworkFirst = event.request.mode === 'navigate' ||
    event.request.url.endsWith('index.html') ||
    event.request.url.endsWith('/') ||
    event.request.url.includes('collections_data.js') ||
    event.request.url.includes('collections_data.json');

  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
