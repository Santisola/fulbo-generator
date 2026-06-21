'use client'

import { useEffect, useState } from 'react'

const DONATION_REASONS = [
  'a pagar la canchita del martes que viene 🏟️',
  'para el pancho y la gaseosa post partido 🌭',
  'a comprar una pelota nueva (la anterior la colgamos) ⚽',
  'a mantener esta app gratis y sin publicidad 🙌'
]

export function Footer() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) =>
        prev >= DONATION_REASONS.length - 1 ? 0 : prev + 1
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)] mt-16">
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        {/* Nombre del proyecto con gradiente */}
        <p className="text-2xl font-bold uppercase tracking-[0.3em] bg-gradient-to-r from-[var(--primary)] via-[var(--foreground)] to-[var(--primary)] bg-clip-text text-transparent">
          Fulbo Teams
        </p>

        {/* Autoría */}
        <p className="mt-3 text-xs uppercase tracking-[0.35em] text-[var(--muted-foreground)]">
          Desarrollado por Santiago Isola
        </p>

        {/* Botón / CTA tipo pill con borde */}
        <a
          href="https://cafecito.app/santisola"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-8 inline-flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40 px-6 py-3.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] transition-all hover:border-[var(--primary)]/60 hover:bg-[var(--secondary)] hover:scale-[1.02]"
        >
          <span className="text-base transition-transform group-hover:rotate-12">☕</span>
          Fulbo Teams me costó varios cafés — convidame uno
        </a>

        {/* Mensaje rotativo animado: para qué sirve la donación */}
        <p className="mt-6 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Tu cafecito va destinado{' '}
          <span
            key={index}
            className="footer-message inline-block text-[var(--foreground)]"
            aria-live="polite"
          >
            {DONATION_REASONS[index]}
          </span>
        </p>

        {/* Cierre */}
        <p className="mt-10 text-[10px] uppercase tracking-[0.25em] text-[var(--muted-foreground)]/70">
          Hecho con ⚽ y mate · © {new Date().getFullYear()} Fulbo Teams
        </p>
      </div>
    </footer>
  )
}
