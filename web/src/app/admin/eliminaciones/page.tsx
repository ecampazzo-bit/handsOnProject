'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

interface SolicitudEliminacion {
  id: number
  usuario_id: string
  fecha_solicitud: string
  fecha_eliminacion: string
  estado: 'pendiente' | 'cancelada' | 'procesada'
  motivo: string | null
  procesada_at: string | null
  cancelada_at: string | null
  usuario?: {
    email: string
    nombre: string
    apellido: string
  }
}

export default function EliminacionesPage() {
  const router = useRouter()
  const [solicitudes, setSolicitudes] = useState<SolicitudEliminacion[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEstado, setFilterEstado] = useState<'all' | 'pendiente' | 'cancelada' | 'procesada'>('all')

  useEffect(() => {
    loadSolicitudes()
  }, [filterEstado])

  const loadSolicitudes = async () => {
    try {
      setLoading(true)
      
      let query = supabaseAdmin
        .from('solicitudes_eliminacion')
        .select('*')
        .order('fecha_solicitud', { ascending: false })

      if (filterEstado !== 'all') {
        query = query.eq('estado', filterEstado)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Cargar información de usuarios
      if (data && data.length > 0) {
        const userIds = data.map(s => s.usuario_id)
        const { data: usuariosData } = await supabaseAdmin
          .from('users')
          .select('id, email, nombre, apellido')
          .in('id', userIds)

        const usuariosMap = new Map(
          usuariosData?.map(u => [u.id, u]) || []
        )

        const solicitudesConUsuarios = data.map(s => ({
          ...s,
          usuario: usuariosMap.get(s.usuario_id)
        }))

        setSolicitudes(solicitudesConUsuarios as SolicitudEliminacion[])
      } else {
        setSolicitudes([])
      }
    } catch (error: any) {
      console.error('Error cargando solicitudes:', error)
      alert('Error al cargar las solicitudes de eliminación')
    } finally {
      setLoading(false)
    }
  }

  const procesarEliminacion = async (usuarioId: string, solicitudId: number) => {
    if (!confirm('¿Está seguro de que desea procesar esta eliminación ahora? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      // Llamar a la función para procesar la eliminación
      const { data, error } = await supabaseAdmin.rpc('procesar_eliminacion_cuenta', {
        p_usuario_id: usuarioId
      })

      if (error) {
        throw error
      }

      if (data && data.success) {
        alert('Eliminación procesada exitosamente')
        loadSolicitudes()
      } else {
        throw new Error(data?.error || 'Error al procesar la eliminación')
      }
    } catch (error: any) {
      console.error('Error procesando eliminación:', error)
      alert('Error al procesar la eliminación: ' + (error.message || 'Error desconocido'))
    }
  }

  const calcularDiasRestantes = (fechaEliminacion: string) => {
    const ahora = new Date()
    const eliminacion = new Date(fechaEliminacion)
    const diff = eliminacion.getTime() - ahora.getTime()
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return dias
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente')
  const procesadas = solicitudes.filter(s => s.estado === 'procesada')
  const canceladas = solicitudes.filter(s => s.estado === 'cancelada')

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Volver al Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Eliminación de Cuenta</h1>
          <p className="text-gray-600 mt-2">
            Gestiona las solicitudes de eliminación de cuenta con período de gracia de 60 días
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold">{solicitudes.length}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200">
            <div className="text-sm text-yellow-700">Pendientes</div>
            <div className="text-2xl font-bold text-yellow-700">{pendientes.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
            <div className="text-sm text-green-700">Procesadas</div>
            <div className="text-2xl font-bold text-green-700">{procesadas.length}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-700">Canceladas</div>
            <div className="text-2xl font-bold text-gray-700">{canceladas.length}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterEstado('all')}
              className={`px-4 py-2 rounded ${filterEstado === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterEstado('pendiente')}
              className={`px-4 py-2 rounded ${filterEstado === 'pendiente' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilterEstado('procesada')}
              className={`px-4 py-2 rounded ${filterEstado === 'procesada' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Procesadas
            </button>
            <button
              onClick={() => setFilterEstado('cancelada')}
              className={`px-4 py-2 rounded ${filterEstado === 'cancelada' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Canceladas
            </button>
          </div>
        </div>

        {/* Lista de solicitudes */}
        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">No hay solicitudes de eliminación</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Solicitud
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Eliminación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días Restantes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {solicitudes.map((solicitud) => {
                  const diasRestantes = solicitud.estado === 'pendiente' 
                    ? calcularDiasRestantes(solicitud.fecha_eliminacion)
                    : null
                  
                  return (
                    <tr key={solicitud.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {solicitud.usuario?.nombre} {solicitud.usuario?.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {solicitud.usuario?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(solicitud.fecha_solicitud)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(solicitud.fecha_eliminacion)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {diasRestantes !== null ? (
                          <span className={`text-sm font-medium ${
                            diasRestantes <= 7 ? 'text-red-600' : 
                            diasRestantes <= 30 ? 'text-yellow-600' : 
                            'text-gray-600'
                          }`}>
                            {diasRestantes} días
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          solicitud.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          solicitud.estado === 'procesada' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {solicitud.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {solicitud.estado === 'pendiente' && (
                          <button
                            onClick={() => procesarEliminacion(solicitud.usuario_id, solicitud.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Procesar ahora
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
