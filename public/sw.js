// Service worker mínimo: garante a instalabilidade do PWA sem interferir
// no fluxo de autenticação nem cachear dados dinâmicos (palpites/resultados).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // pass-through: a rede resolve tudo; o app exige internet por design.
});
