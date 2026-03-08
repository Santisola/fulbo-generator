'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import NProgress from 'nprogress'

export function PageLoader() {
  const pathname = usePathname()

  useEffect(() => {
    // Configurar NProgress
    NProgress.configure({ showSpinner: false, speed: 400, easing: 'ease' })

    // Detener cualquier loader previo cuando la ruta cambia
    NProgress.done()

    return () => {
      NProgress.done()
    }
  }, [pathname])

  // Interceptar clics en enlaces
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (target && target.href && !target.target && !e.ctrlKey && !e.metaKey) {
        const href = target.getAttribute('href')
        // Verificar si es una navegación interna
        if (href && (href.startsWith('/') || href.startsWith('.'))) {
          NProgress.start()
          // Detener después de 10 segundos si no se completa
          const timeout = setTimeout(() => NProgress.done(), 10000)
          return () => clearTimeout(timeout)
        }
      }
    }

    document.addEventListener('click', handleLinkClick, true)
    return () => {
      document.removeEventListener('click', handleLinkClick, true)
    }
  }, [])

  return null
}
