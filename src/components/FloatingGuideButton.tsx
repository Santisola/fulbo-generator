'use client'

import { useState } from 'react'
import { AppGuide } from '@/components/AppGuide'

export function FloatingGuideButton() {
  const [guideOpen, setGuideOpen] = useState(false)

  return (
    <>
      <AppGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      
      <button
        onClick={() => setGuideOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center z-40 font-bold text-lg"
        title="Abrir guía de la app"
        aria-label="Abrir guía de la app"
      >
        ?
      </button>
    </>
  )
}
