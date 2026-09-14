import { useState } from 'react'
import { getRandomPageBackground } from '@/data/pageBackgrounds'

export function BackgroundMedia() {
  const [image] = useState(getRandomPageBackground)

  return (
    <>
      <img
        src={image}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      />
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src="/videos/gym-training.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-slate-50/80"
        aria-hidden="true"
      />
    </>
  )
}
