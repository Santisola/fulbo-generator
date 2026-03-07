'use client'

import { useState } from 'react'

interface HelpTooltipProps {
  title: string
  content: string | React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function HelpTooltip({ title, content, position = 'top', className = '' }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/30 transition-colors"
        title="Haz clic para más información"
      >
        <span className="text-xs font-bold">?</span>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-72 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg ${positionClasses[position]}`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="space-y-2">
            <h3 className="font-semibold text-[var(--foreground)] text-sm">{title}</h3>
            <div className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              {content}
            </div>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-2 h-2 bg-[var(--card)] border-r border-b border-[var(--border)] transform rotate-45" />
        </div>
      )}
    </div>
  )
}
