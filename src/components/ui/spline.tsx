'use client'

import { Suspense, lazy, useEffect, useState } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

function Placeholder({ className }: { className?: string }) {
  return (
    <div
      className={
        'w-full h-full relative overflow-hidden ' +
        'bg-[radial-gradient(ellipse_at_center,oklch(0.30_0.12_265/0.35)_0%,transparent_65%)] ' +
        (className ?? '')
      }
      aria-hidden="true"
    >
      {/* subtle shimmer so the area doesn't look broken */}
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_40%,oklch(0.45_0.18_260/0.08)_50%,transparent_60%)] animate-[shimmer_2.4s_linear_infinite] bg-[length:200%_100%]" />
      <style jsx>{`
        @keyframes shimmer {
          from { background-position: -100% 0; }
          to { background-position: 100% 0; }
        }
      `}</style>
    </div>
  )
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  // Defer mounting Spline until the main thread is idle, so it doesn't block
  // initial paint / LCP of the hero text.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }
    if (w.requestIdleCallback) {
      w.requestIdleCallback(() => setReady(true), { timeout: 600 })
    } else {
      const t = setTimeout(() => setReady(true), 250)
      return () => clearTimeout(t)
    }
  }, [])

  if (!ready) {
    return <Placeholder className={className} />
  }

  return (
    <Suspense fallback={<Placeholder className={className} />}>
      <Spline scene={scene} className={className} />
    </Suspense>
  )
}
