/*
  TODO: As user scrolls down, show the ascii animation moving downwards faster, and vice versa.
  For now, just have it move downwards slowly in an infinite loop.

  but i might want to change the animation to be more interesting later on
*/

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Props {
  html: string
  className?: string
}

export default function AsciiAnimation({ html, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html
  }, [html])

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 800 }}
      transition={{
        duration: 12,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeIn',
      }}
      ref={ref}
      className={`[&_div]:leading-[1] ${className}`}
      style={{ lineHeight: 1 }}
    />
  )
}
