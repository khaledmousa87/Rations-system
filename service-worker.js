/* Service Worker — نظام صرف مقررات التموين */
const CACHE = "rations-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // لا نخزّن طلبات Supabase أو الـAPI — تعدي مباشرة للشبكة
  if (url.hostname.endsWith("supabase.co") || url.pathname.includes("/rest/") || url.pathname.includes("/realtime/")) {
    return; // default network
  }
  if (e.request.method !== "GET") return;
  // cache-first لملفات التطبيق، مع تحديث في الخلفية
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const net = fetch(e.request).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
