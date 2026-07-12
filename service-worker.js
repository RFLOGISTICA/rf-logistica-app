// RF Logística — service worker (v92)
// Guarda uma cópia local dos arquivos do app (não dos dados) pra abrir
// rápido e funcionar mesmo com internet ruim. Os dados (Supabase) NUNCA
// passam por aqui — sempre vêm direto da rede, na hora.
//
// IMPORTANTE: sempre que subir uma versão nova do sistema, troque o nome
// da CACHE abaixo (ex: "rf-logistica-v93") — assim o celular do motorista
// busca a versão nova em vez de continuar preso na antiga.
const CACHE = "rf-logistica-v92";
const ARQUIVOS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (evt) {
  evt.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(ARQUIVOS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (evt) {
  evt.waitUntil(
    caches.keys()
      .then(function (nomes) {
        return Promise.all(nomes.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (evt) {
  var url = new URL(evt.request.url);
  // nunca cacheia chamadas ao Supabase — dados sempre em tempo real, nunca do cache
  if (url.hostname.indexOf("supabase.co") !== -1) return;
  if (evt.request.method !== "GET") return;

  evt.respondWith(
    caches.match(evt.request).then(function (doCache) {
      var daRede = fetch(evt.request).then(function (resp) {
        if (resp && resp.status === 200) {
          var copia = resp.clone();
          caches.open(CACHE).then(function (cache) { cache.put(evt.request, copia); });
        }
        return resp;
      }).catch(function () { return doCache; });
      return doCache || daRede;
    })
  );
});
