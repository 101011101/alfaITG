'use client'

import { Suspense, lazy } from 'react'
import { ErrorBoundary } from '../ErrorBoundary'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <span className="loader"></span>
          </div>
        }
      >
        <Spline
          scene={scene}
          className={className}
          onError={(e) =>
            console.error('Spline scene failed to load:', e)
          }
        />
      </Suspense>
    </ErrorBoundary>
  )
}
