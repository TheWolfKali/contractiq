'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true)
      return
    }

    // Check if already dismissed this session
    if (sessionStorage.getItem('pwa-prompt-dismissed')) {
      setDismissed(true)
      return
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as Navigator & { standalone?: boolean }).standalone
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem('pwa-prompt-dismissed', '1')
    setDismissed(true)
    setShowIOSInstructions(false)
  }

  async function handleInstall() {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') setInstallEvent(null)
    dismiss()
  }

  if (isStandalone || dismissed) return null

  // Android/Chrome — native install prompt available
  if (installEvent) {
    return (
      <div className="flex items-center gap-3 bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-lg">
        <div className="text-2xl">📲</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Add to Home Screen</p>
          <p className="text-xs text-slate-300 leading-tight">One tap — works like an app</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Add
          </button>
          <button onClick={dismiss} className="text-slate-400 hover:text-white text-lg leading-none">
            ✕
          </button>
        </div>
      </div>
    )
  }

  // iOS — no beforeinstallprompt, show manual instructions
  if (isIOS) {
    return (
      <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-lg">
        {!showIOSInstructions ? (
          <div className="flex items-center gap-3">
            <div className="text-2xl">📲</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Add to Home Screen</p>
              <p className="text-xs text-slate-300 leading-tight">Works like an app, no App Store needed</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowIOSInstructions(true)}
                className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                How?
              </button>
              <button onClick={dismiss} className="text-slate-400 hover:text-white text-lg leading-none">
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Add to Home Screen</p>
              <button onClick={dismiss} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
            </div>
            <ol className="text-xs text-slate-300 space-y-1 list-none">
              <li>1. Tap the <strong className="text-white">Share</strong> button <span className="inline-block">⬆️</span> at the bottom of Safari</li>
              <li>2. Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong></li>
              <li>3. Tap <strong className="text-white">Add</strong> — done!</li>
            </ol>
          </div>
        )}
      </div>
    )
  }

  return null
}
