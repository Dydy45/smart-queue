'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true
}

export default function OfflineIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (isOnline) return null

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 bg-warning text-warning-content px-4 py-2 text-center text-sm font-medium z-9999 shadow-md"
    >
      ⚠️ Mode hors-ligne — Certaines fonctionnalités sont limitées
    </div>
  )
}
