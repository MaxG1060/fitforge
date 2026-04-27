'use client'

import { useState, useTransition } from 'react'
import { useToast } from '@/components/ToastProvider'
import {
  disconnectStrava,
  disconnectWhoop,
  resetOnboarding,
  deleteAccount,
} from '@/app/actions/settings'
import GoalCard from '@/components/GoalCard'

export default function SettingsClient({ email, createdAt, onboardedAt, strava, whoopConnected, goalId }) {
  const toast = useToast()
  const [pending, start] = useTransition()
  const [confirming, setConfirming] = useState(null)

  function run(action, successMsg) {
    return () => {
      start(async () => {
        const res = await action()
        if (res?.error) toast.error(res.error)
        else if (successMsg) toast.success(successMsg)
      })
    }
  }

  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">Settings</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight">Account</h2>
      </div>

      <Section title="Account">
        <Row label="Email" value={email} />
        <Row
          label="Member since"
          value={createdAt ? new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
        />
      </Section>

      <GoalCard initialGoalId={goalId} />

      <Section title="Integrations">
        <IntegrationRow
          label="Strava"
          accent="#fc4c02"
          desc={strava ? `Connected${strava.firstname ? ` as ${strava.firstname}` : ''}` : 'Auto-import runs, rides, and workouts'}
          connected={!!strava}
          connectHref="/api/strava/connect"
          onDisconnect={run(disconnectStrava, 'Strava disconnected.')}
          pending={pending}
          confirming={confirming === 'strava'}
          setConfirming={() => setConfirming(confirming === 'strava' ? null : 'strava')}
        />
        <IntegrationRow
          label="WHOOP"
          accent="#10b981"
          desc={whoopConnected ? 'Connected' : 'Pull recovery, sleep, and strain'}
          connected={whoopConnected}
          connectHref="/api/whoop/connect"
          onDisconnect={run(disconnectWhoop, 'WHOOP disconnected.')}
          pending={pending}
          confirming={confirming === 'whoop'}
          setConfirming={() => setConfirming(confirming === 'whoop' ? null : 'whoop')}
        />
      </Section>

      <Section title="App">
        <Row
          label="Onboarding"
          value={onboardedAt ? `Completed ${new Date(onboardedAt).toLocaleDateString()}` : 'Not completed'}
          action={
            <button
              onClick={() => start(() => resetOnboarding())}
              disabled={pending}
              className="rounded-md border border-zinc-800 bg-transparent px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
            >
              Run again
            </button>
          }
        />
      </Section>

      <Section title="Danger zone" tone="danger">
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Permanently delete your account, all body metrics, plans, and connected tokens. This can&apos;t be undone.
          </p>
          {confirming === 'delete' ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => start(() => deleteAccount())}
                disabled={pending}
                className="rounded-md bg-red-600 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {pending ? 'Deleting…' : 'Yes, delete everything'}
              </button>
              <button
                onClick={() => setConfirming(null)}
                disabled={pending}
                className="rounded-md border border-zinc-800 bg-transparent px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming('delete')}
              className="rounded-md border border-red-900 bg-red-950/30 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-red-300 hover:bg-red-950/60 transition-colors"
            >
              Delete account
            </button>
          )}
        </div>
      </Section>
    </>
  )
}

function Section({ title, tone = 'default', children }) {
  const border = tone === 'danger' ? 'border-red-950/60' : 'border-zinc-900'
  const titleColor = tone === 'danger' ? 'text-red-400' : 'text-zinc-500'
  return (
    <div className={`rounded-lg border ${border} bg-zinc-950 p-6`}>
      <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${titleColor} mb-4`}>{title}</p>
      {children}
    </div>
  )
}

function Row({ label, value, action }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-t border-zinc-900 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">{label}</p>
        <p className="mt-1 text-sm text-white truncate">{value}</p>
      </div>
      {action}
    </div>
  )
}

function IntegrationRow({ label, accent, desc, connected, connectHref, onDisconnect, pending, confirming, setConfirming }) {
  return (
    <div className="py-3 border-t border-zinc-900 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: connected ? accent : '#3f3f46' }} />
            <p className="text-sm font-bold text-white">{label}</p>
            {connected && (
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-400">Connected</span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500 truncate">{desc}</p>
        </div>
        {connected ? (
          confirming ? (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={onDisconnect}
                disabled={pending}
                className="rounded-md bg-red-600 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={setConfirming}
                disabled={pending}
                className="rounded-md border border-zinc-800 bg-transparent px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={setConfirming}
              className="rounded-md border border-zinc-800 bg-transparent px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 transition-colors shrink-0"
            >
              Disconnect
            </button>
          )
        ) : (
          <a
            href={connectHref}
            className="rounded-md bg-orange-500 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 transition-colors shrink-0"
          >
            Connect
          </a>
        )}
      </div>
    </div>
  )
}
