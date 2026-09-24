import React, { useEffect, useState } from 'react'
import { animate, useMotionValue } from 'framer-motion'

export function CountUp({
  value,
  duration = 0.9,
  format,
  className,
}: {
  value: number
  duration?: number
  format?: (n: number) => string
  className?: string
}) {
  const motionVal = useMotionValue(0)
  const [display, setDisplay] = useState(format ? format(0) : '0')

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setDisplay(format ? format(latest) : latest.toFixed(0))
      },
    })
    return () => controls.stop()
  }, [value, duration, format, motionVal])

  return <span className={className}>{display}</span>
}
