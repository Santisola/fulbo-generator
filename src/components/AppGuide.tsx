'use client'

import { useState } from 'react'

interface AppGuideProps {
  isOpen: boolean
  onClose: () => void
}

export function AppGuide({ isOpen, onClose }: AppGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: '¡Bienvenido a Fulbo Teams Generator!',
      description: 'Esta app te ayuda a generar equipos balanceados para fútbol 5 de forma justa y automática.',
      icon: '⚽'
    },
    {
      title: 'Concepto Principal',
      description: 'El sistema funciona con PUNTAJES OCULTOS: cada miembro del grupo puntúa a los jugadores de 1-10 según su nivel, pero solo ve su propio puntaje. El promedio de todos los puntajes se usa para balancear equipos.',
      icon: '🔐'
    },
    {
      title: 'Paso 1: Crear un Grupo',
      description: 'Desde el dashboard, haz clic en "Crear Grupo". Se generará un código único que puedes compartir con otros para que se unan como miembros.',
      icon: '👥'
    },
    {
      title: 'Paso 2: Agregar Jugadores',
      description: 'Como admin del grupo, puedes agregar jugadores. Solo necesitas su nombre. Los jugadores aparecerán en la lista de tu grupo.',
      icon: '👤'
    },
    {
      title: 'Paso 3: Puntuar Jugadores',
      description: 'Cada miembro del grupo puntúa a los jugadores del 1-10 según su nivel. Tus puntajes son privados: solo tú ves lo que pusiste. Luego puedes editar tus puntajes si cambias de opinión.',
      icon: '⭐'
    },
    {
      title: 'Paso 4: Configurar Restricciones',
      description: 'Como admin, puedes configurar reglas especiales (Restricciones) para evitar conflictos o mantener compañerismo entre jugadores.',
      icon: '⚙️'
    },
    {
      title: 'Tipos de Restricciones',
      description: '⚡ NO PUEDEN JUGAR ENFRENTADOS: Evita que personas con conflicto jueguen una contra la otra.\n\n🤝 DEBEN ESTAR EN MISMO EQUIPO: Mantiene unidos a jugadores que siempre juegan juntos (amigos, hermanos, etc.)',
      icon: '🎯'
    },
    {
      title: 'Paso 5: Generar Equipos',
      description: 'Con 4+ jugadores y puntajes registrados, haz clic en "Generar Equipos". El sistema crea 2 equipos BALANCEADOS respetando todas las restricciones configuradas.',
      icon: '⚡'
    },
    {
      title: 'Cómo Funciona el Balanceo',
      description: 'El algoritmo itera 100 veces buscando la mejor combinación que:\n1. Minimiza la diferencia de promedio entre equipos\n2. Respeta todas las restricciones\n3. No repite equipos recientes\n4. Distribuye el nivel de juego equitativamente',
      icon: '🧠'
    },
    {
      title: '¡Listo!',
      description: 'Ya sabes cómo funciona. Ahora puedes crear un grupo y comenzar a generar equipos justos y equilibrados.',
      icon: '🎉'
    }
  ]

  const currentStepData = steps[currentStep]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-2xl my-auto flex flex-col max-h-[90vh] sm:max-h-[95vh]">
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 bg-[var(--card)] border-b border-[var(--border)] p-4 sm:p-6 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Guía de la App</h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6">
          {/* Icono y Título */}
          <div className="text-center">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{currentStepData.icon}</div>
            <h3 className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{currentStepData.title}</h3>
          </div>

          {/* Descripción */}
          <div className="bg-[var(--secondary)] rounded-lg p-3 sm:p-4">
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] whitespace-pre-wrap leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Indicador de progreso */}
          <div className="space-y-2">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-[var(--primary)]'
                      : index < currentStep
                      ? 'bg-[var(--primary)]/50'
                      : 'bg-[var(--border)]'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[var(--muted-foreground)] text-center">
              Paso {currentStep + 1} de {steps.length}
            </p>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex-shrink-0 sticky bottom-0 bg-[var(--card)] border-t border-[var(--border)] p-4 sm:p-6 gap-2 sm:gap-3 flex flex-col sm:flex-row justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 sm:px-6 py-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity text-sm sm:text-base"
          >
            ← Anterior
          </button>

          <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-lg hover:opacity-90 text-sm sm:text-base"
            >
              Cerrar
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              className="px-4 sm:px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity text-sm sm:text-base"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
