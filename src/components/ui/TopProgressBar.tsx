import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Thin top progress bar that animates on every route change.
 * Inspired by NProgress / YouTube-style loading indicator.
 */
export function TopProgressBar() {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const start = () => {
    clear()
    setProgress(0)
    setVisible(true)

    // Quickly jump to 20%, then crawl toward 90%
    timerRef.current = setTimeout(() => {
      setProgress(20)

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(intervalRef.current!)
            return 90
          }
          // Slow down as it gets closer to 90
          const increment = (90 - prev) * 0.08
          return prev + Math.max(increment, 0.5)
        })
      }, 100)
    }, 10)
  }

  const finish = () => {
    clear()
    setProgress(100)
    // Hide bar after transition completes
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 400)
  }

  useEffect(() => {
    start()
    // Small delay simulates async page work before finishing
    timerRef.current = setTimeout(finish, 300)

    return () => clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search])

  if (!visible && progress === 0) return null

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] w-full"
      aria-hidden="true"
    >
      <div
        className="h-full bg-brand-500 shadow-[0_0_10px_0px] shadow-brand-500/60 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  )
}
