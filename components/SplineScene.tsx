
import React, { Suspense, lazy } from 'react'

const Spline = lazy(() => 
  // @ts-ignore
  import('@splinetool/react-spline')
    .then(module => {
      // Robustly handle default export vs named export
      const Component = module.default || module.Spline || module;
      return { default: Component };
    })
    .catch(err => {
      console.warn("Spline 3D library failed to load.", err);
      // Fallback component
      return { 
        default: () => (
          <div className="flex flex-col items-center justify-center h-full w-full text-zinc-400 text-xs font-mono p-4 text-center">
            <div className="w-6 h-6 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
            <span>Carregando 3D...</span>
          </div>
        ) 
      };
    })
);

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
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
      />
    </Suspense>
  )
}
