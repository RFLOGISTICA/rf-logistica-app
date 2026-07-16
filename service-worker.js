// v1 (15/07/2026) — "kill switch": este service worker NAO cacheia mais nada.
// Motivo: versoes antigas em cache em varios aparelhos causaram perda TOTAL
// dos dados da empresa (mais de uma vez no mesmo dia), porque o codigo JS
// antigo tinha um bug grave que sobrescrevia a nuvem. Cache agressivo de PWA
// + bug de dados = combinacao perigosa. A partir de agora, todo aparelho
// sempre busca a versao mais nova na rede — nunca mais fica preso no cache.
self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.map(function (nome) { return caches.delete(nome); }));
    }).then(function () {
      return self.clients.claim();
    }).then(function () {
      return self.clients.matchAll({ type: "window" });
    }).then(function (clientes) {
      clientes.forEach(function (c) { c.navigate(c.url); });
    })
  );
});

// Sem "fetch" handler: nenhuma requisicao e interceptada, tudo vai direto
// pra rede como um site normal (sem cache de service worker).
