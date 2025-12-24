'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // Si estamos en la página de login, no verificar autenticación
      if (pathname === '/admin/login') {
        setLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/admin/login')
          return
        }

        // Verificar si es admin
        const adminAuth = sessionStorage.getItem('admin_authenticated')
        if (!adminAuth) {
          router.push('/admin/login')
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

