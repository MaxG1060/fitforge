import webpush from 'web-push'

let configured = false
function ensureConfigured() {
  if (configured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@fitforge.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  configured = true
}

export async function sendPush(subscription, payload) {
  ensureConfigured()
  const sub = {
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  }
  return webpush.sendNotification(sub, JSON.stringify(payload))
}
