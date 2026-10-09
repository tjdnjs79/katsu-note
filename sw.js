// 오프라인에서도 열리도록 앱 파일을 폰에 저장해 두는 서비스 워커
// 앱 파일을 고쳐서 다시 올릴 때는 아래 버전 숫자를 올려주세요 (v1 -> v2).
var VERSION = 'katsu-note-v1';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// 저장된 파일을 먼저 보여주고, 인터넷이 되면 뒤에서 새 파일로 갱신
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(function (cache) {
      return cache.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(function () { return hit || cache.match('./index.html'); });
        return hit || net;
      });
    })
  );
});
