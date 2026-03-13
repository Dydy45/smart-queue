const CACHE_NAME = 'smartqueue-v1'
const OFFLINE_URL = '/offline'

// Ressources à pré-cacher lors de l'installation
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// ===== Installation =====
self.addEventListener('install', (event) => {
  console.log('[SW] Installation du Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pré-cache des ressources statiques')
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Certaines ressources n\'ont pas pu être pré-cachées:', err)
      })
    })
  )
  self.skipWaiting()
})

// ===== Activation =====
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation du Service Worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Suppression ancien cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// ===== Stratégies de cache =====

function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

function isStaticAsset(url) {
  return /\.(?:js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp)$/i.test(url.pathname)
}

function isNextStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/')
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/')
}

function isClerkRequest(url) {
  return url.hostname.includes('clerk')
}

function isWebSocketRequest(url) {
  return url.pathname.includes('socket') || url.pathname.includes('_next/webpack-hmr')
}

// ===== Fetch handler =====
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return

  // Ignorer WebSocket et HMR
  if (isWebSocketRequest(url)) return

  // Ignorer les requêtes Clerk (auth)
  if (isClerkRequest(url)) return

  // API routes → Network Only (données temps réel)
  if (isApiRequest(url)) return

  // Assets Next.js statiques → Cache First
  if (isNextStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Assets statiques (images, fonts, etc.) → Stale While Revalidate
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            }
            return response
          })
          .catch(() => cached)

        return cached || fetchPromise
      })
    )
    return
  }

  // Pages de navigation → Network First avec fallback cache
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL)
          })
        })
    )
    return
  }
})

// ===== Messages du client =====
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
