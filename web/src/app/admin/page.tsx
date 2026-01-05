'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  telefono: string
  tipo_usuario: 'cliente' | 'prestador' | 'ambos'
  activo: boolean
  verificado: boolean
  created_at: string
  prestador_id?: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    prestadores: 0,
    clientes: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'activos' | 'inactivos'>('all')
  const [filterUserType, setFilterUserType] = useState<'all' | 'cliente' | 'prestador' | 'ambos'>('all')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      console.log('=== Cargando usuarios ===')
      
      // Intentar primero con la función que hace bypass de RLS
      let usersData = null;
      let usersError = null;
      
      try {
        const { data: functionData, error: functionError } = await supabaseAdmin
          .rpc('get_all_users');
        
        if (!functionError && functionData) {
          usersData = functionData;
          console.log('Usuarios obtenidos mediante función RPC:', usersData.length);
        } else {
          console.warn('Error al usar función RPC, intentando consulta directa:', functionError);
          // Fallback a consulta directa
          const { data: directData, error: directError } = await supabaseAdmin
            .from('users')
            .select(`
              id,
              email,
              nombre,
              apellido,
              telefono,
              tipo_usuario,
              activo,
              verificado,
              created_at
            `)
            .order('created_at', { ascending: false });
          
          usersData = directData;
          usersError = directError;
        }
      } catch (err: any) {
        console.error('Error en carga de usuarios:', err);
        usersError = err;
      }

      console.log('Resultado de consulta users:', { usersData, usersError })

      if (usersError) {
        console.error('Error al obtener usuarios:', usersError)
        throw usersError
      }

      if (!usersData || usersData.length === 0) {
        console.warn('No se encontraron usuarios en la base de datos')
        setUsers([])
        setStats({ total: 0, activos: 0, inactivos: 0, prestadores: 0, clientes: 0 })
        return
      }

      // Obtener IDs de prestadores
      const { data: prestadoresData, error: prestadoresError } = await supabaseAdmin
        .from('prestadores')
        .select('id, usuario_id')

      if (prestadoresError) {
        console.warn('Error al obtener prestadores (continuando):', prestadoresError)
      }

      const prestadoresMap = new Map(
        prestadoresData?.map(p => [p.usuario_id, p.id]) || []
      )

      const usersWithPrestador = (usersData || []).map((user: any) => ({
        ...user,
        prestador_id: prestadoresMap.get(user.id),
      }))

      console.log('Usuarios procesados:', usersWithPrestador.length)

      setUsers(usersWithPrestador as User[])

      // Calcular estadísticas
      const total = usersWithPrestador.length
      const activos = usersWithPrestador.filter((u: any) => u.activo).length
      const inactivos = total - activos
      const prestadores = usersWithPrestador.filter((u: any) => 
        u.tipo_usuario === 'prestador' || u.tipo_usuario === 'ambos'
      ).length
      const clientes = usersWithPrestador.filter((u: any) => 
        u.tipo_usuario === 'cliente' || u.tipo_usuario === 'ambos'
      ).length

      setStats({ total, activos, inactivos, prestadores, clientes })
      console.log('Estadísticas calculadas:', { total, activos, inactivos, prestadores, clientes })
    } catch (error: any) {
      console.error('Error completo al cargar usuarios:', error)
      console.error('Detalles del error:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      })
      alert(`Error al cargar usuarios: ${error?.message || 'Error desconocido'}`)
      setUsers([])
      setStats({ total: 0, activos: 0, inactivos: 0, prestadores: 0, clientes: 0 })
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      console.log('=== Actualizando estado de usuario ===')
      console.log('User ID:', userId)
      console.log('Estado actual:', currentStatus)
      console.log('Nuevo estado:', newStatus)

      // Intentar primero con la función RPC (más confiable)
      let updateSuccess = false
      let updateError = null

      try {
        const { data: rpcData, error: rpcError } = await supabaseAdmin
          .rpc('update_user_status', {
            p_user_id: userId,
            p_activo: newStatus
          })

        console.log('Resultado de RPC update_user_status:', { rpcData, rpcError })

        if (!rpcError && rpcData && rpcData.success) {
          updateSuccess = true
          console.log('Actualización exitosa mediante RPC:', rpcData)
        } else {
          updateError = rpcError
          console.warn('Error en RPC, intentando método alternativo:', rpcError)
        }
      } catch (rpcErr: any) {
        console.warn('Error al llamar RPC, intentando método alternativo:', rpcErr)
        updateError = rpcErr
      }

      // Fallback: usar update directo si RPC falla
      if (!updateSuccess) {
        const { data, error } = await supabaseAdmin
          .from('users')
          .update({ activo: newStatus })
          .eq('id', userId)
          .select()

        console.log('Resultado de actualización directa:', { data, error })

        if (error) {
          console.error('Error al actualizar:', error)
          throw error
        }

        if (!data || data.length === 0) {
          console.warn('No se recibió confirmación de la actualización')
          throw new Error('No se pudo actualizar el usuario')
        }

        const updatedUser = data[0]
        console.log('Usuario actualizado:', updatedUser)

        // Verificar que el estado se haya guardado correctamente
        if (updatedUser.activo !== newStatus) {
          console.error('El estado no se guardó correctamente. Esperado:', newStatus, 'Obtenido:', updatedUser.activo)
          throw new Error('El estado no se guardó correctamente')
        }
      }

      // Recargar usuarios desde la base de datos para asegurar que tenemos el estado real
      await loadUsers()

      console.log('Estado actualizado exitosamente')
    } catch (error: any) {
      console.error('Error updating user status:', error)
      alert(`Error al actualizar el estado del usuario: ${error?.message || 'Error desconocido'}`)
      // Recargar usuarios para mostrar el estado real
      await loadUsers()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    sessionStorage.removeItem('admin_authenticated')
    sessionStorage.removeItem('admin_user_id')
    router.push('/admin/login')
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellido.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      filterType === 'all' ||
      (filterType === 'activos' && user.activo) ||
      (filterType === 'inactivos' && !user.activo)
    
    const matchesUserType =
      filterUserType === 'all' ||
      user.tipo_usuario === filterUserType

    return matchesSearch && matchesStatus && matchesUserType
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-color.png"
              alt="ofiSí Logo"
              width={120}
              height={72}
              className="h-auto"
              loading="eager"
            />
            <h1 className="text-2xl font-bold text-gray-900">Dashboard de Administración</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/estadisticas"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Estadísticas
            </Link>
            <Link
              href="/admin/categorias"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Gestión de Categorías
            </Link>
            <Link
              href="/admin/promociones"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Gestión de Promociones
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">Total Usuarios</h2>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">Activos</h2>
            <p className="text-3xl font-bold text-green-600">{stats.activos}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">Inactivos</h2>
            <p className="text-3xl font-bold text-red-600">{stats.inactivos}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">Prestadores</h2>
            <p className="text-3xl font-bold text-purple-600">{stats.prestadores}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">Clientes</h2>
            <p className="text-3xl font-bold text-orange-600">{stats.clientes}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por email, nombre..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Usuario
              </label>
              <select
                value={filterUserType}
                onChange={(e) => setFilterUserType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="cliente">Cliente</option>
                <option value="prestador">Prestador</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verificado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">
                              {user.nombre} {user.apellido}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">{user.telefono}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.tipo_usuario === 'prestador'
                              ? 'bg-purple-100 text-purple-800'
                              : user.tipo_usuario === 'ambos'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {user.tipo_usuario}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.verificado
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.verificado ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => toggleUserStatus(user.id, user.activo)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              user.activo
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {user.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
