'use client'

import { useState, useEffect, useTransition } from 'react'
import { useToast } from './ToastProvider'
import { subscribePush, unsubscribePush } from '@/app/actions/push'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export default function PushNotificationsCard({ vapidPublicKey }) {
  const toast = useToast()
  const [pending, start] = useTransition()
  const [supported, setSupported] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false)
      return
    }
    setPermission(Notification.permission)
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        setSubscription(sub)
        setEnabled(true)
      }
    })
  }, [])

  async function enable() {
    if (!vapidPublicKey) {
      toast.error('Push not configured (missing VAPID key).')
      return
    }
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        let perm = Notification.permission
        if (perm !== 'granted') {
          perm = await Notification.requestPermission()
          setPermission(perm)
          if (perm !== 'granted') {
            toast.error('Notifications blocked. Enable them in your browser settings.')
            return
          }
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })
        const json = sub.toJSON()
        const res = await subscribePush({
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          userAgent: navigator.userAgent,
        })
        if (res?.error) throw new Error(res.error)
        setSubscription(sub)
        setEnabled(true)
        toast.success('Daily notifications enabled.')
      } catch (e) {
        toast.error(e.message ?? 'Could not enable notifications.')
      }
    })
  }

  async function disable() {
    start(async () => {
      try {
        if (subscription) {
          const endpoint = subscription.endpoint
          await subscription.unsubscribe()
          await unsubscribePush({ endpoint })
        }
        setSubscription(null)
        setEnabled(false)
        toast.success('Notifications disabled.')
      } catch (e) {
        toast.error(e.message ?? 'Could not disable.')
      }
    })
  }

  async function sendTest() {
    start(async () => {
      try {
        const res = await fetch('/api/push/test', { method: 'POST' })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        toast.success(`Test sent to ${data.sent} device${data.sent === 1 ? '' : 's'}.`)
      } catch (e) {
        toast.error(e.message)
      }
    })
  }

  if (!supported) {
    return (
      <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">Notifications</p>
        <p className="text-sm text-zinc-400">
          Web push isn&apos;t supported in this browser. On iPhone, add FitForge to your home screen and open it from there.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6 space-y-4">
      <div>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Notifications</p>
        <p className="mt-2 text-sm text-zinc-400">
          Get a daily push with today&apos;s session — sport and duration.
        </p>
      </div>

      {permission === 'denied' && (
        <p className="text-xs text-amber-400">
          Notifications are blocked. Re-enable them in your browser site settings, then reload.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {enabled ? (
          <>
            <button
              onClick={disable}
              disabled={pending}
              className="rounded-md border border-zinc-800 bg-transparent px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
            >
              Turn off
            </button>
            <button
              onClick={sendTest}
              disabled={pending}
              className="rounded-md bg-orange-500 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
            >
              Send test
            </button>
          </>
        ) : (
          <button
            onClick={enable}
            disabled={pending || permission === 'denied'}
            className="rounded-md bg-orange-500 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Enabling…' : 'Enable daily push'}
          </button>
        )}
      </div>
    </div>
  )
}
