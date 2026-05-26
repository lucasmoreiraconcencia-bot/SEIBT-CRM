// ═══════════════════════════════════════════════════════════════════
// SEIBT CRM — Service Worker
// Estratégia: Network-first para a aplicação (sempre busca a versão
// mais recente), cache como fallback se offline.
// ═══════════════════════════════════════════════════════════════════

const CACHE_NAME   = 'seibt-crm-v1';
const OFFLINE_PAGE = './CRM_SEIBT.html';

// Arquivos para pré-cachear na instalação
const PRE_CACHE = [
  './CRM_SEIBT.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// ── Install: pré-carrega os arquivos essenciais ──────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRE_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: limpa caches antigos ───────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Network-first, cache como fallback ─────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Requisições externas (Supabase, Google Apps Script) → sempre rede
  const isExternal =
    url.hostname.includes('supabase.co')    ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('script.google.com');

  if (isExternal) {
    // Passa direto para a rede, sem cache
    return;
  }

  // Arquivos locais → Network-first
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Atualiza o cache com a versão mais recente
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: tenta cache, senão mostra a página principal
        return caches.match(event.request)
          .then(cached => cached || caches.match(OFFLINE_PAGE));
      })
  );
});
