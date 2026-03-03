/**
 * Réexport du hook useToast depuis ToastProvider
 * Pour maintenir une séparation des préoccupations
 */

'use client'

export { useToast } from './ToastProvider'
export type { ToastType, Toast, ToastContextType } from './toast-types'
